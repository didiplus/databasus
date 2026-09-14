import { CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { App, Button, Checkbox, Input, InputNumber, Select, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

import {
  type Database,
  databaseApi,
  hasStoredSshTunnelSecretsForAuthType,
  isSshTunnelReadyToTest,
} from '../../../../entity/databases';
import { MariadbConnectionStringParser } from '../../../../entity/databases/model/mariadb/MariadbConnectionStringParser';
import { NAME_LIST_TOKEN_SEPARATORS, normalizeNameList } from '../../../../shared/lib';
import { ClipboardHelper } from '../../../../shared/lib/ClipboardHelper';
import { useTranslation } from '../../../../shared/i18n';
import { ToastHelper } from '../../../../shared/toast';
import { ClipboardPasteModalComponent } from '../../../../shared/ui';
import { AdvancedSettingsToggleComponent } from './AdvancedSettingsToggleComponent';
import { EditSshTunnelComponent } from './EditSshTunnelComponent';

interface Props {
  database: Database;

  isShowCancelButton?: boolean;
  onCancel: () => void;

  isShowBackButton: boolean;
  onBack: () => void;

  saveButtonText?: string;
  isSaveToApi: boolean;
  onSaved: (database: Database) => void;

  isShowDbName?: boolean;
}

export const EditMariaDbSpecificDataComponent = ({
  database,

  isShowCancelButton,
  onCancel,

  isShowBackButton,
  onBack,

  saveButtonText,
  isSaveToApi,
  onSaved,
  isShowDbName = true,
}: Props) => {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [editingDatabase, setEditingDatabase] = useState<Database>();
  const [isSaving, setIsSaving] = useState(false);

  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnectionFailed, setIsConnectionFailed] = useState(false);

  const hasAdvancedValues =
    !!database.mariadb?.isExcludeEvents ||
    !!database.mariadb?.isSkipGaleraDisable ||
    !!database.mariadb?.excludeTables?.length ||
    !!database.mariadb?.sshTunnel?.isEnabled;
  const [isShowAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  const [isShowPasteModal, setIsShowPasteModal] = useState(false);

  const applyConnectionString = (text: string) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      message.error(t('clipboard.clipboardEmpty'));
      return;
    }

    const result = MariadbConnectionStringParser.parse(trimmedText);

    if ('error' in result) {
      message.error(result.error);
      return;
    }

    if (!editingDatabase?.mariadb) return;

    const updatedDatabase: Database = {
      ...editingDatabase,
      mariadb: {
        ...editingDatabase.mariadb,
        host: result.host,
        port: result.port,
        username: result.username,
        password: result.password,
        database: result.database,
        isHttps: result.isHttps,
      },
    };

    setEditingDatabase(updatedDatabase);
    setIsConnectionTested(false);
    message.success(t('databases.connectionStringParsed'));
  };

  const parseFromClipboard = async () => {
    if (!ClipboardHelper.isClipboardApiAvailable()) {
      setIsShowPasteModal(true);
      return;
    }

    try {
      const text = await ClipboardHelper.readFromClipboard();
      applyConnectionString(text);
    } catch {
      message.error(t('clipboard.failedReadClipboard'));
    }
  };

  const testConnection = async () => {
    if (!editingDatabase?.mariadb) return;
    setIsTestingConnection(true);
    setIsConnectionFailed(false);

    const trimmedDatabase = {
      ...editingDatabase,
      mariadb: {
        ...editingDatabase.mariadb,
        password: editingDatabase.mariadb.password?.trim(),
      },
    };

    try {
      await databaseApi.testDatabaseConnectionDirect(trimmedDatabase);
      setIsConnectionTested(true);
      ToastHelper.showToast({
        title: t('databases.connectionTestPassed'),
        description: t('databases.canContinueNextStep'),
      });
    } catch (e) {
      setIsConnectionFailed(true);
      alert((e as Error).message);
    }

    setIsTestingConnection(false);
  };

  const saveDatabase = async () => {
    if (!editingDatabase?.mariadb) return;

    const trimmedDatabase = {
      ...editingDatabase,
      mariadb: {
        ...editingDatabase.mariadb,
        password: editingDatabase.mariadb.password?.trim(),
      },
    };

    if (isSaveToApi) {
      setIsSaving(true);

      try {
        await databaseApi.updateDatabase(trimmedDatabase);
      } catch (e) {
        alert((e as Error).message);
      }

      setIsSaving(false);
    }

    onSaved(trimmedDatabase);
  };

  useEffect(() => {
    setIsSaving(false);
    setIsConnectionTested(false);
    setIsTestingConnection(false);
    setIsConnectionFailed(false);

    setEditingDatabase({ ...database });
  }, [database]);

  if (!editingDatabase) return null;

  const hasStoredSshSecrets = hasStoredSshTunnelSecretsForAuthType(
    database.mariadb?.sshTunnel,
    editingDatabase.mariadb?.sshTunnel?.authType,
    database.id,
  );

  let isAllFieldsFilled = true;
  if (!editingDatabase.mariadb?.host) isAllFieldsFilled = false;
  if (!editingDatabase.mariadb?.port) isAllFieldsFilled = false;
  if (!editingDatabase.mariadb?.username) isAllFieldsFilled = false;
  if (!editingDatabase.id && !editingDatabase.mariadb?.password) isAllFieldsFilled = false;
  if (!editingDatabase.mariadb?.database) isAllFieldsFilled = false;

  if (!isSshTunnelReadyToTest(editingDatabase.mariadb?.sshTunnel, hasStoredSshSecrets))
    isAllFieldsFilled = false;

  // Behind a bastion a loopback address names the database as the bastion sees it, so the hint
  // about reaching a local database would be wrong.
  const isTunnelEnabled = !!editingDatabase.mariadb?.sshTunnel?.isEnabled;
  const isLocalhostDb =
    !isTunnelEnabled &&
    (editingDatabase.mariadb?.host?.includes('localhost') ||
      editingDatabase.mariadb?.host?.includes('127.0.0.1'));

  return (
    <div>
      <div className="mb-3 flex">
        <div className="min-w-[150px]" />
        <div
          className="cursor-pointer text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={parseFromClipboard}
        >
          <CopyOutlined className="mr-1" />
          {t('databases.parseFromClipboard')}
        </div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases.host')}</div>
        <Input
          value={editingDatabase.mariadb?.host}
          onChange={(e) => {
            if (!editingDatabase.mariadb) return;

            setEditingDatabase({
              ...editingDatabase,
              mariadb: {
                ...editingDatabase.mariadb,
                host: e.target.value.trim().replace('https://', '').replace('http://', ''),
              },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder="Enter MariaDB host"
        />
      </div>

      {isLocalhostDb && (
        <div className="mb-1 flex">
          <div className="min-w-[150px]" />
          <div className="max-w-[200px] text-xs text-gray-500 dark:text-gray-400">
            {t('databases.please')}{' '}
            <a
              href="https://databasus.com/faq/localhost"
              target="_blank"
              rel="noreferrer"
              className="!text-blue-600 dark:!text-blue-400"
            >
              {t('databases.readThisDocument')}
            </a>{' '}
            {t('databases.backupLocalDbHint')}
          </div>
        </div>
      )}

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases.port')}</div>
        <InputNumber
          type="number"
          value={editingDatabase.mariadb?.port}
          onChange={(e) => {
            if (!editingDatabase.mariadb || e === null) return;

            setEditingDatabase({
              ...editingDatabase,
              mariadb: { ...editingDatabase.mariadb, port: e },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder="Enter MariaDB port"
        />
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases.username')}</div>
        <Input
          value={editingDatabase.mariadb?.username}
          onChange={(e) => {
            if (!editingDatabase.mariadb) return;

            setEditingDatabase({
              ...editingDatabase,
              mariadb: { ...editingDatabase.mariadb, username: e.target.value.trim() },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder="Enter MariaDB username"
        />
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('common.password')}</div>
        <Input.Password
          value={editingDatabase.mariadb?.password}
          onChange={(e) => {
            if (!editingDatabase.mariadb) return;

            setEditingDatabase({
              ...editingDatabase,
              mariadb: { ...editingDatabase.mariadb, password: e.target.value },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder="Enter MariaDB password"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
      </div>

      {isShowDbName && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('databases.dbName')}</div>
          <Input
            value={editingDatabase.mariadb?.database}
            onChange={(e) => {
              if (!editingDatabase.mariadb) return;

              setEditingDatabase({
                ...editingDatabase,
                mariadb: { ...editingDatabase.mariadb, database: e.target.value.trim() },
              });
              setIsConnectionTested(false);
            }}
            size="small"
            className="max-w-[200px] grow"
            placeholder="Enter MariaDB database name"
          />
        </div>
      )}

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases.useHttps')}</div>
        <Switch
          checked={editingDatabase.mariadb?.isHttps}
          onChange={(checked) => {
            if (!editingDatabase.mariadb) return;

            setEditingDatabase({
              ...editingDatabase,
              mariadb: { ...editingDatabase.mariadb, isHttps: checked },
            });
            setIsConnectionTested(false);
          }}
          size="small"
        />
      </div>

      <AdvancedSettingsToggleComponent
        isShowAdvanced={isShowAdvanced}
        onToggle={() => setShowAdvanced(!isShowAdvanced)}
      />

      {isShowAdvanced && (
        <>
          <EditSshTunnelComponent
            sshTunnel={editingDatabase.mariadb?.sshTunnel}
            hasStoredSecrets={hasStoredSshSecrets}
            onChange={(sshTunnel) => {
              if (!editingDatabase.mariadb) return;

              setEditingDatabase({
                ...editingDatabase,
                mariadb: { ...editingDatabase.mariadb, sshTunnel },
              });
              setIsConnectionTested(false);
            }}
          />

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases.excludeEvents')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={editingDatabase.mariadb?.isExcludeEvents || false}
                onChange={(e) => {
                  if (!editingDatabase.mariadb) return;

                  setEditingDatabase({
                    ...editingDatabase,
                    mariadb: {
                      ...editingDatabase.mariadb,
                      isExcludeEvents: e.target.checked,
                    },
                  });
                }}
              >
                {t('databases.skipEvents')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('databases.skipEventsTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases.galeraReplication')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={editingDatabase.mariadb?.isSkipGaleraDisable || false}
                onChange={(e) => {
                  if (!editingDatabase.mariadb) return;

                  setEditingDatabase({
                    ...editingDatabase,
                    mariadb: {
                      ...editingDatabase.mariadb,
                      isSkipGaleraDisable: e.target.checked,
                    },
                  });
                }}
              >
                {t('databases.skipDisablingOnRestore')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('databases.galeraTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases.excludeTables')}</div>
            <Select
              mode="tags"
              value={editingDatabase.mariadb?.excludeTables || []}
              onChange={(values) => {
                if (!editingDatabase.mariadb) return;

                setEditingDatabase({
                  ...editingDatabase,
                  mariadb: { ...editingDatabase.mariadb, excludeTables: normalizeNameList(values) },
                });
              }}
              size="small"
              className="max-w-[200px] grow"
              placeholder={t('databases.noTablesExcluded')}
              tokenSeparators={NAME_LIST_TOKEN_SEPARATORS}
            />

            <Tooltip
              className="cursor-pointer"
              title={t('databases.excludeTablesTooltip')}
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>
        </>
      )}

      <div className="mt-5 flex">
        {isShowCancelButton && (
          <Button className="mr-1" danger ghost onClick={() => onCancel()}>
            {t('common.cancel')}
          </Button>
        )}

        {isShowBackButton && (
          <Button className="mr-auto" type="primary" ghost onClick={() => onBack()}>
            {t('common.back')}
          </Button>
        )}

        {!isConnectionTested && (
          <Button
            type="primary"
            onClick={() => testConnection()}
            loading={isTestingConnection}
            disabled={!isAllFieldsFilled}
            className="mr-5"
          >
            {t('common.testConnection')}
          </Button>
        )}

        {isConnectionTested && (
          <Button
            type="primary"
            onClick={() => saveDatabase()}
            loading={isSaving}
            disabled={!isAllFieldsFilled}
            className="mr-5"
          >
            {saveButtonText || t('common.save')}
          </Button>
        )}
      </div>

      {isConnectionFailed && (
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {t('databases.ipWhitelistHint')}
        </div>
      )}

      <ClipboardPasteModalComponent
        open={isShowPasteModal}
        onSubmit={(text) => {
          setIsShowPasteModal(false);
          applyConnectionString(text);
        }}
        onCancel={() => setIsShowPasteModal(false)}
      />
    </div>
  );
};
