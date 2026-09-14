import type { DingTalkNotifier } from './DingTalkNotifier';

export const validateDingTalkNotifier = (isCreate: boolean, notifier: DingTalkNotifier): boolean => {
  if (isCreate && !notifier?.webhookUrl) {
    return false;
  }

  try {
    const u = new URL(notifier.webhookUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  } catch {
    return false;
  }

  return true;
};