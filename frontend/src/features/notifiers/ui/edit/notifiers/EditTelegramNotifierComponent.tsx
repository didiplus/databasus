import { InfoCircleOutlined } from '@ant-design/icons';
import { Input, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

import type { Notifier } from '../../../../../entity/notifiers';
import { useTranslation } from '../../../../../shared/i18n';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditTelegramNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation();

  const [isShowHowToGetChatId, setIsShowHowToGetChatId] = useState(false);

  useEffect(() => {
    if (notifier.telegramNotifier?.threadId && !notifier.telegramNotifier.isSendToThreadEnabled) {
      setNotifier({
        ...notifier,
        telegramNotifier: {
          ...notifier.telegramNotifier,
          isSendToThreadEnabled: true,
        },
      });
    }
  }, [notifier]);

  return (
    <>
      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.botToken')}</div>
        <Input
          value={notifier?.telegramNotifier?.botToken || ''}
          onChange={(e) => {
            if (!notifier?.telegramNotifier) return;
            setNotifier({
              ...notifier,
              telegramNotifier: {
                ...notifier.telegramNotifier,
                botToken: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        />
      </div>

      <div className="mb-1 sm:ml-[150px]">
        <a
          className="text-xs !text-blue-600"
          href="https://www.siteguarding.com/en/how-to-get-telegram-bot-api-token"
          target="_blank"
          rel="noreferrer"
        >
          {t('notifiers.howToGetTelegramBotToken')}
        </a>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.targetChatId')}</div>
        <div className="flex items-center">
          <Input
            value={notifier?.telegramNotifier?.targetChatId || ''}
            onChange={(e) => {
              if (!notifier?.telegramNotifier) return;

              setNotifier({
                ...notifier,
                telegramNotifier: {
                  ...notifier.telegramNotifier,
                  targetChatId: e.target.value.trim(),
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="-1001234567890"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('notifiers.telegramChatTooltip')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="max-w-[250px] sm:ml-[150px]">
        {!isShowHowToGetChatId ? (
          <div
            className="mt-1 cursor-pointer text-xs text-blue-600"
            onClick={() => setIsShowHowToGetChatId(true)}
          >
            {t('notifiers.howToGetTelegramChatId')}
          </div>
        ) : (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('notifiers.telegramChatIdHelpIntro')}{' '}
            <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer">
              @getmyid_bot
            </a>{' '}
            {t('notifiers.telegramChatIdHelpInTelegram')}{' '}
            <u>{t('notifiers.telegramChatIdHelpStarted')}</u>
            <br />
            <br />
            {t('notifiers.telegramChatIdHelpGroupIntro')}{' '}
            <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer">
              @getmyid_bot
            </a>{' '}
            {t('notifiers.telegramChatIdHelpGroupOutro')}
          </div>
        )}
      </div>

      <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.useProxy')}</div>
        <div className="flex items-center">
          <Switch
            checked={notifier?.telegramNotifier?.isProxyEnabled || false}
            onChange={(checked) => {
              if (!notifier?.telegramNotifier) return;

              setNotifier({
                ...notifier,
                telegramNotifier: {
                  ...notifier.telegramNotifier,
                  isProxyEnabled: checked,
                  proxyUrl: checked ? notifier.telegramNotifier.proxyUrl : undefined,
                },
              });
              setUnsaved();
            }}
            size="small"
          />

          <Tooltip className="cursor-pointer" title={t('notifiers.useProxyTooltip')}>
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      {notifier?.telegramNotifier?.isProxyEnabled && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.proxyUrl')}</div>
          <div className="flex items-center">
            <Input
              value={notifier?.telegramNotifier?.proxyUrl || ''}
              onChange={(e) => {
                if (!notifier?.telegramNotifier) return;

                setNotifier({
                  ...notifier,
                  telegramNotifier: {
                    ...notifier.telegramNotifier,
                    proxyUrl: e.target.value.trim(),
                  },
                });
                setUnsaved();
              }}
              size="small"
              className="w-full max-w-[250px]"
              placeholder="socks5://user:pass@host:1080"
            />

            <Tooltip
              className="cursor-pointer"
              title={t('notifiers.proxyUrlTooltip')}
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>
        </div>
      )}

      <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.sendToGroupTopic')}</div>
        <div className="flex items-center">
          <Switch
            checked={notifier?.telegramNotifier?.isSendToThreadEnabled || false}
            onChange={(checked) => {
              if (!notifier?.telegramNotifier) return;

              setNotifier({
                ...notifier,
                telegramNotifier: {
                  ...notifier.telegramNotifier,
                  isSendToThreadEnabled: checked,
                  // Clear thread ID if disabling
                  threadId: checked ? notifier.telegramNotifier.threadId : undefined,
                },
              });
              setUnsaved();
            }}
            size="small"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('notifiers.sendToGroupTopicTooltip')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      {notifier?.telegramNotifier?.isSendToThreadEnabled && (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.threadId')}</div>
            <div className="flex items-center">
              <Input
                value={notifier?.telegramNotifier?.threadId?.toString() || ''}
                onChange={(e) => {
                  if (!notifier?.telegramNotifier) return;

                  const value = e.target.value.trim();
                  const threadId = value ? parseInt(value, 10) : undefined;

                  setNotifier({
                    ...notifier,
                    telegramNotifier: {
                      ...notifier.telegramNotifier,
                      threadId: !isNaN(threadId!) ? threadId : undefined,
                    },
                  });
                  setUnsaved();
                }}
                size="small"
                className="w-full max-w-[250px]"
                placeholder="3"
                type="number"
                min="1"
              />

              <Tooltip
                className="cursor-pointer"
                title={t('notifiers.threadIdTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="max-w-[250px] sm:ml-[150px]">
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('notifiers.threadIdHelpIntro')}
              <br />
              <br />
              <strong>{t('notifiers.threadIdHelpExampleLabel')}</strong>{' '}
              {t('notifiers.threadIdHelpExampleMid')}{' '}
              <code className="rounded bg-gray-100 px-1">https://t.me/c/2831948048/3</code>
              {t('notifiers.threadIdHelpExampleEnd')}{' '}
              <code className="rounded bg-gray-100 px-1">3</code>
              <br />
              <br />
              <strong>{t('notifiers.threadIdHelpNoteLabel')}</strong>{' '}
              {t('notifiers.threadIdHelpNoteText')}
            </div>
          </div>
        </>
      )}
    </>
  );
}
