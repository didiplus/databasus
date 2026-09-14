import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { Checkbox, Input, Select, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

import { S3StorageClass, S3StorageClassLabels, type Storage } from '../../../../../entity/storages';
import { useTranslation } from '../../../../../shared/i18n';

interface Props {
  storage: Storage;
  setStorage: (storage: Storage) => void;
  setUnsaved: () => void;
  connectionError?: string;
}

export function EditS3StorageComponent({
  storage,
  setStorage,
  setUnsaved,
  connectionError,
}: Props) {
  const { t } = useTranslation();

  const hasAdvancedValues =
    !!storage?.s3Storage?.s3Prefix ||
    !!storage?.s3Storage?.s3UseVirtualHostedStyle ||
    !!storage?.s3Storage?.skipTLSVerify ||
    !!storage?.s3Storage?.s3StorageClass;
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  useEffect(() => {
    if (connectionError?.includes('failed to verify certificate')) {
      setShowAdvanced(true);
    }
  }, [connectionError]);

  return (
    <>
      <div className="mb-2 flex items-center">
        <div className="hidden min-w-[110px] sm:block" />

        <div className="text-xs text-blue-600">
          <a href="https://databasus.com/storages/cloudflare-r2" target="_blank" rel="noreferrer">
            {t('storages.howToUseCloudflareR2')}
          </a>
        </div>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.s3Bucket')}</div>
        <Input
          value={storage?.s3Storage?.s3Bucket || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3Bucket: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="my-bucket-name"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.region')}</div>
        <Input
          value={storage?.s3Storage?.s3Region || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3Region: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="us-east-1"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.accessKey')}</div>
        <Input.Password
          value={storage?.s3Storage?.s3AccessKey || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3AccessKey: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="AKIAIOSFODNN7EXAMPLE"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.secretKey')}</div>
        <Input.Password
          value={storage?.s3Storage?.s3SecretKey || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3SecretKey: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          className="w-full max-w-[250px]"
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.endpoint')}</div>
        <div className="flex items-center">
          <Input
            value={storage?.s3Storage?.s3Endpoint || ''}
            onChange={(e) => {
              if (!storage?.s3Storage) return;

              setStorage({
                ...storage,
                s3Storage: {
                  ...storage.s3Storage,
                  s3Endpoint: e.target.value.trim(),
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="https://s3.example.com (optional)"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('storages.endpointTooltip')}
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
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.folderPrefix')}</div>
            <div className="flex items-center">
              <Input
                value={storage?.s3Storage?.s3Prefix || ''}
                onChange={(e) => {
                  if (!storage?.s3Storage) return;

                  setStorage({
                    ...storage,
                    s3Storage: {
                      ...storage.s3Storage,
                      s3Prefix: e.target.value.trim(),
                    },
                  });
                  setUnsaved();
                }}
                size="small"
                className="w-full max-w-[250px]"
                placeholder="my-prefix/ (optional)"
                // we do not allow to change the prefix after creation,
                // otherwise we will have to migrate all the data to the new prefix
                disabled={!!storage.id}
              />

              <Tooltip
                className="cursor-pointer"
                title={t('storages.prefixTooltip')}
              >
                <InfoCircleOutlined className="ml-4" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.virtualHost')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={storage?.s3Storage?.s3UseVirtualHostedStyle || false}
                onChange={(e) => {
                  if (!storage?.s3Storage) return;

                  setStorage({
                    ...storage,
                    s3Storage: {
                      ...storage.s3Storage,
                      s3UseVirtualHostedStyle: e.target.checked,
                    },
                  });
                  setUnsaved();
                }}
              >
                {t('storages.useVirtualStyledDomains')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('storages.virtualHostTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.skipTlsVerify')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={storage?.s3Storage?.skipTLSVerify || false}
                onChange={(e) => {
                  if (!storage?.s3Storage) return;

                  setStorage({
                    ...storage,
                    s3Storage: {
                      ...storage.s3Storage,
                      skipTLSVerify: e.target.checked,
                    },
                  });
                  setUnsaved();
                }}
              >
                {t('storages.skipTls')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('storages.skipTlsTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('storages.storageClass')}</div>
            <div className="flex items-center">
              <Select
                value={storage?.s3Storage?.s3StorageClass || S3StorageClass.DEFAULT}
                options={Object.entries(S3StorageClassLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => {
                  if (!storage?.s3Storage) return;

                  setStorage({
                    ...storage,
                    s3Storage: {
                      ...storage.s3Storage,
                      s3StorageClass: value,
                    },
                  });
                  setUnsaved();
                }}
                size="small"
                className="w-[250px] max-w-[250px]"
              />

              <Tooltip
                className="cursor-pointer"
                title={t('storages.storageClassTooltip')}
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
