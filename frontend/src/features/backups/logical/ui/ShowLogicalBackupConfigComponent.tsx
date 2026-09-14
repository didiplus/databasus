import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useEffect, useState } from 'react';

import {
  type LogicalBackupConfig,
  LogicalBackupNotificationType,
  LogicalRetentionPolicyType,
  logicalBackupConfigApi,
} from '../../../../entity/backups/logical';
import { BackupEncryption } from '../../../../entity/backups/shared';
import type { Database } from '../../../../entity/databases';
import { Period } from '../../../../entity/databases/model/Period';
import { IntervalType } from '../../../../entity/intervals';
import { useTranslation } from '../../../../shared/i18n';
import { getStorageLogoFromType } from '../../../../entity/storages/models/getStorageLogoFromType';
import { getUserTimeFormat } from '../../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
} from '../../../../shared/time/utils';

interface Props {
  database: Database;
}

export const ShowLogicalBackupConfigComponent = ({ database }: Props) => {
  const { t } = useTranslation();

  const [backupConfig, setBackupConfig] = useState<LogicalBackupConfig>();

  const timeFormat = useMemo(() => {
    const is12Hour = getIs12Hour();
    return {
      use12Hours: is12Hour,
      format: is12Hour ? 'h:mm A' : 'HH:mm',
    };
  }, []);

  const dateTimeFormat = useMemo(() => getUserTimeFormat(), []);

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

  const periodLabels: Record<Period, string> = {
    [Period.DAY]: t('backups.period1Day'),
    [Period.WEEK]: t('backups.period1Week'),
    [Period.MONTH]: t('backups.period1Month'),
    [Period.THREE_MONTH]: t('backups.period3Months'),
    [Period.SIX_MONTH]: t('backups.period6Months'),
    [Period.YEAR]: t('backups.period1Year'),
    [Period.TWO_YEARS]: t('backups.period2Years'),
    [Period.THREE_YEARS]: t('backups.period3Years'),
    [Period.FOUR_YEARS]: t('backups.period4Years'),
    [Period.FIVE_YEARS]: t('backups.period5Years'),
    [Period.FOREVER]: t('backups.forever'),
  };

  const notificationLabels: Record<LogicalBackupNotificationType, string> = {
    [LogicalBackupNotificationType.BackupFailed]: t('backups.backupFailed'),
    [LogicalBackupNotificationType.BackupSuccess]: t('backups.backupSuccess'),
  };

  const formatGfsRetention = (config: LogicalBackupConfig): string => {
    const parts: string[] = [];

    if (config.retentionGfsHours > 0) parts.push(`${config.retentionGfsHours} hourly`);
    if (config.retentionGfsDays > 0) parts.push(`${config.retentionGfsDays} daily`);
    if (config.retentionGfsWeeks > 0) parts.push(`${config.retentionGfsWeeks} weekly`);
    if (config.retentionGfsMonths > 0) parts.push(`${config.retentionGfsMonths} monthly`);
    if (config.retentionGfsYears > 0) parts.push(`${config.retentionGfsYears} yearly`);

    return parts.length > 0 ? parts.join(', ') : t('backups.notConfigured');
  };

  useEffect(() => {
    if (database.id) {
      logicalBackupConfigApi.getBackupConfigByDbID(database.id).then((res) => {
        setBackupConfig(res);
      });
    }
  }, [database]);

  if (!backupConfig) return <div />;

  const { backupInterval } = backupConfig;

  const localTime = backupInterval?.timeOfDay
    ? dayjs.utc(backupInterval.timeOfDay, 'HH:mm').local()
    : undefined;

  const formattedTime = localTime ? localTime.format(timeFormat.format) : '';

  const displayedWeekday: number | undefined =
    backupInterval?.type === IntervalType.WEEKLY &&
    backupInterval.weekday &&
    backupInterval.timeOfDay
      ? getLocalWeekday(backupInterval.weekday, backupInterval.timeOfDay)
      : backupInterval?.weekday;

  const displayedDayOfMonth: number | undefined =
    backupInterval?.type === IntervalType.MONTHLY &&
    backupInterval.dayOfMonth &&
    backupInterval.timeOfDay
      ? getLocalDayOfMonth(backupInterval.dayOfMonth, backupInterval.timeOfDay)
      : backupInterval?.dayOfMonth;

  const retentionPolicyType =
    backupConfig.retentionPolicyType ?? LogicalRetentionPolicyType.TimePeriod;

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('backups.backupsEnabled')}</div>
        <div className={backupConfig.isBackupsEnabled ? '' : 'font-bold text-red-600'}>
          {backupConfig.isBackupsEnabled ? t('common.yes') : t('common.no')}
        </div>
      </div>

      {backupConfig.isBackupsEnabled ? (
        <>
          <div className="mt-4 mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups.backupInterval')}</div>
            <div>{backupInterval?.type ? intervalLabels[backupInterval.type] : ''}</div>
          </div>

          {backupInterval?.type === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backups.backupWeekday')}</div>
              <div>
                {displayedWeekday
                  ? weekdayLabels[displayedWeekday as keyof typeof weekdayLabels]
                  : ''}
              </div>
            </div>
          )}

          {backupInterval?.type === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backups.backupDayOfMonth')}</div>
              <div>{displayedDayOfMonth || ''}</div>
            </div>
          )}

          {backupInterval?.type === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[150px]">{t('backups.cronExpressionUtc')}</div>
                <code className="rounded bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700">
                  {backupInterval?.cronExpression || ''}
                </code>
              </div>
              {backupInterval?.cronExpression &&
                (() => {
                  try {
                    const interval = CronExpressionParser.parse(backupInterval.cronExpression, {
                      tz: 'UTC',
                    });
                    const nextRun = interval.next().toDate();
                    return (
                      <div className="mb-1 flex w-full items-center text-xs text-gray-600 dark:text-gray-400">
                        <div className="min-w-[150px]" />
                        <div>
                          {t('backups.nextRun')} {dayjs(nextRun).local().format(dateTimeFormat.format)}
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

          {backupInterval?.type !== IntervalType.HOURLY &&
            backupInterval?.type !== IntervalType.CRON && (
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[150px]">{t('backups.backupTimeOfDay')}</div>
                <div>{formattedTime}</div>
              </div>
            )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups.retryIfFailed')}</div>
            <div>{backupConfig.isRetryIfFailed ? t('common.yes') : t('common.no')}</div>
          </div>

          {backupConfig.isRetryIfFailed && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backups.maxFailedTriesCount')}</div>
              <div>{backupConfig.maxFailedTriesCount}</div>
            </div>
          )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups.retentionPolicy')}</div>
            <div className="flex items-center gap-1">
              {retentionPolicyType === LogicalRetentionPolicyType.TimePeriod && (
                <span>
                  {backupConfig.retentionTimePeriod
                    ? periodLabels[backupConfig.retentionTimePeriod]
                    : ''}
                </span>
              )}
              {retentionPolicyType === LogicalRetentionPolicyType.Count && (
                <span>{t('backups.keepLastNBackups', { count: backupConfig.retentionCount ?? 0 })}</span>
              )}
              {retentionPolicyType === LogicalRetentionPolicyType.GFS && (
                <span className="flex items-center gap-1">
                  {formatGfsRetention(backupConfig)}
                  <Tooltip title={t('backups.gfsTooltip')}>
                    <InfoCircleOutlined style={{ color: 'gray' }} />
                  </Tooltip>
                </span>
              )}
            </div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups.storage')}</div>
            <div className="flex items-center">
              <div>{backupConfig.storage?.name || ''}</div>
              {backupConfig.storage?.type && (
                <img
                  src={getStorageLogoFromType(backupConfig.storage.type)}
                  alt="storageIcon"
                  className="ml-1 h-4 w-4"
                />
              )}
            </div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups.encryption')}</div>
            <div>
              {backupConfig.encryption === BackupEncryption.ENCRYPTED
                ? t('backups.enabled')
                : t('common.none')}
            </div>

            <Tooltip
              className="cursor-pointer"
              title={t('backups.encryptionTooltipLogical')}
            >
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups.notifications')}</div>
            <div>
              {backupConfig.sendNotificationsOn.length > 0
                ? backupConfig.sendNotificationsOn
                    .map((type) => notificationLabels[type])
                    .join(', ')
                : t('common.none')}
            </div>
          </div>
        </>
      ) : (
        <div />
      )}
    </div>
  );
};
