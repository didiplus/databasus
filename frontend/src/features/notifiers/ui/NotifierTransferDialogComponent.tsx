import { Button, Modal, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';

import { databaseApi } from '../../../entity/databases';
import { type Notifier, notifierApi } from '../../../entity/notifiers';
import { type WorkspaceResponse, workspaceApi } from '../../../entity/workspaces';
import { useTranslation } from '../../../shared/i18n';

interface Props {
  notifier: Notifier;
  onClose: () => void;
  onTransferred: () => void;
}

export const NotifierTransferDialogComponent = ({ notifier, onClose, onTransferred }: Props) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [isNotifierInUse, setIsNotifierInUse] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>();
  const [isTransferring, setIsTransferring] = useState(false);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const isUsing = await databaseApi.isNotifierUsing(notifier.id);
      setIsNotifierInUse(isUsing);

      if (!isUsing) {
        const response = await workspaceApi.getWorkspaces();
        const filteredWorkspaces = response.workspaces.filter((w) => w.id !== notifier.workspaceId);
        setWorkspaces(filteredWorkspaces);
      }
    } catch (e) {
      alert((e as Error).message);
    }

    setIsLoading(false);
  };

  const transferNotifier = async () => {
    if (!selectedWorkspaceId) return;

    setIsTransferring(true);

    try {
      await notifierApi.transferNotifier(notifier.id, selectedWorkspaceId);
      onTransferred();
    } catch (e) {
      alert((e as Error).message);
    }

    setIsTransferring(false);
  };

  useEffect(() => {
    loadData();
  }, [notifier.id]);

  return (
    <Modal
      title={t('notifiers.transferTitle')}
      footer={null}
      open={true}
      onCancel={onClose}
      maskClosable={false}
    >
      {isLoading ? (
        <div className="flex justify-center py-5">
          <Spin />
        </div>
      ) : isNotifierInUse ? (
        <div className="py-3">
          <div className="text-gray-700 dark:text-gray-300">
            {t('notifiers.transferUsedByDatabases')}
          </div>

          <div className="mt-5">
            <Button type="primary" onClick={onClose}>
              {t('common.ok')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-3">
          <div className="mb-3 text-gray-500 dark:text-gray-400">
            {t('notifiers.selectWorkspaceToTransfer')}
          </div>

          <div className="mb-5 flex items-center">
            <div className="min-w-[120px]">{t('notifiers.targetWorkspace')}</div>

            <Select
              value={selectedWorkspaceId}
              onChange={setSelectedWorkspaceId}
              className="min-w-[200px] grow"
              placeholder={t('common.selectWorkspace')}
              options={workspaces.map((w) => ({ label: w.name, value: w.id }))}
            />
          </div>

          <div className="flex gap-2">
            <Button type="default" onClick={onClose}>
              {t('common.cancel')}
            </Button>

            <Button
              type="primary"
              onClick={transferNotifier}
              loading={isTransferring}
              disabled={!selectedWorkspaceId || isTransferring}
            >
              {t('common.transfer')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
