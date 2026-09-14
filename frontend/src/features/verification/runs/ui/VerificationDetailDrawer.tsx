import { Button, Drawer, Skeleton, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import {
  type RestoreVerification,
  type RestoreVerificationTableStat,
  VerificationStatus,
  VerificationTrigger,
  verificationRunsApi,
} from '../../../../entity/verification/runs';
import { getUserTimeFormat } from '../../../../shared/time';
import { useTranslation } from '../../../../shared/i18n';

interface Props {
  verificationId: string;
  onClose: () => void;
}

const formatDurationMs = (durationMs?: number) => {
  if (durationMs === undefined || durationMs === null) {
    return '-';
  }

  const totalSeconds = Math.floor(durationMs / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds}s`;
};

const formatSizeBytes = (sizeBytes?: number) => {
  if (sizeBytes === undefined || sizeBytes === null || sizeBytes <= 0) {
    return '-';
  }

  const sizeMb = sizeBytes / (1024 * 1024);

  if (sizeMb >= 1024) {
    return `${Number((sizeMb / 1024).toFixed(2)).toLocaleString()} GB`;
  }

  return `${Number(sizeMb.toFixed(2)).toLocaleString()} MB`;
};


const renderTimestamp = (iso: string) => (
  <span className="flex flex-col items-end">
    <span>{dayjs.utc(iso).local().format(getUserTimeFormat().format)}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400">
      ({dayjs.utc(iso).local().fromNow()})
    </span>
  </span>
);

const renderInfoRow = (label: string, value: React.ReactNode) => (
  <div className="flex items-baseline justify-between border-b border-gray-100 py-1 last:border-b-0 dark:border-gray-700">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm text-gray-800 dark:text-gray-200">{value}</span>
  </div>
);

const renderSection = (title: string, children: React.ReactNode) => (
  <div className="mb-4">
    <div className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
      {title}
    </div>
    {children}
  </div>
);

export const VerificationDetailDrawer = ({ verificationId, onClose }: Props) => {
  const { t } = useTranslation();

  const renderStatusTag = (status: VerificationStatus) => {
    if (status === VerificationStatus.COMPLETED) {
      return <Tag color="green">{t('common.successful')}</Tag>;
    }

    if (status === VerificationStatus.FAILED) {
      return <Tag color="red">{t('common.failed')}</Tag>;
    }

    if (status === VerificationStatus.RUNNING) {
      return <Tag color="blue">{t('common.running')}</Tag>;
    }

    if (status === VerificationStatus.PENDING) {
      return <Tag>{t('common.pending')}</Tag>;
    }

    if (status === VerificationStatus.CANCELED) {
      return <Tag color="default">{t('common.canceled')}</Tag>;
    }

    return <Tag>{status}</Tag>;
  };

  const renderTriggerTag = (trigger: VerificationTrigger) => {
    if (trigger === VerificationTrigger.MANUAL) {
      return <Tag color="blue">{t('common.manual')}</Tag>;
    }

    return <Tag color="purple">{t('common.scheduled')}</Tag>;
  };

  const [verification, setVerification] = useState<RestoreVerification | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();

  const loadVerification = () => {
    setIsLoading(true);
    setLoadError(undefined);

    verificationRunsApi
      .getById(verificationId)
      .then(setVerification)
      .catch((e: Error) => {
        alert(e.message);
        setLoadError(e.message);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadVerification();
  }, [verificationId]);

  const sortedStats = useMemo(
    () => [...(verification?.tableStats ?? [])].sort((a, b) => b.rowCount - a.rowCount),
    [verification],
  );

  const tableStatColumns: ColumnsType<RestoreVerificationTableStat> = [
    {
      title: t('verification.columnSchema'),
      dataIndex: 'schemaName',
      key: 'schemaName',
      width: 140,
      render: (schemaName: string) => <span className="font-mono text-xs">{schemaName}</span>,
    },
    {
      title: t('verification.columnTable'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-mono text-xs">{name}</span>,
    },
    {
      title: t('verification.columnRows'),
      dataIndex: 'rowCount',
      key: 'rowCount',
      width: 120,
      align: 'right',
      render: (rowCount: number) => (
        <span className="tabular-nums">{rowCount.toLocaleString()}</span>
      ),
      sorter: (a, b) => a.rowCount - b.rowCount,
    },
  ];

  return (
    <Drawer
      title={t('verification.detailTitle')}
      placement="right"
      width={520}
      onClose={onClose}
      open={true}
      maskClosable={true}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : loadError || !verification ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('verification.detailLoadError')}
          </div>
          <Button onClick={loadVerification}>{t('common.retry')}</Button>
        </div>
      ) : (
        <div>
          {verification.failMessage &&
            (verification.status === VerificationStatus.CANCELED ? (
              <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <div className="mb-1 font-semibold">{t('verification.cancellationReason')}</div>
                <div className="break-words whitespace-pre-wrap">{verification.failMessage}</div>
              </div>
            ) : (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <div className="mb-1 font-semibold">{t('verification.failure')}</div>
                <div className="break-words whitespace-pre-wrap">{verification.failMessage}</div>
              </div>
            ))}

          {renderSection(
            t('common.status'),
            <>
              {renderInfoRow(t('common.status'), renderStatusTag(verification.status))}
              {renderInfoRow(t('verification.trigger'), renderTriggerTag(verification.trigger))}
              {renderInfoRow(t('verification.attemptLabel'), verification.attemptCount)}
            </>,
          )}

          {renderSection(
            t('verification.timeline'),
            <>
              {renderInfoRow(t('verification.columnCreatedAt'), renderTimestamp(verification.createdAt))}
              {verification.startedAt &&
                renderInfoRow(t('verification.startedAt'), renderTimestamp(verification.startedAt))}
              {verification.finishedAt &&
                renderInfoRow(t('verification.finishedAt'), renderTimestamp(verification.finishedAt))}
            </>,
          )}

          {renderSection(
            t('verification.resultsDiagnostics'),
            <>
              {renderInfoRow(t('verification.restoreDuration'), formatDurationMs(verification.restoreDurationMs))}
              {renderInfoRow(t('verification.verifyDuration'), formatDurationMs(verification.verifyDurationMs))}
              {renderInfoRow(
                t('verification.restoredDbSize'),
                formatSizeBytes(verification.dbSizeBytesAfterRestore),
              )}
              {renderInfoRow(t('verification.schemas'), verification.schemaCount ?? '-')}
              {renderInfoRow(t('verification.tables'), verification.tableCount ?? '-')}
              {verification.pgRestoreExitCode !== undefined &&
                verification.pgRestoreExitCode !== null &&
                renderInfoRow(t('verification.pgRestoreExitCode'), verification.pgRestoreExitCode)}
            </>,
          )}

          <h3 className="mt-2 mb-2 text-base font-semibold dark:text-white">
            {t('verification.perTableRowCounts')}
          </h3>
          {sortedStats.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('verification.noPerTableStats')}
            </div>
          ) : (
            <Table
              bordered
              size="small"
              columns={tableStatColumns}
              dataSource={sortedStats}
              rowKey="id"
              pagination={false}
            />
          )}
        </div>
      )}
    </Drawer>
  );
};
