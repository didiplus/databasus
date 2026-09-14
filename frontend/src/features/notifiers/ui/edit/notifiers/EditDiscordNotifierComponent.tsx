import { Input } from 'antd';

import type { Notifier } from '../../../../../entity/notifiers';
import { useTranslation } from '../../../../../shared/i18n';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditDiscordNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('notifiers.channelWebhookUrl')}</div>
        <Input
          value={notifier?.discordNotifier?.channelWebhookUrl || ''}
          onChange={(e) => {
            if (!notifier?.discordNotifier) return;
            setNotifier({
              ...notifier,
              discordNotifier: {
                ...notifier.discordNotifier,
                channelWebhookUrl: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        />
      </div>

      <div className="max-w-[250px] sm:ml-[150px]">
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          <strong>{t('notifiers.discordWebhookHelpTitle')}</strong>
          <br />
          <br />
          {t('notifiers.discordWebhookHelpStep1')}
          <br />
          {t('notifiers.discordWebhookHelpStep2')}
          <br />
          {t('notifiers.discordWebhookHelpStep3')}
          <br />
          {t('notifiers.discordWebhookHelpStep4')}
          <br />
          {t('notifiers.discordWebhookHelpStep5')}
          <br />
          <br />
          <em>{t('notifiers.discordWebhookHelpNote')}</em>
        </div>
      </div>
    </>
  );
}
