import { Input } from 'antd';

import type { Notifier } from '../../../../../entity/notifiers';
import { useTranslation } from '../../../../../shared/i18n';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditSlackNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-1 max-w-[250px] sm:ml-[150px]" style={{ lineHeight: 1 }}>
        <a
          className="text-xs !text-blue-600"
          href="https://databasus.com/notifiers/slack"
          target="_blank"
          rel="noreferrer"
        >
          {t('notifiers.howToConnectSlack')}
        </a>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.botToken')}</div>
        <Input
          value={notifier?.slackNotifier?.botToken || ''}
          onChange={(e) => {
            if (!notifier?.slackNotifier) return;

            setNotifier({
              ...notifier,
              slackNotifier: {
                ...notifier.slackNotifier,
                botToken: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="xoxb-..."
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.targetChatId')}</div>
        <Input
          value={notifier?.slackNotifier?.targetChatId || ''}
          onChange={(e) => {
            if (!notifier?.slackNotifier) return;

            setNotifier({
              ...notifier,
              slackNotifier: {
                ...notifier.slackNotifier,
                targetChatId: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="C1234567890"
        />
      </div>
    </>
  );
}
