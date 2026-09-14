import { InfoCircleOutlined } from '@ant-design/icons';
import { Checkbox, Input, Select, Tooltip } from 'antd';
import { useState } from 'react';

import {
  MattermostDeliveryMode,
  type MattermostNotifier,
  type Notifier,
} from '../../../../../entity/notifiers';
import { useTranslation } from '../../../../../shared/i18n';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditMattermostNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation();

  const mattermostNotifier = notifier.mattermostNotifier;

  const [isShowOptional, setIsShowOptional] = useState(
    () =>
      !!(
        mattermostNotifier?.targetChannelName ||
        mattermostNotifier?.overrideUsername ||
        mattermostNotifier?.overrideIconUrl ||
        mattermostNotifier?.isInsecureSkipVerify
      ),
  );

  if (!mattermostNotifier) return <div />;

  const updateMattermostNotifier = (changes: Partial<MattermostNotifier>) => {
    setNotifier({
      ...notifier,
      mattermostNotifier: { ...mattermostNotifier, ...changes },
    });
    setUnsaved();
  };

  const isWebhookMode = mattermostNotifier.deliveryMode === MattermostDeliveryMode.WEBHOOK;

  return (
    <>
      <div className="mb-1 max-w-[250px] sm:ml-[150px]" style={{ lineHeight: 1 }}>
        <a
          className="text-xs !text-blue-600"
          href="https://databasus.com/notifiers/mattermost"
          target="_blank"
          rel="noreferrer"
        >
          {t('notifiers.howToConnectMattermost')}
        </a>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.connectVia')}</div>
        <Select
          value={mattermostNotifier.deliveryMode}
          options={[
            { label: t('notifiers.incomingWebhook'), value: MattermostDeliveryMode.WEBHOOK },
            { label: t('notifiers.botAccount'), value: MattermostDeliveryMode.BOT },
          ]}
          onChange={(deliveryMode) => updateMattermostNotifier({ deliveryMode })}
          size="small"
          className="w-full max-w-[250px]"
        />
      </div>

      {isWebhookMode ? (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.incomingWebhookUrl')}</div>
          <Input
            value={mattermostNotifier.webhookUrl}
            onChange={(e) => updateMattermostNotifier({ webhookUrl: e.target.value.trim() })}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="https://mattermost.example.com/hooks/xxxxxxxx"
          />
        </div>
      ) : (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.serverUrl')}</div>
            <Input
              value={mattermostNotifier.serverUrl}
              onChange={(e) => updateMattermostNotifier({ serverUrl: e.target.value.trim() })}
              size="small"
              className="w-full max-w-[250px]"
              placeholder="https://mattermost.example.com"
            />
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.botToken')}</div>
            <Input
              value={mattermostNotifier.botToken}
              onChange={(e) => updateMattermostNotifier({ botToken: e.target.value.trim() })}
              size="small"
              className="w-full max-w-[250px]"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.channelId')}</div>
            <div className="flex items-center">
              <Input
                value={mattermostNotifier.targetChannelId}
                onChange={(e) =>
                  updateMattermostNotifier({ targetChannelId: e.target.value.trim() })
                }
                size="small"
                className="w-full max-w-[250px]"
                placeholder="8f4ycxjmztbwmcy1o3xasjrxha"
              />

              <Tooltip
                className="cursor-pointer"
                title={t('notifiers.channelIdTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>
        </>
      )}

      <div className="mb-1 max-w-[250px] sm:ml-[150px]">
        <button
          type="button"
          onClick={() => setIsShowOptional(!isShowOptional)}
          className="text-xs text-blue-600 hover:underline"
        >
          {isShowOptional ? t('notifiers.hideOptionalSettings') : t('notifiers.showOptionalSettings')}
        </button>
      </div>

      {isShowOptional && (
        <>
          {isWebhookMode && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.channelOverride')}</div>
              <div className="flex items-center">
                <Input
                  value={mattermostNotifier.targetChannelName}
                  onChange={(e) =>
                    updateMattermostNotifier({ targetChannelName: e.target.value.trim() })
                  }
                  size="small"
                  className="w-full max-w-[250px]"
                  placeholder="town-square"
                />

                <Tooltip
                  className="cursor-pointer"
                  title={t('notifiers.channelOverrideTooltip')}
                >
                  <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
                </Tooltip>
              </div>
            </div>
          )}

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.postAsUsername')}</div>
            <div className="flex items-center">
              <Input
                value={mattermostNotifier.overrideUsername}
                onChange={(e) =>
                  updateMattermostNotifier({ overrideUsername: e.target.value.trim() })
                }
                size="small"
                className="w-full max-w-[250px]"
                placeholder="Databasus"
              />

              <Tooltip
                className="cursor-pointer"
                title={t('notifiers.postAsUsernameTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.postAsIconUrl')}</div>
            <div className="flex items-center">
              <Input
                value={mattermostNotifier.overrideIconUrl}
                onChange={(e) =>
                  updateMattermostNotifier({ overrideIconUrl: e.target.value.trim() })
                }
                size="small"
                className="w-full max-w-[250px]"
                placeholder="https://databasus.com/icon.png"
              />

              <Tooltip
                className="cursor-pointer"
                title={t('notifiers.postAsIconUrlTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.skipTlsVerify')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={mattermostNotifier.isInsecureSkipVerify}
                onChange={(e) =>
                  updateMattermostNotifier({ isInsecureSkipVerify: e.target.checked })
                }
              >
                {t('notifiers.skipTls')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('notifiers.skipTlsMattermostTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>
        </>
      )}

      <div className="mt-1 max-w-[250px] text-xs text-gray-500 sm:ml-[150px] dark:text-gray-400">
        {isWebhookMode ? (
          <>
            <strong>{t('notifiers.mattermostWebhookHelpTitle')}</strong>
            <br />
            <br />
            {t('notifiers.mattermostWebhookHelpStep1')}
            <br />
            {t('notifiers.mattermostWebhookHelpStep2')}
            <br />
            {t('notifiers.mattermostWebhookHelpStep3')}
          </>
        ) : (
          <>
            <strong>{t('notifiers.mattermostBotHelpTitle')}</strong>
            <br />
            <br />
            {t('notifiers.mattermostBotHelpStep1')}
            <br />
            {t('notifiers.mattermostBotHelpStep2')}
            <br />
            {t('notifiers.mattermostBotHelpStep3')}
          </>
        )}
      </div>
    </>
  );
}
