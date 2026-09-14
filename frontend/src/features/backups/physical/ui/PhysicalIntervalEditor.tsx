import { InfoCircleOutlined } from '@ant-design/icons';
import { Input, InputNumber, Select, TimePicker, Tooltip } from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs, { Dayjs } from 'dayjs';
import { type JSX, useMemo } from 'react';

import { type Interval, IntervalType } from '../../../../entity/intervals';
import { useTranslation } from '../../../../shared/i18n';
import { getUserTimeFormat } from '../../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
  getUtcDayOfMonth,
  getUtcWeekday,
} from '../../../../shared/time/utils';

interface Props {
  label: string;
  interval?: Interval;
  onChange: (patch: Partial<Interval>) => void;
}

export const PhysicalIntervalEditor = ({ label, interval, onChange }: Props): JSX.Element => {
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

  const timeFormat = useMemo(() => {
    const is12 = getIs12Hour();
    return { use12Hours: is12, format: is12 ? 'h:mm A' : 'HH:mm' };
  }, []);

  const dateTimeFormat = useMemo(() => getUserTimeFormat(), []);

  const localTime: Dayjs | undefined = interval?.timeOfDay
    ? dayjs.utc(interval.timeOfDay, 'HH:mm').local()
    : undefined;

  const displayedWeekday: number | undefined =
    interval?.type === IntervalType.WEEKLY && interval.weekday && interval.timeOfDay
      ? getLocalWeekday(interval.weekday, interval.timeOfDay)
      : interval?.weekday;

  const displayedDayOfMonth: number | undefined =
    interval?.type === IntervalType.MONTHLY && interval.dayOfMonth && interval.timeOfDay
      ? getLocalDayOfMonth(interval.dayOfMonth, interval.timeOfDay)
      : interval?.dayOfMonth;

  return (
    <>
      <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 max-w-[150px] min-w-[150px] leading-4 sm:mb-0">{label}</div>
        <Select
          value={interval?.type}
          onChange={(v) => onChange({ type: v })}
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

      {interval?.type === IntervalType.WEEKLY && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.weekday')}</div>
          <Select
            value={displayedWeekday}
            onChange={(localWeekday) => {
              if (!localWeekday) return;
              const ref = localTime ?? dayjs();
              onChange({ weekday: getUtcWeekday(localWeekday, ref) });
            }}
            size="small"
            className="w-full max-w-[200px] grow"
            options={weekdayOptions}
          />
        </div>
      )}

      {interval?.type === IntervalType.MONTHLY && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.dayOfMonth')}</div>
          <InputNumber
            min={1}
            max={31}
            value={displayedDayOfMonth}
            onChange={(localDom) => {
              if (!localDom) return;
              const ref = localTime ?? dayjs();
              onChange({ dayOfMonth: getUtcDayOfMonth(localDom, ref) });
            }}
            size="small"
            className="w-full max-w-[200px] grow"
          />
        </div>
      )}

      {interval?.type === IntervalType.CRON && (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.cronExpressionUtc')}</div>
            <div className="flex items-center">
              <Input
                value={interval?.cronExpression || ''}
                onChange={(e) => onChange({ cronExpression: e.target.value })}
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
          {interval?.cronExpression &&
            (() => {
              try {
                const parsed = CronExpressionParser.parse(interval.cronExpression, {
                  tz: 'UTC',
                });
                const nextRun = parsed.next().toDate();
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

      {interval?.type !== IntervalType.HOURLY && interval?.type !== IntervalType.CRON && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.timeOfDay')}</div>
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

              if (interval?.type === IntervalType.WEEKLY && displayedWeekday) {
                patch.weekday = getUtcWeekday(displayedWeekday, t);
              }
              if (interval?.type === IntervalType.MONTHLY && displayedDayOfMonth) {
                patch.dayOfMonth = getUtcDayOfMonth(displayedDayOfMonth, t);
              }

              onChange(patch);
            }}
          />
        </div>
      )}
    </>
  );
};
