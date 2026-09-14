import { DatePicker, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { LogicalBackupStatus } from '../../../../entity/backups/logical';
import type { BackupsFilters } from '../../../../entity/backups/logical';
import { useTranslation } from '../../../../shared/i18n';

interface Props {
  filters: BackupsFilters;
  onFiltersChange: (filters: BackupsFilters) => void;
}

export const LogicalBackupsFiltersPanelComponent = ({ filters, onFiltersChange }: Props) => {
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('backups.filterInProgress'), value: LogicalBackupStatus.IN_PROGRESS },
    { label: t('backups.filterSuccessful'), value: LogicalBackupStatus.COMPLETED },
    { label: t('backups.filterFailed'), value: LogicalBackupStatus.FAILED },
    { label: t('backups.filterCanceled'), value: LogicalBackupStatus.CANCELED },
  ];

  const handleStatusChange = (statuses: string[]) => {
    onFiltersChange({ ...filters, statuses: statuses.length > 0 ? statuses : undefined });
  };

  const handleBeforeDateChange = (date: Dayjs | null) => {
    onFiltersChange({
      ...filters,
      beforeDate: date ? date.toISOString() : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="min-w-[90px] text-sm text-gray-500 dark:text-gray-400">
          {t('common.status')}
        </span>
        <Select
          mode="multiple"
          value={filters.statuses ?? []}
          onChange={handleStatusChange}
          options={statusOptions}
          placeholder={t('backups.allStatuses')}
          size="small"
          variant="filled"
          className="w-[200px] [&_.ant-select-selector]:!rounded-md"
          allowClear
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="min-w-[90px] text-sm text-gray-500 dark:text-gray-400">
          {t('backups.before')}
        </span>
        <DatePicker
          value={filters.beforeDate ? dayjs(filters.beforeDate) : null}
          onChange={handleBeforeDateChange}
          size="small"
          variant="filled"
          className="w-[200px] !rounded-md"
          allowClear
        />
      </div>
    </div>
  );
};
