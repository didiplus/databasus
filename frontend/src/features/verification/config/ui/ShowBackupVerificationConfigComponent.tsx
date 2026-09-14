import { Spin } from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { IntervalType } from '../../../../entity/intervals';
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
} from '../../../../shared/time/utils';
import { useTranslation } from '../../../../shared/i18n';

interface Props {
  databaseId: string;
}

export const ShowBackupVerificationConfigComponent = ({ databaseId }: Props) => {
  const { t } = useTranslation();

  const weekdayLabels: Record<number, string> = {
    1: t('common.weekdayMon'),
    2: t('common.weekdayTue'),
    3: t('common.weekdayWed'),
    4: t('common.weekdayThu'),
    5: t('common.weekdayFri'),
    6: t('common.weekdaySat'),
    7: t('common.weekdaySun'),
  };

  const intervalLabels: Record<IntervalType, string> = {
    [IntervalType.HOURLY]: t('common.hourly'),
    [IntervalType.DAILY]: t('common.daily'),
    [IntervalType.WEEKLY]: t('common.weekly'),
    [IntervalType.MONTHLY]: t('common.monthly'),
    [IntervalType.CRON]: t('common.cron'),
  };

  const notificationLabels: Record<VerificationNotificationType, string> = {
    [VerificationNotificationType.VerificationSuccess]: t('verification.verificationSuccess'),
    [VerificationNotificationType.VerificationFailed]: t('verification.verificationFailed'),
  };
  const [config, setConfig] = useState<BackupVerificationConfig>();
  const [isLoading, setIsLoading] = useState(true);

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

  const localTime = verificationInterval?.timeOfDay
    ? dayjs.utc(verificationInterval.timeOfDay, 'HH:mm').local()
    : undefined;

  const formattedTime = localTime ? localTime.format(timeFormat.format) : '';

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

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[180px]">{t('verification.scheduledVerification')}</div>
        <div className={config.isScheduledVerificationEnabled ? '' : 'text-gray-500'}>
          {config.isScheduledVerificationEnabled ? t('verification.configEnabled') : t('verification.configDisabled')}
        </div>
      </div>

      {config.isScheduledVerificationEnabled && (
        <>
          <div className="mt-5 mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('verification.verificationInterval')}</div>
            <div>
              {isAfterBackup
                ? t('common.afterBackup')
                : verificationInterval?.type
                  ? intervalLabels[verificationInterval.type]
                  : ''}
            </div>
          </div>

          {!isAfterBackup && verificationInterval?.type === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[180px]">{t('verification.verificationWeekday')}</div>
              <div>{displayedWeekday ? weekdayLabels[displayedWeekday] : ''}</div>
            </div>
          )}

          {!isAfterBackup && verificationInterval?.type === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[180px]">{t('verification.verificationDayOfMonth')}</div>
              <div>{displayedDayOfMonth || ''}</div>
            </div>
          )}

          {!isAfterBackup && verificationInterval?.type === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[180px]">{t('verification.cronExpressionUtc')}</div>
                <code className="rounded bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700">
                  {verificationInterval?.cronExpression || ''}
                </code>
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
                      <div className="mb-1 flex w-full items-center text-xs text-gray-600 dark:text-gray-400">
                        <div className="min-w-[180px]" />
                        <div>
                          {t('verification.nextRun')} {dayjs(nextRun).local().format(dateTimeFormat.format)}
                          <br />({dayjs(nextRun).fromNow()})
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
            </>
          )}

          {!isAfterBackup &&
            verificationInterval?.type !== IntervalType.HOURLY &&
            verificationInterval?.type !== IntervalType.CRON && (
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[180px]">{t('verification.verificationTimeOfDay')}</div>
                <div>{formattedTime}</div>
              </div>
            )}

          <div className="mt-5 mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('verification.notifications')}</div>
            <div>
              {config.sendNotificationsOn.length > 0
                ? config.sendNotificationsOn.map((type) => notificationLabels[type]).join(', ')
                : t('common.none')}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
