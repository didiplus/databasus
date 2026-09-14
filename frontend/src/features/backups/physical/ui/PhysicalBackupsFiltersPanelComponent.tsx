import { DatePicker, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import {
  PhysicalBackupStatus,
  PhysicalBackupType,
  type PhysicalBackupsFilters,
} from '../../../../entity/backups/physical';
import { useTranslation } from '../../../../shared/i18n';
import { PHYSICAL_BACKUP_STATUS_LABELS } from '../model/physicalBackupStatus';

interface Props {
  filters: PhysicalBackupsFilters;
  onFiltersChange: (filters: PhysicalBackupsFilters) => void;
}

export const PhysicalBackupsFiltersPanelComponent = ({ filters, onFiltersChange }: Props) => {
  const { t } = useTranslation();

  const typeOptions = [
    { label: t('backups.filterFull'), value: PhysicalBackupType.FULL },
    { label: t('backups.filterIncremental'), value: PhysicalBackupType.INCREMENTAL },
    { label: t('backups.filterWal'), value: PhysicalBackupType.WAL },
  ];

  const statusOptions = Object.values(PhysicalBackupStatus).map((status) => ({
    label: PHYSICAL_BACKUP_STATUS_LABELS[status],
    value: status,
  }));

  const handleTypeChange = (types: PhysicalBackupType[]) => {
    onFiltersChange({ ...filters, types: types.length > 0 ? types : undefined });
  };

  const handleStatusChange = (statuses: PhysicalBackupStatus[]) => {
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
          {t('common.type')}
        </span>
        <Select
          mode="multiple"
          value={filters.types ?? []}
          onChange={handleTypeChange}
          options={typeOptions}
          placeholder={t('backups.allTypes')}
          size="small"
          variant="filled"
          className="w-[200px] [&_.ant-select-selector]:!rounded-md"
          allowClear
        />
      </div>

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
