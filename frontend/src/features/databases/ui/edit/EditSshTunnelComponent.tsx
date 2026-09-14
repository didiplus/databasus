import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, InputNumber, Select, Tooltip } from 'antd';
import { useState } from 'react';

import {
  DEFAULT_SSH_PORT,
  SSH_TUNNEL_AUTH_TYPE_LABELS,
  SshTunnelAuthType,
  type SshTunnelConfig,
  createEmptySshTunnelConfig,
  setSshTunnelAuthTypeAndClearUnusedSecrets,
} from '../../../../entity/databases';
import { useTranslation } from '../../../../shared/i18n';

interface Props {
  sshTunnel: SshTunnelConfig | undefined;
  hasStoredSecrets: boolean;
  onChange: (sshTunnel: SshTunnelConfig) => void;
}

export const EditSshTunnelComponent = ({ sshTunnel, hasStoredSecrets, onChange }: Props) => {
  const { t } = useTranslation();
  const [isReplacingSecrets, setIsReplacingSecrets] = useState(false);

  const updateField = <Field extends keyof SshTunnelConfig>(
    field: Field,
    value: SshTunnelConfig[Field],
  ) => {
    onChange({ ...currentTunnel, [field]: value });
  };

  const startReplacingSecrets = () => {
    setIsReplacingSecrets(true);
    onChange({ ...currentTunnel, password: '', privateKey: '', privateKeyPassphrase: '' });
  };

  const changeAuthType = (authType: SshTunnelAuthType) => {
    onChange(setSshTunnelAuthTypeAndClearUnusedSecrets(currentTunnel, authType));
  };

  const renderStoredSecrets = () => (
    <div className="mb-3 flex w-full items-center">
      <div className="min-w-[150px]">{t('databases.sshCredentials')}</div>
      <div className="flex items-center">
        <span className="mr-3">*************</span>
        <Button size="small" onClick={startReplacingSecrets}>
          {t('common.replace')}
        </Button>
      </div>
    </div>
  );

  const renderPassword = () => (
    <div className="mb-3 flex w-full items-center">
      <div className="min-w-[150px]">{t('databases.sshPassword')}</div>
      <Input.Password
        value={currentTunnel.password}
        onChange={(e) => updateField('password', e.target.value)}
        size="small"
        className="max-w-[200px] grow"
        placeholder="Enter SSH password"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
      />
    </div>
  );

  const renderPrivateKey = () => (
    <>
      <div className="mb-1 flex w-full items-start">
        <div className="min-w-[150px] leading-6">{t('databases.sshPrivateKey')}</div>
        <Input.TextArea
          value={currentTunnel.privateKey}
          onChange={(e) => updateField('privateKey', e.target.value)}
          size="small"
          className="max-w-[200px] grow"
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
          autoSize={{ minRows: 2, maxRows: 5 }}
        />
      </div>

      <div className="mb-3 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases.keyPassphrase')}</div>
        <Input.Password
          value={currentTunnel.privateKeyPassphrase}
          onChange={(e) => updateField('privateKeyPassphrase', e.target.value)}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('databases.keyPassphrasePlaceholder')}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
      </div>
    </>
  );

  const renderCredentials = () => {
    if (hasStoredSecrets && !isReplacingSecrets) return renderStoredSecrets();

    return currentTunnel.authType === SshTunnelAuthType.PRIVATE_KEY
      ? renderPrivateKey()
      : renderPassword();
  };

  const currentTunnel = sshTunnel ?? createEmptySshTunnelConfig();

  return (
    <>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases.sshTunnel')}</div>
        <Checkbox
          checked={currentTunnel.isEnabled}
          onChange={(e) => updateField('isEnabled', e.target.checked)}
        >
          <Tooltip
            className="cursor-pointer"
            title={t('databases.sshTunnelTooltip')}
          >
            <InfoCircleOutlined style={{ color: 'gray' }} />
          </Tooltip>
        </Checkbox>
      </div>

      {currentTunnel.isEnabled && (
        <>
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases.sshHost')}</div>
            <Input
              value={currentTunnel.host}
              onChange={(e) => updateField('host', e.target.value)}
              size="small"
              className="max-w-[200px] grow"
              placeholder="bastion.example.com"
            />

            <Tooltip
              className="cursor-pointer"
              title={t('databases.sshHostTooltip')}
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases.sshPort')}</div>
            <InputNumber
              value={currentTunnel.port}
              onChange={(value) => updateField('port', value ?? DEFAULT_SSH_PORT)}
              size="small"
              className="max-w-[200px] grow"
              min={1}
              max={65535}
            />
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases.sshUsername')}</div>
            <Input
              value={currentTunnel.username}
              onChange={(e) => updateField('username', e.target.value)}
              size="small"
              className="max-w-[200px] grow"
              placeholder="Enter SSH username"
            />
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases.sshAuth')}</div>
            <Select
              value={currentTunnel.authType}
              onChange={changeAuthType}
              options={Object.entries(SSH_TUNNEL_AUTH_TYPE_LABELS).map(([authType, label]) => ({
                label,
                value: authType as SshTunnelAuthType,
              }))}
              size="small"
              className="max-w-[200px] grow"
            />
          </div>

          {renderCredentials()}
        </>
      )}
    </>
  );
};
