import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { App, Button, Modal, Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

import type { LogicalBackup } from '../../../entity/backups/logical';
import { type Database, DatabaseType } from '../../../entity/databases';
import { type Restore, RestoreStatus, restoreApi } from '../../../entity/restores';
import { useTranslation } from '../../../shared/i18n';
import { ClipboardHelper } from '../../../shared/lib/ClipboardHelper';
import { getUserTimeFormat } from '../../../shared/time';
import { ConfirmationComponent } from '../../../shared/ui';
import { EditDatabaseSpecificDataComponent } from '../../databases/ui/edit/EditDatabaseSpecificDataComponent';

interface Props {
  database: Database;
  backup: LogicalBackup;
}

type DatabaseCredentials = {
  username?: string;
  host?: string;
  port?: number;
  password?: string;
};

const clearCredentials = <T extends DatabaseCredentials>(db: T | undefined): T | undefined => {
  if (!db) return undefined;
  return {
    ...db,
    username: undefined,
    host: undefined,
    port: undefined,
    password: undefined,
  } as T;
};

const createInitialEditingDatabase = (database: Database): Database => ({
  ...database,
  postgresqlLogical: clearCredentials(database.postgresqlLogical),
  mysql: clearCredentials(database.mysql),
  mariadb: clearCredentials(database.mariadb),
  mongodb: clearCredentials(database.mongodb),
});

const getRestorePayload = (database: Database, editingDatabase: Database) => {
  switch (database.type) {
    case DatabaseType.POSTGRES_LOGICAL:
      return { postgresql: editingDatabase.postgresqlLogical };
    case DatabaseType.MYSQL:
      return { mysql: editingDatabase.mysql };
    case DatabaseType.MARIADB:
      return { mariadb: editingDatabase.mariadb };
    case DatabaseType.MONGODB:
      return { mongodb: editingDatabase.mongodb };
    default:
      return {};
  }
};

export const RestoresComponent = ({ database, backup }: Props) => {
  const { message } = App.useApp();
  const { t } = useTranslation();

  const [editingDatabase, setEditingDatabase] = useState<Database>(
    createInitialEditingDatabase(database),
  );

  const [restores, setRestores] = useState<Restore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showingRestoreError, setShowingRestoreError] = useState<Restore | undefined>();

  const [isShowRestore, setIsShowRestore] = useState(false);

  const [cancellingRestoreId, setCancellingRestoreId] = useState<string | undefined>();
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [restoreToCancelId, setRestoreToCancelId] = useState<string | undefined>();

  const isReloadInProgress = useRef(false);

  const loadRestores = async () => {
    if (isReloadInProgress.current) {
      return;
    }

    isReloadInProgress.current = true;

    try {
      const restores = await restoreApi.getRestores(backup.id);
      setRestores(restores);
    } catch (e) {
      alert((e as Error).message);
    }

    isReloadInProgress.current = false;
  };

  const restore = async (editingDatabase: Database) => {
    try {
      await restoreApi.restoreBackup({
        backupId: backup.id,
        ...getRestorePayload(database, editingDatabase),
      });
      await loadRestores();

      setIsShowRestore(false);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const cancelRestore = async (restoreId: string) => {
    setCancellingRestoreId(restoreId);
    try {
      await restoreApi.cancelRestore(restoreId);
      await loadRestores();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCancellingRestoreId(undefined);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadRestores().finally(() => setIsLoading(false));

    const interval = setInterval(() => {
      loadRestores();
    }, 1_000);

    return () => clearInterval(interval);
  }, [backup.id]);

  const isRestoreInProgress = restores.some(
    (restore) => restore.status === RestoreStatus.IN_PROGRESS,
  );

  if (isShowRestore) {
    return (
      <>
        <div className="my-5 text-sm">
          {t('restores.info1')}{' '}
          <u>{t('restores.info2')}</u>. {t('restores.info3')}
          <br />
          <br />
          {t('restores.info4')}
        </div>

        <EditDatabaseSpecificDataComponent
          database={editingDatabase}
          onCancel={() => setIsShowRestore(false)}
          isShowBackButton={false}
          onBack={() => setIsShowRestore(false)}
          saveButtonText={t('restores.restoreToThisDb')}
          isSaveToApi={false}
          onSaved={(database) => {
            setEditingDatabase({ ...database });
            restore(database);
          }}
          isRestoreMode={true}
        />
      </>
    );
  }

  return (
    <div className="mt-5">
      {isLoading ? (
        <div className="flex w-full justify-center">
          <Spin />
        </div>
      ) : (
        <>
          <Button
            className="w-full"
            type="primary"
            disabled={isRestoreInProgress}
            loading={isRestoreInProgress}
            onClick={() => setIsShowRestore(true)}
          >
            {t('restores.selectDatabase')}
          </Button>

          {restores.length === 0 && (
            <div className="my-5 text-center text-gray-400">{t('restores.noRestores')}</div>
          )}

          <div className="mt-5">
            {restores.map((restore) => {
              let restoreDurationMs = 0;
              if (restore.status === RestoreStatus.IN_PROGRESS) {
                restoreDurationMs = Date.now() - new Date(restore.createdAt).getTime();
              } else {
                restoreDurationMs = restore.restoreDurationMs;
              }

              const minutes = Math.floor(restoreDurationMs / 60000);
              const seconds = Math.floor((restoreDurationMs % 60000) / 1000);
              const milliseconds = restoreDurationMs % 1000;
              const duration = `${minutes}m ${seconds}s ${milliseconds}ms`;

              const backupDurationMs = backup.backupDurationMs;
              const expectedRestoreDurationMs = backupDurationMs * 5;
              const expectedRestoreDuration = `${Math.floor(expectedRestoreDurationMs / 60000)}m ${Math.floor((expectedRestoreDurationMs % 60000) / 1000)}s`;

              return (
                <div key={restore.id} className="mb-1 rounded border border-gray-200 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex flex-1">
                      <div className="w-[75px] min-w-[75px]">{t('restores.status')}</div>

                      {restore.status === RestoreStatus.FAILED && (
                        <Tooltip title={t('restores.clickErrorDetails')}>
                          <div
                            className="flex cursor-pointer items-center text-red-600 underline"
                            onClick={() => setShowingRestoreError(restore)}
                          >
                            <ExclamationCircleOutlined
                              className="mr-2"
                              style={{ fontSize: 16, color: '#ff0000' }}
                            />

                            <div>{t('common.failed')}</div>
                          </div>
                        </Tooltip>
                      )}

                      {restore.status === RestoreStatus.COMPLETED && (
                        <div className="flex items-center">
                          <CheckCircleOutlined
                            className="mr-2"
                            style={{ fontSize: 16, color: '#008000' }}
                          />

                          <div>{t('common.successful')}</div>
                        </div>
                      )}

                      {restore.status === RestoreStatus.CANCELED && (
                        <div className="flex items-center text-gray-500">
                          <CloseCircleOutlined
                            className="mr-2"
                            style={{ fontSize: 16, color: '#808080' }}
                          />

                          <div>{t('common.canceled')}</div>
                        </div>
                      )}

                      {restore.status === RestoreStatus.IN_PROGRESS && (
                        <div className="flex items-center font-bold text-blue-600">
                          <SyncOutlined spin />
                          <span className="ml-2">{t('common.inProgress')}</span>
                        </div>
                      )}
                    </div>

                    {restore.status === RestoreStatus.IN_PROGRESS && (
                      <div className="ml-2">
                        {cancellingRestoreId === restore.id ? (
                          <SyncOutlined spin style={{ fontSize: 16 }} />
                        ) : (
                          <Tooltip title={t('restores.cancelRestore')}>
                            <CloseCircleOutlined
                              className="cursor-pointer"
                              onClick={() => {
                                if (cancellingRestoreId) return;
                                setRestoreToCancelId(restore.id);
                                setShowCancelConfirmation(true);
                              }}
                              style={{
                                color: '#ff0000',
                                fontSize: 16,
                                opacity: cancellingRestoreId ? 0.2 : 1,
                              }}
                            />
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-1 flex">
                    <div className="w-[75px] min-w-[75px]">{t('restores.startedAt')}</div>
                    <div>
                      {dayjs.utc(restore.createdAt).local().format(getUserTimeFormat().format)} (
                      {dayjs.utc(restore.createdAt).local().fromNow()})
                    </div>
                  </div>

                  {restore.status === RestoreStatus.IN_PROGRESS && (
                    <div className="flex">
                      <div className="w-[75px] min-w-[75px]">{t('restores.duration')}</div>
                      <div>
                        <div>{duration}</div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {t('restores.expectedTimeHint')}
                          <br />
                          <br />
                          {t('restores.expectedTimeCalc', { duration: expectedRestoreDuration })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showingRestoreError && (
        <Modal
          title={t('restores.errorTitle')}
          open={!!showingRestoreError}
          onCancel={() => setShowingRestoreError(undefined)}
          maskClosable={false}
          footer={
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                ClipboardHelper.copyToClipboard(showingRestoreError.failMessage || '');
                message.success(t('restores.errorMessageCopied'));
              }}
            >
              {t('common.copy')}
            </Button>
          }
        >
          {showingRestoreError.failMessage?.includes('must be owner of extension') && (
            <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-600 dark:bg-yellow-900/30">
              <strong>💡 {t('restores.tip')}</strong> {t('restores.tipContent')}
            </div>
          )}
          <div className="overflow-y-auto text-sm whitespace-pre-wrap" style={{ height: '400px' }}>
            {showingRestoreError.failMessage}
          </div>
        </Modal>
      )}

      {showCancelConfirmation && (
        <ConfirmationComponent
          onConfirm={() => {
            setShowCancelConfirmation(false);
            if (restoreToCancelId) {
              cancelRestore(restoreToCancelId);
            }
            setRestoreToCancelId(undefined);
          }}
          onDecline={() => {
            setShowCancelConfirmation(false);
            setRestoreToCancelId(undefined);
          }}
          description={t('restores.cancelWarning')}
          actionText={t('restores.yesCancelRestore')}
          actionButtonColor="red"
        />
      )}
    </div>
  );
};
