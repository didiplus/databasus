import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs from 'dayjs';
import { type JSX, useEffect, useMemo, useState } from 'react';

import {
  type FullBackupsRetention,
  type PhysicalBackupConfig,
  PhysicalBackupNotificationType,
  PhysicalFullBackupsPolicy,
  PhysicalRetention,
  physicalBackupConfigApi,
} from '../../../../entity/backups/physical';
import { BackupEncryption } from '../../../../entity/backups/shared';
import type { Database } from '../../../../entity/databases';
import { type Interval, IntervalType } from '../../../../entity/intervals';
import { useTranslation } from '../../../../shared/i18n';
import { getStorageLogoFromType } from '../../../../entity/storages';
import { getUserTimeFormat } from '../../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
} from '../../../../shared/time/utils';

interface Props {
  database: Database;
}

export const ShowPhysicalBackupConfigComponent = ({ database }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [backupConfig, setBackupConfig] = useState<PhysicalBackupConfig>();

  const timeFormat = useMemo(() => {
    const is12Hour = getIs12Hour();
    return { use12Hours: is12Hour, format: is12Hour ? 'h:mm A' : 'HH:mm' };
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

  const notificationLabels: Record<PhysicalBackupNotificationType, string> = {
    [PhysicalBackupNotificationType.BACKUP_SUCCESS]: t('backups.backupSuccess'),
    [PhysicalBackupNotificationType.BACKUP_FAILED]: t('backups.backupFailed'),
    [PhysicalBackupNotificationType.CHAIN_BROKEN]: t('backups.chainBroken'),
    [PhysicalBackupNotificationType.WAL_GAP]: t('backups.walGap'),
  };

  const retentionLabels: Record<PhysicalRetention, string> = {
    [PhysicalRetention.CHAINS]: t('backups.chains'),
    [PhysicalRetention.FULL_BACKUPS]: t('backups.fullBackups'),
    [PhysicalRetention.CHAINS_AND_FULL_BACKUPS]: t('backups.retentionChainsAndFullBackups'),
  };

  const formatGfsRetention = (retention: FullBackupsRetention): string => {
    const parts: string[] = [];

    if (retention.gfsHours > 0) parts.push(`${retention.gfsHours} hourly`);
    if (retention.gfsDays > 0) parts.push(`${retention.gfsDays} daily`);
    if (retention.gfsWeeks > 0) parts.push(`${retention.gfsWeeks} weekly`);
    if (retention.gfsMonths > 0) parts.push(`${retention.gfsMonths} monthly`);
    if (retention.gfsYears > 0) parts.push(`${retention.gfsYears} yearly`);

    return parts.length > 0 ? parts.join(', ') : t('backups.notConfigured');
  };

  const renderInterval = (label: string, interval?: Interval): JSX.Element | null => {
    if (!interval?.type) return null;

    const localTime = interval.timeOfDay
      ? dayjs.utc(interval.timeOfDay, 'HH:mm').local()
      : undefined;
    const formattedTime = localTime ? localTime.format(timeFormat.format) : '';

    const displayedWeekday =
      interval.type === IntervalType.WEEKLY && interval.weekday && interval.timeOfDay
        ? getLocalWeekday(interval.weekday, interval.timeOfDay)
        : interval.weekday;

    const displayedDayOfMonth =
      interval.type === IntervalType.MONTHLY && interval.dayOfMonth && interval.timeOfDay
        ? getLocalDayOfMonth(interval.dayOfMonth, interval.timeOfDay)
        : interval.dayOfMonth;

    const renderCronNextRun = (): JSX.Element | null => {
      if (!interval.cronExpression) return null;
      try {
        const parsed = CronExpressionParser.parse(interval.cronExpression, { tz: 'UTC' });
        const nextRun = parsed.next().toDate();
        return (
          <div className="mb-1 flex w-full items-center text-xs text-gray-600 dark:text-gray-400">
            <div className="min-w-[180px]" />
            <div>
              {t('backups.nextRun')} {dayjs(nextRun).local().format(dateTimeFormat.format)}
              <br />({dayjs(nextRun).fromNow()})
            </div>
          </div>
        );
      } catch {
        return null;
      }
    };

    return (
      <>
        <div className="mt-4 mb-1 flex w-full items-center">
          <div className="max-w-[150px] min-w-[150px]">{label}</div>
          <div>{intervalLabels[interval.type]}</div>
        </div>

        {interval.type === IntervalType.WEEKLY && (
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('backups.weekday')}</div>
            <div>{displayedWeekday ? weekdayLabels[displayedWeekday] : ''}</div>
          </div>
        )}

        {interval.type === IntervalType.MONTHLY && (
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('backups.dayOfMonth')}</div>
            <div>{displayedDayOfMonth || ''}</div>
          </div>
        )}

        {interval.type === IntervalType.CRON && (
          <>
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[180px]">{t('backups.cronExpressionUtc')}</div>
              <code className="rounded bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700">
                {interval.cronExpression || ''}
              </code>
            </div>
            {renderCronNextRun()}
          </>
        )}

        {interval.type !== IntervalType.HOURLY && interval.type !== IntervalType.CRON && (
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('backups.timeOfDay')}</div>
            <div>{formattedTime}</div>
          </div>
        )}
      </>
    );
  };

  useEffect(() => {
    if (database.id) {
      physicalBackupConfigApi.getPhysicalBackupConfigByDbId(database.id).then((config) => {
        setBackupConfig(config);
      });
    }
  }, [database]);

  if (!backupConfig) return <div />;

  const fullBackupsRetention = backupConfig.fullBackupsRetention;

  const isShowChainsCount =
    backupConfig.retention === PhysicalRetention.CHAINS ||
    backupConfig.retention === PhysicalRetention.CHAINS_AND_FULL_BACKUPS;

  const isShowFullBackups =
    backupConfig.retention === PhysicalRetention.FULL_BACKUPS ||
    backupConfig.retention === PhysicalRetention.CHAINS_AND_FULL_BACKUPS;

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[180px]">{t('backups.backupsEnabled')}</div>
        <div className={backupConfig.isBackupsEnabled ? '' : 'font-bold text-red-600'}>
          {backupConfig.isBackupsEnabled ? t('common.yes') : t('common.no')}
        </div>
      </div>

      {backupConfig.isBackupsEnabled && (
        <>
          {renderInterval(t('backups.fullBackupCadence'), backupConfig.fullBackupInterval)}
          {renderInterval(
            t('backups.incrementalBackupCadence'),
            backupConfig.incrementalBackupInterval,
          )}

          <div className="mt-4 mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('backups.retention')}</div>
            <div>{retentionLabels[backupConfig.retention] ?? '-'}</div>
          </div>

          {isShowChainsCount && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[180px]">{t('backups.chainsKept')}</div>
              <div>{backupConfig.chainsRetention?.count ?? '-'}</div>
            </div>
          )}

          {isShowFullBackups && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[180px]">{t('backups.fullBackupsKept')}</div>
              <div className="flex items-center gap-1">
                {fullBackupsRetention.policy === PhysicalFullBackupsPolicy.LAST_N ? (
                  <span>
                    {t('backups.lastNFullBackups', { count: fullBackupsRetention.count ?? 0 })}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    {formatGfsRetention(fullBackupsRetention)}
                    <Tooltip title={t('backups.gfsFullTooltip')}>
                      <InfoCircleOutlined style={{ color: 'gray' }} />
                    </Tooltip>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('backups.storage')}</div>
            <div className="flex items-center">
              <div>{backupConfig.storage?.name || '-'}</div>
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
            <div className="min-w-[180px]">{t('backups.encryption')}</div>
            <div>
              {backupConfig.encryption === BackupEncryption.ENCRYPTED
                ? t('backups.enabled')
                : t('common.none')}
            </div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[180px]">{t('backups.notifications')}</div>
            <div>
              {backupConfig.sendNotificationsOn.length > 0
                ? backupConfig.sendNotificationsOn
                    .map((type) => notificationLabels[type])
                    .join(', ')
                : t('common.none')}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
