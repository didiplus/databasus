import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Switch,
  TimePicker,
  Tooltip,
} from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import {
  type LogicalBackupConfig,
  LogicalBackupNotificationType,
  LogicalRetentionPolicyType,
  logicalBackupConfigApi,
} from '../../../../entity/backups/logical';
import { BackupEncryption } from '../../../../entity/backups/shared';
import type { Database } from '../../../../entity/databases';
import { Period } from '../../../../entity/databases/model/Period';
import { type Interval, IntervalType } from '../../../../entity/intervals';
import { type Storage, getStorageLogoFromType, storageApi } from '../../../../entity/storages';
import { useTranslation } from '../../../../shared/i18n';
import { getUserTimeFormat } from '../../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
  getUtcDayOfMonth,
  getUtcWeekday,
} from '../../../../shared/time/utils';
import { ConfirmationComponent } from '../../../../shared/ui';
import { EditStorageComponent } from '../../../storages/ui/edit/EditStorageComponent';

interface Props {
  database: Database;

  isShowBackButton: boolean;
  onBack: () => void;

  isShowCancelButton?: boolean;
  onCancel: () => void;

  saveButtonText?: string;
  isSaveToApi: boolean;
  onSaved: (backupConfig: LogicalBackupConfig) => void;
}

export const EditLogicalBackupConfigComponent = ({
  database,

  isShowBackButton,
  onBack,

  isShowCancelButton,
  onCancel,
  saveButtonText,
  isSaveToApi,
  onSaved,
}: Props) => {
  const { t } = useTranslation();

  const [backupConfig, setBackupConfig] = useState<LogicalBackupConfig>();
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [storages, setStorages] = useState<Storage[]>([]);
  const [isShowCreateStorage, setShowCreateStorage] = useState(false);
  const [storageSelectKey, setStorageSelectKey] = useState(0);

  const [isShowWarn, setIsShowWarn] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const hasAdvancedValues = !!backupConfig?.isRetryIfFailed;
  const [isShowAdvanced, setShowAdvanced] = useState(hasAdvancedValues);
  const [isShowGfsHint, setShowGfsHint] = useState(false);

  const timeFormat = useMemo(() => {
    const is12 = getIs12Hour();
    return { use12Hours: is12, format: is12 ? 'h:mm A' : 'HH:mm' };
  }, []);

  const dateTimeFormat = useMemo(() => getUserTimeFormat(), []);

  const weekdayOptions = [
    { value: 1, label: t('common.weekdayMon') },
    { value: 2, label: t('common.weekdayTue') },
    { value: 3, label: t('common.weekdayWed') },
    { value: 4, label: t('common.weekdayThu') },
    { value: 5, label: t('common.weekdayFri') },
    { value: 6, label: t('common.weekdaySat') },
    { value: 7, label: t('common.weekdaySun') },
  ];

  const retentionPolicyOptions = [
    {
      label: t('backups.gfs'),
      value: LogicalRetentionPolicyType.GFS,
    },
    { label: t('backups.timePeriod'), value: LogicalRetentionPolicyType.TimePeriod },
    { label: t('backups.count'), value: LogicalRetentionPolicyType.Count },
  ];

  const updateBackupConfig = (patch: Partial<LogicalBackupConfig>) => {
    setBackupConfig((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsUnsaved(true);
  };

  const saveInterval = (patch: Partial<Interval>) => {
    setBackupConfig((prev) => {
      if (!prev) return prev;

      const updatedBackupInterval = { ...(prev.backupInterval ?? {}), ...patch };

      return { ...prev, backupInterval: updatedBackupInterval as Interval };
    });

    setIsUnsaved(true);
  };

  const saveBackupConfig = async () => {
    if (!backupConfig) return;

    if (isSaveToApi) {
      setIsSaving(true);
      try {
        await logicalBackupConfigApi.saveBackupConfig(backupConfig);
        setIsUnsaved(false);
      } catch (e) {
        alert((e as Error).message);
      }
      setIsSaving(false);
    }

    onSaved(backupConfig);
  };

  const loadStorages = async () => {
    try {
      const storages = await storageApi.getStorages(database.workspaceId);
      setStorages(storages);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);

      try {
        if (database.id) {
          const config = await logicalBackupConfigApi.getBackupConfigByDbID(database.id);
          setBackupConfig(config);
          setIsUnsaved(false);
          setIsSaving(false);
        } else {
          setBackupConfig({
            databaseId: database.id,
            isBackupsEnabled: true,
            backupInterval: {
              type: IntervalType.DAILY,
              timeOfDay: '00:00',
            },
            storage: undefined,
            retentionPolicyType: LogicalRetentionPolicyType.TimePeriod,
            retentionTimePeriod: Period.THREE_MONTH,
            retentionCount: 100,
            retentionGfsHours: 24,
            retentionGfsDays: 7,
            retentionGfsWeeks: 4,
            retentionGfsMonths: 12,
            retentionGfsYears: 3,
            sendNotificationsOn: [LogicalBackupNotificationType.BackupFailed],
            isRetryIfFailed: true,
            maxFailedTriesCount: 3,
            encryption: BackupEncryption.ENCRYPTED,
          });
        }

        await loadStorages();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [database]);

  if (isLoading) {
    return (
      <div className="mb-5 flex items-center">
        <Spin />
      </div>
    );
  }

  if (!backupConfig) return <div />;

  const { backupInterval } = backupConfig;

  const localTime: Dayjs | undefined = backupInterval?.timeOfDay
    ? dayjs.utc(backupInterval.timeOfDay, 'HH:mm').local()
    : undefined;

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

  const isShowGfsHours =
    backupInterval?.type === IntervalType.HOURLY || backupInterval?.type === IntervalType.CRON;

  const isRetentionValid = (() => {
    switch (retentionPolicyType) {
      case LogicalRetentionPolicyType.TimePeriod:
        return Boolean(backupConfig.retentionTimePeriod);
      case LogicalRetentionPolicyType.Count:
        return (backupConfig.retentionCount ?? 0) > 0;
      case LogicalRetentionPolicyType.GFS:
        return (
          (backupConfig.retentionGfsDays ?? 0) > 0 ||
          (backupConfig.retentionGfsWeeks ?? 0) > 0 ||
          (backupConfig.retentionGfsMonths ?? 0) > 0 ||
          (backupConfig.retentionGfsYears ?? 0) > 0
        );
    }
  })();

  const isAllFieldsFilled =
    !backupConfig.isBackupsEnabled ||
    (isRetentionValid &&
      Boolean(backupConfig.storage?.id) &&
      Boolean(backupConfig.encryption) &&
      Boolean(backupInterval?.type) &&
      (!backupInterval ||
        ((backupInterval.type !== IntervalType.WEEKLY || displayedWeekday) &&
          (backupInterval.type !== IntervalType.MONTHLY || displayedDayOfMonth) &&
          (backupInterval.type !== IntervalType.CRON || backupInterval.cronExpression))));

  return (
    <div>
      {database.id && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.backupsEnabled')}</div>
          <Switch
            checked={backupConfig.isBackupsEnabled}
            onChange={(checked) => {
              updateBackupConfig({ isBackupsEnabled: checked });
            }}
            size="small"
          />
        </div>
      )}

      {backupConfig.isBackupsEnabled && (
        <>
          <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.backupInterval')}</div>
            <Select
              value={backupInterval?.type}
              onChange={(v) => {
                saveInterval({ type: v });

                const isDailyOrMore =
                  v === IntervalType.DAILY ||
                  v === IntervalType.WEEKLY ||
                  v === IntervalType.MONTHLY;

                if (isDailyOrMore && retentionPolicyType === LogicalRetentionPolicyType.GFS) {
                  updateBackupConfig({ retentionGfsHours: 24 });
                }
              }}
              size="small"
              className="w-full max-w-[200px] grow"
              options={[
                { label: t('common.hourly'), value: IntervalType.HOURLY },
                { label: t('common.daily'), value: IntervalType.DAILY },
                { label: t('common.weekly'), value: IntervalType.WEEKLY },
                { label: t('common.monthly'), value: IntervalType.MONTHLY },
                { label: t('common.cron'), value: IntervalType.CRON },
              ]}
            />
          </div>

          {backupInterval?.type === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.backupWeekday')}</div>
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

          {backupInterval?.type === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.backupDayOfMonth')}</div>
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

          {backupInterval?.type === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
                <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.cronExpressionUtc')}</div>
                <div className="flex items-center">
                  <Input
                    value={backupInterval?.cronExpression || ''}
                    onChange={(e) => saveInterval({ cronExpression: e.target.value })}
                    placeholder="0 2 * * *"
                    size="small"
                    className="w-full max-w-[200px] grow"
                  />
                  <Tooltip
                    className="cursor-pointer"
                    title={
                      <div>
                        <div className="font-bold">{t('backups.cronFormatHint')}</div>
                        <div className="mt-1">{t('backups.cronExamples')}</div>
                        <div>{t('backups.cronExample1')}</div>
                        <div>{t('backups.cronExample2')}</div>
                        <div>{t('backups.cronExample3')}</div>
                        <div>{t('backups.cronExample4')}</div>
                      </div>
                    }
                  >
                    <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
                  </Tooltip>
                </div>
              </div>
              {backupInterval?.cronExpression &&
                (() => {
                  try {
                    const interval = CronExpressionParser.parse(backupInterval.cronExpression, {
                      tz: 'UTC',
                    });
                    const nextRun = interval.next().toDate();
                    return (
                      <div className="mb-1 flex w-full flex-col items-start text-xs text-gray-600 sm:flex-row sm:items-center dark:text-gray-400">
                        <div className="mb-1 min-w-[150px] sm:mb-0" />
                        <div className="text-gray-600 dark:text-gray-400">
                          {t('backups.nextRun')} {dayjs(nextRun).local().format(dateTimeFormat.format)}
                          <br />({dayjs(nextRun).fromNow()})
                        </div>
                      </div>
                    );
                  } catch {
                    return (
                      <div className="mb-1 flex w-full flex-col items-start text-red-500 sm:flex-row sm:items-center">
                        <div className="mb-1 min-w-[150px] sm:mb-0" />
                        <div className="text-red-500">{t('backups.invalidCron')}</div>
                      </div>
                    );
                  }
                })()}
            </>
          )}

          {backupInterval?.type !== IntervalType.HOURLY &&
            backupInterval?.type !== IntervalType.CRON && (
              <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
                <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.backupTimeOfDay')}</div>
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

                    if (backupInterval?.type === IntervalType.WEEKLY && displayedWeekday) {
                      patch.weekday = getUtcWeekday(displayedWeekday, t);
                    }
                    if (backupInterval?.type === IntervalType.MONTHLY && displayedDayOfMonth) {
                      patch.dayOfMonth = getUtcDayOfMonth(displayedDayOfMonth, t);
                    }

                    saveInterval(patch);
                  }}
                />
              </div>
            )}

          <div className="mb-3" />
        </>
      )}

      <div className="mt-5 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.storage')}</div>
        <div className="flex w-full items-center">
          <Select
            key={storageSelectKey}
            value={backupConfig.storage?.id}
            onChange={(storageId) => {
              if (storageId.includes('create-new-storage')) {
                setShowCreateStorage(true);
                return;
              }

              const selectedStorage = storages.find((s) => s.id === storageId);
              updateBackupConfig({ storage: selectedStorage });

              if (backupConfig.storage?.id) {
                setIsShowWarn(true);
              }
            }}
            size="small"
            className="mr-2 max-w-[200px] grow"
            options={[
              ...storages.map((s) => ({ label: s.name, value: s.id })),
              { label: t('common.createNewStorage'), value: 'create-new-storage' },
            ]}
            placeholder={t('common.selectStorage')}
          />

          {backupConfig.storage?.type && (
            <img
              src={getStorageLogoFromType(backupConfig.storage.type)}
              alt="storageIcon"
              className="ml-1 h-4 w-4"
            />
          )}
        </div>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.encryption')}</div>
        <div className="flex w-full items-center">
          <Select
            value={backupConfig.encryption}
            onChange={(v) => updateBackupConfig({ encryption: v })}
            size="small"
            className="min-w-0 grow"
            options={[
              { label: t('common.none'), value: BackupEncryption.NONE },
              { label: t('common.encryptBackupFiles'), value: BackupEncryption.ENCRYPTED },
            ]}
          />

          <Tooltip
            className="cursor-pointer"
            title={t('backups.encryptionTooltipLogical')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="mt-5 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-start">
        <div className="mt-1 mb-1 min-w-[150px] sm:mb-0">{t('backups.retentionPolicy')}</div>
        <div className="flex min-w-0 grow flex-col gap-1">
          <Select
            value={retentionPolicyType}
            options={retentionPolicyOptions}
            size="small"
            className="w-[200px]"
            popupMatchSelectWidth={false}
            onChange={(v) => {
              const type = v as LogicalRetentionPolicyType;
              const updates: Partial<typeof backupConfig> = { retentionPolicyType: type };

              if (type === LogicalRetentionPolicyType.GFS) {
                updates.retentionGfsHours = 24;
                updates.retentionGfsDays = 7;
                updates.retentionGfsWeeks = 4;
                updates.retentionGfsMonths = 12;
                updates.retentionGfsYears = 3;
              } else if (type === LogicalRetentionPolicyType.Count) {
                updates.retentionCount = 100;
              }

              updateBackupConfig(updates);
            }}
          />

          {retentionPolicyType === LogicalRetentionPolicyType.TimePeriod && (
            <div className="flex w-full items-center">
              <Select
                value={backupConfig.retentionTimePeriod}
                onChange={(v) => updateBackupConfig({ retentionTimePeriod: v })}
                size="small"
                className="min-w-0 grow"
                options={[
                  { label: t('backups.period1Day'), value: Period.DAY },
                  { label: t('backups.period1Week'), value: Period.WEEK },
                  { label: t('backups.period1Month'), value: Period.MONTH },
                  { label: t('backups.period3Months'), value: Period.THREE_MONTH },
                  { label: t('backups.period6Months'), value: Period.SIX_MONTH },
                  { label: t('backups.period1Year'), value: Period.YEAR },
                  { label: t('backups.period2Years'), value: Period.TWO_YEARS },
                  { label: t('backups.period3Years'), value: Period.THREE_YEARS },
                  { label: t('backups.period4Years'), value: Period.FOUR_YEARS },
                  { label: t('backups.period5Years'), value: Period.FIVE_YEARS },
                  { label: t('backups.forever'), value: Period.FOREVER },
                ]}
              />

              <Tooltip
                className="cursor-pointer"
                title={t('backups.retentionTimePeriodTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          )}

          {retentionPolicyType === LogicalRetentionPolicyType.Count && (
            <div className="flex items-center">
              <span className="mr-2 shrink-0 text-sm text-gray-600 dark:text-gray-400">
                {t('backups.mostRecentBackups')}
              </span>
              <InputNumber
                min={1}
                value={backupConfig.retentionCount}
                onChange={(v) => updateBackupConfig({ retentionCount: v ?? 1 })}
                size="small"
                className="w-[80px]"
              />

              <Tooltip
                className="cursor-pointer"
                title={t('backups.retentionCountTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          )}

          {retentionPolicyType === LogicalRetentionPolicyType.GFS && (
            <>
              <div>
                <span
                  className="cursor-pointer text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => setShowGfsHint(!isShowGfsHint)}
                >
                  {isShowGfsHint ? t('backups.hide') : t('backups.whatIsGfs')}
                </span>

                {isShowGfsHint && (
                  <div className="mt-1 max-w-[280px] text-xs text-gray-600 dark:text-gray-400">
                    {t('backups.gfsHint')}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {isShowGfsHours && (
                  <div className="flex items-center gap-2">
                    <span className="w-[110px] text-sm text-gray-600 dark:text-gray-400">
                      {t('backups.hourlyBackups')}
                    </span>
                    <InputNumber
                      min={0}
                      value={backupConfig.retentionGfsHours}
                      onChange={(v) => updateBackupConfig({ retentionGfsHours: v ?? 0 })}
                      size="small"
                      className="w-[80px]"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="w-[110px] text-sm text-gray-600 dark:text-gray-400">
                    {t('backups.dailyBackups')}
                  </span>
                  <InputNumber
                    min={0}
                    value={backupConfig.retentionGfsDays}
                    onChange={(v) => updateBackupConfig({ retentionGfsDays: v ?? 0 })}
                    size="small"
                    className="w-[80px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-[110px] text-sm text-gray-600 dark:text-gray-400">
                    {t('backups.weeklyBackups')}
                  </span>
                  <InputNumber
                    min={0}
                    value={backupConfig.retentionGfsWeeks}
                    onChange={(v) => updateBackupConfig({ retentionGfsWeeks: v ?? 0 })}
                    size="small"
                    className="w-[80px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-[110px] text-sm text-gray-600 dark:text-gray-400">
                    {t('backups.monthlyBackups')}
                  </span>
                  <InputNumber
                    min={0}
                    value={backupConfig.retentionGfsMonths}
                    onChange={(v) => updateBackupConfig({ retentionGfsMonths: v ?? 0 })}
                    size="small"
                    className="w-[80px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[110px] text-sm text-gray-600 dark:text-gray-400">
                    {t('backups.yearlyBackups')}
                  </span>
                  <InputNumber
                    min={0}
                    value={backupConfig.retentionGfsYears}
                    onChange={(v) => updateBackupConfig({ retentionGfsYears: v ?? 0 })}
                    size="small"
                    className="w-[80px]"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {backupConfig.isBackupsEnabled && (
        <>
          <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-start">
            <div className="mt-0 mb-1 min-w-[150px] sm:mt-1 sm:mb-0">{t('backups.notifications')}</div>
            <div className="flex flex-col space-y-2">
              <Checkbox
                checked={backupConfig.sendNotificationsOn.includes(
                  LogicalBackupNotificationType.BackupSuccess,
                )}
                onChange={(e) => {
                  const notifications = [...backupConfig.sendNotificationsOn];
                  const index = notifications.indexOf(LogicalBackupNotificationType.BackupSuccess);
                  if (e.target.checked && index === -1) {
                    notifications.push(LogicalBackupNotificationType.BackupSuccess);
                  } else if (!e.target.checked && index > -1) {
                    notifications.splice(index, 1);
                  }
                  updateBackupConfig({ sendNotificationsOn: notifications });
                }}
              >
                {t('backups.backupSuccess')}
              </Checkbox>

              <Checkbox
                checked={backupConfig.sendNotificationsOn.includes(
                  LogicalBackupNotificationType.BackupFailed,
                )}
                onChange={(e) => {
                  const notifications = [...backupConfig.sendNotificationsOn];
                  const index = notifications.indexOf(LogicalBackupNotificationType.BackupFailed);
                  if (e.target.checked && index === -1) {
                    notifications.push(LogicalBackupNotificationType.BackupFailed);
                  } else if (!e.target.checked && index > -1) {
                    notifications.splice(index, 1);
                  }
                  updateBackupConfig({ sendNotificationsOn: notifications });
                }}
              >
                {t('backups.backupFailed')}
              </Checkbox>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 mb-1 flex items-center">
        <div
          className="flex cursor-pointer items-center text-sm text-blue-600 hover:text-blue-800"
          onClick={() => setShowAdvanced(!isShowAdvanced)}
        >
          <span className="mr-2">{t('backups.advancedSettings')}</span>

          {isShowAdvanced ? (
            <UpOutlined style={{ fontSize: '12px' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px' }} />
          )}
        </div>
      </div>

      {isShowAdvanced && backupConfig.isBackupsEnabled && (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.retryBackupIfFailed')}</div>
            <div className="flex items-center">
              <Switch
                size="small"
                checked={backupConfig.isRetryIfFailed}
                onChange={(checked) => updateBackupConfig({ isRetryIfFailed: checked })}
              />

              <Tooltip
                className="cursor-pointer"
                title={t('backups.retryTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          {backupConfig.isRetryIfFailed && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.maxFailedTriesCount')}</div>
              <div className="flex items-center">
                <InputNumber
                  min={1}
                  max={10}
                  value={backupConfig.maxFailedTriesCount}
                  onChange={(value) => updateBackupConfig({ maxFailedTriesCount: value || 1 })}
                  size="small"
                  className="w-full max-w-[75px] grow"
                />

                <Tooltip
                  className="cursor-pointer"
                  title={t('backups.maxFailedTriesTooltip')}
                >
                  <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
                </Tooltip>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex">
        {isShowBackButton && (
          <Button className="mr-1" type="primary" ghost onClick={onBack}>
            {t('common.back')}
          </Button>
        )}

        {isShowCancelButton && (
          <Button danger ghost className="mr-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}

        <Button
          type="primary"
          className={`${isShowCancelButton ? 'ml-1' : 'ml-auto'} mr-5`}
          onClick={saveBackupConfig}
          loading={isSaving}
          disabled={!isUnsaved || !isAllFieldsFilled}
        >
          {saveButtonText || t('common.save')}
        </Button>
      </div>

      {isShowCreateStorage && (
        <Modal
          title={t('storages.addStorage')}
          footer={<div />}
          open={isShowCreateStorage}
          onCancel={() => {
            setShowCreateStorage(false);
            setStorageSelectKey((prev) => prev + 1);
          }}
          maskClosable={false}
        >
          <div className="my-3 max-w-[275px] text-gray-500 dark:text-gray-400">
            {t('storages.description')}
          </div>

          <EditStorageComponent
            workspaceId={database.workspaceId}
            isShowName
            isShowClose={false}
            onClose={() => setShowCreateStorage(false)}
            onChanged={async (createdStorage) => {
              const hadExistingStorage = !!backupConfig?.storage?.id;
              await loadStorages();
              updateBackupConfig({ storage: createdStorage });
              setShowCreateStorage(false);
              if (hadExistingStorage) {
                setIsShowWarn(true);
              }
            }}
          />
        </Modal>
      )}

      {isShowWarn && (
        <ConfirmationComponent
          onConfirm={() => {
            setIsShowWarn(false);
          }}
          onDecline={() => {
            setIsShowWarn(false);
          }}
          description={t('backups.changeStorageWarning')}
          actionButtonColor="red"
          actionText={t('backups.iUnderstand')}
          cancelText={t('common.cancel')}
          hideCancelButton
        />
      )}
    </div>
  );
};
