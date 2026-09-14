import { InfoCircleOutlined } from '@ant-design/icons';
import { Input, Tooltip } from 'antd';
import React from 'react';

import type { Notifier } from '../../../../../entity/notifiers';
import { useTranslation } from '../../../../../shared/i18n';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditFeishuNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation();

  const webhookUrl = notifier?.feishuNotifier?.webhookUrl || '';
  const secret = notifier?.feishuNotifier?.secret || '';

  const onWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setNotifier({
      ...notifier,
      feishuNotifier: {
        webhookUrl: value,
        secret: notifier.feishuNotifier?.secret ?? '',
      },
    });
    setUnsaved();
  };

  const onSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setNotifier({
      ...notifier,
      feishuNotifier: {
        webhookUrl: notifier.feishuNotifier?.webhookUrl ?? '',
        secret: value,
      },
    });
    setUnsaved();
  };

  return (
    <>
      <div className="mb-1 max-w-[250px] sm:ml-[150px]" style={{ lineHeight: 1 }}>
        <a
          className="text-xs !text-blue-600"
          href="https://databasus.com/notifiers/feishu"
          target="_blank"
          rel="noreferrer"
        >
          {t('notifiers.howToConnectFeishu')}
        </a>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.webhookUrl')}</div>
        <div className="flex items-center">
          <Input
            value={webhookUrl}
            onChange={onWebhookUrlChange}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/....."
          />

          <Tooltip
            className="cursor-pointer"
            title={t('notifiers.feishuWebhookUrlTooltip')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.signingSecret')}</div>
        <div className="flex items-center">
          <Input
            value={secret}
            onChange={onSecretChange}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="....."
          />

          <Tooltip
            className="cursor-pointer"
            title={t('notifiers.feishuSecretTooltip')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>
    </>
  );
}