import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Spin,
  Switch,
  TimePicker,
  Tooltip,
} from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';

import { type Interval, IntervalType } from '../../../../entity/intervals';
import {
  type BackupVerificationConfig,
  VerificationNotificationType,
  VerificationScheduleType,
  verificationConfigApi,
} from '../../../../entity/verification/config';
import { getUserTimeFormat } from '../../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
  getUtcDayOfMonth,
  getUtcWeekday,
} from '../../../../shared/time/utils';
import { useTranslation } from '../../../../shared/i18n';

interface Props {
  databaseId: string;
  onClose: () => void;
}

export const EditBackupVerificationConfigComponent = ({ databaseId, onClose }: Props) => {
  const { t } = useTranslation();

  const weekdayOptions = [
    { value: 1, label: t('common.weekdayMon') },
    { value: 2, label: t('common.weekdayTue') },
    { value: 3, label: t('common.weekdayWed') },
    { value: 4, label: t('common.weekdayThu') },
    { value: 5, label: t('common.weekdayFri') },
    { value: 6, label: t('common.weekdaySat') },
    { value: 7, label: t('common.weekdaySun') },
  ];
  const [config, setConfig] = useState<BackupVerificationConfig>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);

  const updateConfig = (patch: Partial<BackupVerificationConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsUnsaved(true);
  };

  const saveInterval = (patch: Partial<Interval>) => {
    setConfig((prev) => {
      if (!prev) return prev;

      const updatedInterval = { ...prev.verificationInterval, ...patch } as Interval;
      return { ...prev, verificationInterval: updatedInterval };
    });
    setIsUnsaved(true);
  };

  const selectSchedule = (value: string) => {
    if (value === VerificationScheduleType.AFTER_BACKUP) {
      updateConfig({ scheduleType: VerificationScheduleType.AFTER_BACKUP });
      return;
    }

    setConfig((prev) =>
      prev
        ? {
            ...prev,
            scheduleType: VerificationScheduleType.INTERVAL,
            verificationInterval: { ...prev.verificationInterval, type: value as IntervalType },
          }
        : prev,
    );
    setIsUnsaved(true);
  };

  const toggleNotification = (type: VerificationNotificationType, checked: boolean) => {
    if (!config) return;

    const notifications = [...config.sendNotificationsOn];
    const index = notifications.indexOf(type);

    if (checked && index === -1) {
      notifications.push(type);
    } else if (!checked && index > -1) {
      notifications.splice(index, 1);
    }

    updateConfig({ sendNotificationsOn: notifications });
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);

    try {
      await verificationConfigApi.save(databaseId, config);
      setIsUnsaved(false);
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }

    setIsSaving(false);
  };

  useEffect(() => {
    setIsLoading(true);
    verificationConfigApi
      .getByDatabaseId(databaseId)
      .then(setConfig)
      .catch((error: Error) => alert(error.message))
      .finally(() => setIsLoading(false));
  }, [databaseId]);

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (!config) return <div />;

  const is12Hour = getIs12Hour();
  const timeFormat = { use12Hours: is12Hour, format: is12Hour ? 'h:mm A' : 'HH:mm' };
  const dateTimeFormat = getUserTimeFormat();

  const { verificationInterval } = config;

  const localTime: Dayjs | undefined = verificationInterval?.timeOfDay
    ? dayjs.utc(verificationInterval.timeOfDay, 'HH:mm').local()
    : undefined;

  const displayedWeekday: number | undefined =
    verificationInterval?.type === IntervalType.WEEKLY &&
    verificationInterval.weekday &&
    verificationInterval.timeOfDay
      ? getLocalWeekday(verificationInterval.weekday, verificationInterval.timeOfDay)
      : verificationInterval?.weekday;

  const displayedDayOfMonth: number | undefined =
    verificationInterval?.type === IntervalType.MONTHLY &&
    verificationInterval.dayOfMonth &&
    verificationInterval.timeOfDay
      ? getLocalDayOfMonth(verificationInterval.dayOfMonth, verificationInterval.timeOfDay)
      : verificationInterval?.dayOfMonth;

  const isAfterBackup = config.scheduleType === VerificationScheduleType.AFTER_BACKUP;

  const isIntervalValid =
    !config.isScheduledVerificationEnabled ||
    isAfterBackup ||
    (Boolean(verificationInterval?.type) &&
      (verificationInterval.type !== IntervalType.WEEKLY || displayedWeekday) &&
      (verificationInterval.type !== IntervalType.MONTHLY || displayedDayOfMonth) &&
      (verificationInterval.type !== IntervalType.CRON || verificationInterval.cronExpression));

  const isAllFieldsFilled = isIntervalValid;

  return (
    <div className="space-y-3">
      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[180px] sm:mb-0">{t('verification.scheduledVerification')}</div>
        <Switch
          checked={config.isScheduledVerificationEnabled}
          onChange={(checked) => updateConfig({ isScheduledVerificationEnabled: checked })}
          size="small"
        />
        <Tooltip
          className="cursor-pointer"
          title={
            <>
              {t('verification.scheduledVerificationTooltip')}{' '}
              <a
                href="https://databasus.com/restore-verification"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {t('verification.readHowItWorks')}
              </a>
            </>
          }
        >
          <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
        </Tooltip>
      </div>

      {config.isScheduledVerificationEnabled && (
        <>
          <div className="mt-5 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[180px] sm:mb-0">{t('verification.verificationInterval')}</div>
            <Select
              value={
                isAfterBackup ? VerificationScheduleType.AFTER_BACKUP : verificationInterval?.type
              }
              onChange={selectSchedule}
              size="small"
              className="w-full max-w-[200px] grow"
              options={[
                { label: t('common.afterBackup'), value: VerificationScheduleType.AFTER_BACKUP },
                { label: t('common.hourly'), value: IntervalType.HOURLY },
                { label: t('common.daily'), value: IntervalType.DAILY },
                { label: t('common.weekly'), value: IntervalType.WEEKLY },
                { label: t('common.monthly'), value: IntervalType.MONTHLY },
                { label: t('common.cron'), value: IntervalType.CRON },
              ]}
            />
          </div>

          {isAfterBackup && (
            <div className="mb-1 flex w-full flex-col items-start text-xs text-gray-600 sm:flex-row sm:items-center dark:text-gray-400">
              <div className="mb-1 min-w-[180px] sm:mb-0" />
              <div>
                {t('verification.afterBackupHint')}
              </div>
            </div>
          )}

          {!isAfterBackup && verificationInterval?.type === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[180px] sm:mb-0">{t('verification.verificationWeekday')}</div>
              <Select
                value={displayedWeekday}
                onChange={(localWeekday) => {
                  if (!localWeekday) return;
                  const ref = localTime ?? dayjs();
                  saveInterval({ weekday: getUtcWeekday(localWeekday, ref) });
                }}
                size="small"
                className="w-full max-w-[200px] grow"
                options={weekdayOptions}
              />
            </div>
          )}

          {!isAfterBackup && verificationInterval?.type === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[180px] sm:mb-0">{t('verification.verificationDayOfMonth')}</div>
              <InputNumber
                min={1}
                max={31}
                value={displayedDayOfMonth}
                onChange={(localDom) => {
                  if (!localDom) return;
                  const ref = localTime ?? dayjs();
                  saveInterval({ dayOfMonth: getUtcDayOfMonth(localDom, ref) });
                }}
                size="small"
                className="w-full max-w-[200px] grow"
              />
            </div>
          )}

          {!isAfterBackup && verificationInterval?.type === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
                <div className="mb-1 min-w-[180px] sm:mb-0">{t('verification.cronExpressionUtc')}</div>
                <div className="flex items-center">
                  <Input
                    value={verificationInterval?.cronExpression || ''}
                    onChange={(e) => saveInterval({ cronExpression: e.target.value })}
                    placeholder={t('verification.cronPlaceholder')}
                    size="small"
                    className="w-full max-w-[200px] grow"
                  />
                  <Tooltip
                    className="cursor-pointer"
                    title={
                      <div>
                        <div className="font-bold">
                          {t('verification.cronFormatHint')}
                        </div>
                        <div className="mt-1">{t('verification.cronExamples')}</div>
                        <div>{t('verification.cronExample1')}</div>
                        <div>{t('verification.cronExample2')}</div>
                      </div>
                    }
                  >
                    <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
                  </Tooltip>
                </div>
              </div>
              {verificationInterval?.cronExpression &&
                (() => {
                  try {
                    const interval = CronExpressionParser.parse(
                      verificationInterval.cronExpression,
                      {
                        tz: 'UTC',
                      },
                    );
                    const nextRun = interval.next().toDate();
                    return (
                      <div className="mb-1 flex w-full flex-col items-start text-xs text-gray-600 sm:flex-row sm:items-center dark:text-gray-400">
                        <div className="mb-1 min-w-[180px] sm:mb-0" />
                        <div className="text-gray-600 dark:text-gray-400">
                          {t('verification.nextRun')} {dayjs(nextRun).local().format(dateTimeFormat.format)}
                          <br />({dayjs(nextRun).fromNow()})
                        </div>
                      </div>
                    );
                  } catch {
                    return (
                      <div className="mb-1 flex w-full flex-col items-start text-red-500 sm:flex-row sm:items-center">
                        <div className="mb-1 min-w-[180px] sm:mb-0" />
                        <div className="text-red-500">{t('verification.invalidCron')}</div>
                      </div>
                    );
                  }
                })()}
            </>
          )}

          {!isAfterBackup &&
            verificationInterval?.type !== IntervalType.HOURLY &&
            verificationInterval?.type !== IntervalType.CRON && (
              <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
                <div className="mb-1 min-w-[180px] sm:mb-0">{t('verification.verificationTimeOfDay')}</div>
                <TimePicker
                  value={localTime}
                  format={timeFormat.format}
                  use12Hours={timeFormat.use12Hours}
                  allowClear={false}
                  size="small"
                  className="w-full max-w-[200px] grow"
                  onChange={(t) => {
                    if (!t) return;
                    const patch: Partial<Interval> = { timeOfDay: t.utc().format('HH:mm') };

                    if (verificationInterval?.type === IntervalType.WEEKLY && displayedWeekday) {
                      patch.weekday = getUtcWeekday(displayedWeekday, t);
                    }
                    if (
                      verificationInterval?.type === IntervalType.MONTHLY &&
                      displayedDayOfMonth
                    ) {
                      patch.dayOfMonth = getUtcDayOfMonth(displayedDayOfMonth, t);
                    }

                    saveInterval(patch);
                  }}
                />
              </div>
            )}

          <div className="mt-5 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-start">
            <div className="mt-0 mb-1 min-w-[180px] sm:mt-1 sm:mb-0">{t('verification.notifications')}</div>
            <div className="flex flex-col space-y-2">
              <Checkbox
                checked={config.sendNotificationsOn.includes(
                  VerificationNotificationType.VerificationSuccess,
                )}
                onChange={(e) =>
                  toggleNotification(
                    VerificationNotificationType.VerificationSuccess,
                    e.target.checked,
                  )
                }
              >
                {t('verification.verificationSuccess')}
              </Checkbox>
              <Checkbox
                checked={config.sendNotificationsOn.includes(
                  VerificationNotificationType.VerificationFailed,
                )}
                onChange={(e) =>
                  toggleNotification(
                    VerificationNotificationType.VerificationFailed,
                    e.target.checked,
                  )
                }
              >
                {t('verification.verificationFailed')}
              </Checkbox>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 flex justify-end space-x-2">
        <Button onClick={onClose} disabled={isSaving}>
          {t('common.cancel')}
        </Button>

        <Button
          type="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={!isUnsaved || !isAllFieldsFilled}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};
