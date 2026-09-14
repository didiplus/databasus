import { App, Button, Modal, Spin } from 'antd';
import { useEffect, useState } from 'react';

import {
  type Database,
  DatabaseType,
  type ShouldSuggestReadOnlyUserResponse,
  databaseApi,
  getDatabaseTypeLabel,
} from '../../../../entity/databases';
import { useTranslation } from '../../../../shared/i18n';

interface Props {
  database: Database;
  onReadOnlyUserUpdated: (database: Database) => void;

  onGoBack: () => void;
  onSkipped: () => void;
  onReadOnlyUserNotSuggested: () => void;
}

const PRIVILEGES_TRUNCATE_LENGTH = 50;

const FORCED_WAL_ROTATION_WARNING_SECONDS = 15;

export const CreateReadOnlyComponent = ({
  database,
  onReadOnlyUserUpdated,
  onGoBack,
  onSkipped,
  onReadOnlyUserNotSuggested,
}: Props) => {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [isCheckingReadOnlyUserSuggestion, setIsCheckingReadOnlyUserSuggestion] = useState(false);
  const [isCreatingReadOnlyUser, setIsCreatingReadOnlyUser] = useState(false);
  const [isShowSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [privileges, setPrivileges] = useState<string[]>([]);
  const [isPrivilegesExpanded, setIsPrivilegesExpanded] = useState(false);

  const isLogicalPostgres = database.type === DatabaseType.POSTGRES_LOGICAL;
  const isPhysicalPostgres = database.type === DatabaseType.POSTGRES_PHYSICAL;
  const isMysql = database.type === DatabaseType.MYSQL;
  const isMariadb = database.type === DatabaseType.MARIADB;
  const isMongodb = database.type === DatabaseType.MONGODB;
  const databaseTypeName = getDatabaseTypeLabel(database.type);

  const privilegesLabel = isMongodb ? t('databases.roles') : t('databases.privileges');
  const userKindNoun = isPhysicalPostgres ? t('databases.replicationOnlyUser') : t('databases.readOnlyUser');

  const fetchReadOnlyUserSuggestion =
    async (): Promise<ShouldSuggestReadOnlyUserResponse | null> => {
      try {
        return await databaseApi.shouldSuggestReadOnlyUser(database);
      } catch (e) {
        message.error((e as Error).message);
        return null;
      }
    };

  const getPrivilegesDisplay = () => {
    const fullText = privileges.join(', ');
    if (isPrivilegesExpanded || fullText.length <= PRIVILEGES_TRUNCATE_LENGTH) {
      return fullText;
    }

    return fullText.substring(0, PRIVILEGES_TRUNCATE_LENGTH) + '...';
  };

  const shouldShowExpandToggle = () => {
    const fullText = privileges.join(', ');
    return fullText.length > PRIVILEGES_TRUNCATE_LENGTH;
  };

  const provisionAndApplyReplicationOnlyUserCredentials = async () => {
    const response = await databaseApi.createReplicationOnlyUser(database);

    if (database.postgresqlPhysical) {
      database.postgresqlPhysical.username = response.username;
      database.postgresqlPhysical.password = response.password;
    }

    if (!response.isForcedWalRotationAvailable) {
      message.warning(
        t('databases.walRotationWarning'),
        FORCED_WAL_ROTATION_WARNING_SECONDS,
      );
    }
  };

  const provisionAndApplyReadOnlyUserCredentials = async () => {
    const response = await databaseApi.createReadOnlyUser(database);

    if (isLogicalPostgres && database.postgresqlLogical) {
      database.postgresqlLogical.username = response.username;
      database.postgresqlLogical.password = response.password;
    } else if (isMysql && database.mysql) {
      database.mysql.username = response.username;
      database.mysql.password = response.password;
    } else if (isMariadb && database.mariadb) {
      database.mariadb.username = response.username;
      database.mariadb.password = response.password;
    } else if (isMongodb && database.mongodb) {
      database.mongodb.username = response.username;
      database.mongodb.password = response.password;
    }
  };

  const provisionRestrictedUser = async () => {
    setIsCreatingReadOnlyUser(true);

    try {
      if (isPhysicalPostgres) {
        await provisionAndApplyReplicationOnlyUserCredentials();
      } else {
        await provisionAndApplyReadOnlyUserCredentials();
      }

      onReadOnlyUserUpdated(database);
    } catch (e) {
      message.error((e as Error).message);
    }

    setIsCreatingReadOnlyUser(false);
  };

  const handleSkip = () => {
    setShowSkipConfirmation(true);
  };

  const handleSkipConfirmed = () => {
    setShowSkipConfirmation(false);
    onSkipped();
  };

  useEffect(() => {
    const run = async () => {
      setIsCheckingReadOnlyUserSuggestion(true);

      const readOnlyUserSuggestion = await fetchReadOnlyUserSuggestion();
      setPrivileges(readOnlyUserSuggestion?.privileges || []);

      // A failed check must not silently advance the wizard - keep the screen so the user
      // still gets the choice.
      if (readOnlyUserSuggestion && !readOnlyUserSuggestion.shouldSuggestReadOnlyUser) {
        onReadOnlyUserNotSuggested();
      }

      setIsCheckingReadOnlyUserSuggestion(false);
    };
    run();
  }, []);

  if (isCheckingReadOnlyUserSuggestion) {
    return (
      <div className="flex items-center">
        <Spin />
        <span className="ml-3">{t('databases.checkingUserKind', { kind: userKindNoun })}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <p className="mb-3 text-lg font-bold">{t('databases.createUserKindQuestion', { kind: userKindNoun })}</p>

        <p className="mb-2">
          {t('databases.readOnlyUserExplanation', { kind: userKindNoun, type: databaseTypeName })}
        </p>

        <ul className="mb-2 ml-5 list-disc">
          <li>{t('databases.readOnlyBenefit1')}</li>
          <li>{t('databases.readOnlyBenefit2')}</li>
          <li>{t('databases.readOnlyBenefit3')}</li>
        </ul>

        <p className="mb-2">
          {t('databases.securityEnforcePrefix')}{' '}
          <a
            href="https://databasus.com/security"
            target="_blank"
            rel="noreferrer"
            className="!text-blue-600 dark:!text-blue-400"
          >
            {t('databases.readInDetailsHere')}
          </a>{' '}
          {t('databases.securityEnforceSuffix')}
        </p>

        <p className="mt-3">
          <b>{t('databases.avoidWriteCredentials', { kind: userKindNoun })}</b>.{' '}
          {t('databases.worstCaseHacking')}
        </p>

        <p className="mt-3">
          {privileges.length === 0 ? (
            <b>{t('databases.currentUserNoWrite', { label: privilegesLabel })}</b>
          ) : (
            <>
              <b>{t('databases.currentUserHasWrite', { label: privilegesLabel })}</b>{' '}
              <span
                className={shouldShowExpandToggle() ? 'cursor-pointer hover:opacity-80' : ''}
                onClick={() =>
                  shouldShowExpandToggle() && setIsPrivilegesExpanded(!isPrivilegesExpanded)
                }
              >
                {getPrivilegesDisplay()}
                {shouldShowExpandToggle() && (
                  <span className="ml-1 text-xs text-blue-600 hover:opacity-80">
                    ({isPrivilegesExpanded ? t('databases.collapse') : t('databases.expand')})
                  </span>
                )}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="mt-5 flex">
        <Button className="mr-auto" type="primary" ghost onClick={() => onGoBack()}>
          {t('common.back')}
        </Button>

        <Button className="mr-2 ml-auto" danger ghost onClick={handleSkip}>
          {t('common.skip')}
        </Button>

        <Button
          type="primary"
          onClick={provisionRestrictedUser}
          loading={isCreatingReadOnlyUser}
          disabled={isCreatingReadOnlyUser}
        >
          {t('databases.yesCreateUserKind', { kind: userKindNoun })}
        </Button>
      </div>

      <Modal
        title={t('databases.skipUserKindCreation', { kind: userKindNoun })}
        open={isShowSkipConfirmation}
        onCancel={() => setShowSkipConfirmation(false)}
        footer={null}
        width={450}
      >
        <div className="mb-5">
          <p className="mb-2">{t('databases.skipCreationConfirm', { kind: userKindNoun })}</p>

          <p className="mb-2">
            {t('databases.skipSecurityWarning')}
          </p>

          <p>
            {t('databases.protectionNeverPossible')}
          </p>
        </div>

        <div className="flex justify-end">
          <Button className="mr-2" danger ghost onClick={handleSkipConfirmed}>
            {t('databases.acceptRisks')}
          </Button>

          <Button type="primary" onClick={() => setShowSkipConfirmation(false)}>
            {t('databases.continueSecureWay')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
