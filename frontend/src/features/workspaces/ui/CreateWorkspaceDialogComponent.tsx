import { LoadingOutlined } from '@ant-design/icons';
import { App, Button, Input, Modal } from 'antd';
import { Spin } from 'antd';
import { useState } from 'react';

import { type UserProfile, UserRole, type UsersSettings } from '../../../entity/users';
import type { WorkspaceResponse } from '../../../entity/workspaces';
import { workspaceApi } from '../../../entity/workspaces';
import { useTranslation } from '../../../shared/i18n';

interface Props {
  user: UserProfile;
  globalSettings: UsersSettings;

  onClose: () => void;
  onWorkspaceCreated: (workspace: WorkspaceResponse) => void;

  workspacesCount: number;
}

export const CreateWorkspaceDialogComponent = ({
  user,
  globalSettings,
  onClose,
  onWorkspaceCreated,
  workspacesCount,
}: Props) => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(
    workspacesCount === 0 ? t('workspace.createDefaultName') : '',
  );

  const isAllowedToCreateWorkspaces =
    globalSettings.isMemberAllowedToCreateWorkspaces || user.role === UserRole.ADMIN;

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      message.error(t('workspace.enterNamePrompt'));
      return;
    }

    setIsCreating(true);

    try {
      const newWorkspace = await workspaceApi.createWorkspace({
        name: workspaceName.trim(),
      });

      message.success(t('workspace.createdSuccess'));
      onWorkspaceCreated(newWorkspace);
      onClose();
    } catch (error) {
      message.error((error as Error).message || t('workspace.failedCreate'));
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAllowedToCreateWorkspaces) {
    return (
      <Modal
        title={t('workspace.permissionDeniedTitle')}
        open
        onCancel={onClose}
        footer={[
          <Button key="ok" type="primary" onClick={onClose}>
            {t('common.ok')}
          </Button>,
        ]}
      >
        <p>{t('workspace.permissionDeniedHint')}</p>
      </Modal>
    );
  }

  return (
    <Modal
      title={t('workspace.createTitle')}
      open
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isCreating}>
          {t('common.cancel')}
        </Button>,

        <Button
          key="create"
          type="primary"
          onClick={handleCreateWorkspace}
          disabled={isCreating || !workspaceName.trim()}
          className="border-blue-600 bg-blue-600 hover:border-blue-700 hover:bg-blue-700"
        >
          {isCreating ? (
            <Spin indicator={<LoadingOutlined spin />} size="small" />
          ) : (
            t('workspace.createTitle')
          )}
        </Button>,
      ]}
    >
      <div className="mb-4">
        <div className="dark:text-gray-300">
          {t('workspace.createDescription')}
          <br />
          {t('workspace.createDescDatabases')}
          <br />
          {t('workspace.createDescStorages')}
          <br />
          {t('workspace.createDescNotifiers')}
          <br />
          {t('workspace.createDescAccess')}
        </div>

        <label className="mt-5 mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('workspace.workspaceName')}
        </label>
        <Input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder={t('workspace.enterWorkspaceName')}
          disabled={isCreating}
          onPressEnter={handleCreateWorkspace}
          autoFocus
        />
      </div>
    </Modal>
  );
};
