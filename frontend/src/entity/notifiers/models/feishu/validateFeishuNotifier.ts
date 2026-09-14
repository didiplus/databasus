import type { FeishuNotifier } from './FeishuNotifier';

export const validateFeishuNotifier = (isCreate: boolean, notifier: FeishuNotifier): boolean => {
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