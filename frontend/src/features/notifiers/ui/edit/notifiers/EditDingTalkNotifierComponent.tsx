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

export function EditDingTalkNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation();

  const webhookUrl = notifier?.dingTalkNotifier?.webhookUrl || '';
  const secret = notifier?.dingTalkNotifier?.secret || '';

  const onWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setNotifier({
      ...notifier,
      dingTalkNotifier: {
        webhookUrl: value,
        secret: notifier.dingTalkNotifier?.secret ?? '',
      },
    });
    setUnsaved();
  };

  const onSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setNotifier({
      ...notifier,
      dingTalkNotifier: {
        webhookUrl: notifier.dingTalkNotifier?.webhookUrl ?? '',
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
          href="https://databasus.com/notifiers/dingtalk"
          target="_blank"
          rel="noreferrer"
        >
          {t('notifiers.howToConnectDingTalk')}
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
            placeholder="https://oapi.dingtalk.com/robot/send?access_token=....."
          />

          <Tooltip
            className="cursor-pointer"
            title={t('notifiers.dingTalkWebhookUrlTooltip')}
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
            placeholder="SEC....."
          />

          <Tooltip
            className="cursor-pointer"
            title={t('notifiers.dingTalkSecretTooltip')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>
    </>
  );
}