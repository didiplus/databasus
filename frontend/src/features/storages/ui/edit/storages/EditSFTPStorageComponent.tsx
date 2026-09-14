import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { Checkbox, Input, InputNumber, Radio, Tooltip } from 'antd';
import { useState } from 'react';

import type { Storage } from '../../../../../entity/storages';
import { useTranslation } from '../../../../../shared/i18n';

interface Props {
  storage: Storage;
  setStorage: (storage: Storage) => void;
  setUnsaved: () => void;
}

export function EditSFTPStorageComponent({ storage, setStorage, setUnsaved }: Props) {
  const { t } = useTranslation();

  const hasAdvancedValues = !!storage?.sftpStorage?.skipHostKeyVerify;
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  const initialAuthMethod = storage?.sftpStorage?.privateKey ? 'privateKey' : 'password';
  const [authMethod, setAuthMethod] = useState<'password' | 'privateKey'>(initialAuthMethod);

  return (
    <>
      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.host')}</div>
        <Input
          value={storage?.sftpStorage?.host || ''}
          onChange={(e) => {
            if (!storage?.sftpStorage) return;

            setStorage({
              ...storage,
              sftpStorage: {
                ...storage.sftpStorage,
                host: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="sftp.example.com"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.port')}</div>
        <InputNumber
          value={storage?.sftpStorage?.port}
          onChange={(value) => {
            if (!storage?.sftpStorage || !value) return;

            setStorage({
              ...storage,
              sftpStorage: {
                ...storage.sftpStorage,
                port: value,
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          min={1}
          max={65535}
          placeholder="22"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.username')}</div>
        <Input
          value={storage?.sftpStorage?.username || ''}
          onChange={(e) => {
            if (!storage?.sftpStorage) return;

            setStorage({
              ...storage,
              sftpStorage: {
                ...storage.sftpStorage,
                username: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="username"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.authMethod')}</div>
        <Radio.Group
          value={authMethod}
          onChange={(e) => {
            if (!storage?.sftpStorage) return;

            const newMethod = e.target.value as 'password' | 'privateKey';
            setAuthMethod(newMethod);

            if (newMethod === 'password') {
              setStorage({
                ...storage,
                sftpStorage: {
                  ...storage.sftpStorage,
                  privateKey: undefined,
                },
              });
            } else {
              setStorage({
                ...storage,
                sftpStorage: {
                  ...storage.sftpStorage,
                  password: undefined,
                },
              });
            }
            setUnsaved();
          }}
          size="small"
        >
          <Radio value="password">{t('storages.password')}</Radio>
          <Radio value="privateKey">{t('storages.privateKey')}</Radio>
        </Radio.Group>
      </div>

      {authMethod === 'password' && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.password')}</div>
          <Input.Password
            value={storage?.sftpStorage?.password || ''}
            onChange={(e) => {
              if (!storage?.sftpStorage) return;

              setStorage({
                ...storage,
                sftpStorage: {
                  ...storage.sftpStorage,
                  password: e.target.value,
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="password"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
        </div>
      )}

      {authMethod === 'privateKey' && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.privateKey')}</div>
          <div className="flex w-full max-w-[250px] flex-col">
            <Input.TextArea
              value={storage?.sftpStorage?.privateKey || ''}
              onChange={(e) => {
                if (!storage?.sftpStorage) return;

                setStorage({
                  ...storage,
                  sftpStorage: {
                    ...storage.sftpStorage,
                    privateKey: e.target.value,
                  },
                });
                setUnsaved();
              }}
              size="small"
              className="w-full"
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              rows={4}
            />
            <Tooltip
              className="mt-1 cursor-pointer"
              title={t('storages.privateKeyTooltip')}
            >
              <InfoCircleOutlined style={{ color: 'gray' }} />
            </Tooltip>
          </div>
        </div>
      )}

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.path')}</div>
        <div className="flex items-center">
          <Input
            value={storage?.sftpStorage?.path || ''}
            onChange={(e) => {
              if (!storage?.sftpStorage) return;

              let pathValue = e.target.value.trim();
              if (pathValue.startsWith('/')) {
                pathValue = pathValue.substring(1);
              }

              setStorage({
                ...storage,
                sftpStorage: {
                  ...storage.sftpStorage,
                  path: pathValue || undefined,
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="backups (optional)"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('storages.remotePathTooltip')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="mt-4 mb-3 flex items-center">
        <div
          className="flex cursor-pointer items-center text-sm text-blue-600 hover:text-blue-800"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="mr-2">{t('storages.advancedSettings')}</span>

          {showAdvanced ? (
            <UpOutlined style={{ fontSize: '12px' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px' }} />
          )}
        </div>
      </div>

      {showAdvanced && (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.skipHostKey')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={storage?.sftpStorage?.skipHostKeyVerify || false}
                onChange={(e) => {
                  if (!storage?.sftpStorage) return;

                  setStorage({
                    ...storage,
                    sftpStorage: {
                      ...storage.sftpStorage,
                      skipHostKeyVerify: e.target.checked,
                    },
                  });
                  setUnsaved();
                }}
              >
                {t('storages.skipHostKeyVerification')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('storages.skipHostKeyTooltip')}
              >

                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>
        </>
      )}

      <div className="mb-5" />
    </>
  );
}
