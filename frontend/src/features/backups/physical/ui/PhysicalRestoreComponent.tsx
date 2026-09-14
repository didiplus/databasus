import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { Alert, Button, DatePicker, Input, Segmented, Spin, Tabs } from 'antd';
import type { Dayjs } from 'dayjs';
import { type JSX, useEffect, useState } from 'react';

import { getApplicationServer } from '../../../../constants';
import {
  type PhysicalBackupListItem,
  physicalBackupsApi,
} from '../../../../entity/backups/physical';
import type { Database } from '../../../../entity/databases';
import { useTranslation } from '../../../../shared/i18n';
import { ClipboardHelper } from '../../../../shared/lib/ClipboardHelper';
import {
  type RestoreEnvironment,
  buildDockerScriptCommand,
  buildManualSteps,
  buildScriptCommand,
  clusterDataDir,
  containerDataDir,
  containerVolumeDir,
  debianConfigDir,
} from '../lib/restoreCommands';

interface Props {
  database: Database;
  backup?: PhysicalBackupListItem;
  onClose: () => void;
}

type RestoreMethod = 'script' | 'manual';

const describeRestoreError = (message: string, t: (key: string, params?: Record<string, string | number>) => string): string => {
  if (message.includes('409') || message.toLowerCase().includes('in progress')) {
    return `${message}\n\n${t('backups.restoreErrorInProgress')}`;
  }

  if (message.includes('422') || message.toLowerCase().includes('gap')) {
    return `${message}\n\n${t('backups.restoreErrorWalGap')}`;
  }

  return message;
};

const missingConfigFilesNote = (
  pgVersion: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): JSX.Element => (
  <li>
    {t('backups.missingConfigNote1')} <code>{debianConfigDir(pgVersion)}</code> -{' '}
    {t('backups.missingConfigNote2')} <code>postgresql.conf</code>, <code>pg_hba.conf</code>{' '}
    {t('backups.missingConfigNote3')}{' '}
    <code>psql -Atc &quot;SHOW config_file&quot;</code>, {t('backups.missingConfigNote4')}{' '}
    <code>data_directory</code>, <code>hba_file</code>, <code>ident_file</code>,{' '}
    <code>external_pid_file</code> {t('backups.missingConfigNote5')} <code>ssl</code> /{' '}
    <code>ssl_*</code> {t('backups.missingConfigNote6')} <code>conf.d</code>,{' '}
    {t('backups.missingConfigNote7')} <code>listen_addresses = &apos;*&apos;</code>{' '}
    {t('backups.missingConfigNote8')}
  </li>
);

interface CopyableCommandProps {
  id: string;
  title: string;
  code: string;
  copiedKey: string | null;
  onCopy: (id: string, code: string) => void;
}

const CopyableCommand = ({
  id,
  title,
  code,
  copiedKey,
  onCopy,
}: CopyableCommandProps): JSX.Element => {
  const { t } = useTranslation();
  const isCopied = copiedKey === id;

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">{title}</div>
        <Button
          size="small"
          type="text"
          icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={() => onCopy(id, code)}
        >
          {isCopied ? t('backups.copied') : t('common.copy')}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs whitespace-pre-wrap text-gray-700 dark:bg-gray-700 dark:text-gray-200">
        {code}
      </pre>
    </div>
  );
};

export const PhysicalRestoreComponent = ({ database, backup, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();

  const pgVersion = database.postgresqlPhysical?.version ?? '17';

  const [targetTime, setTargetTime] = useState<Dayjs | undefined>();
  const [isGenerating, setIsGenerating] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [bundleUrl, setBundleUrl] = useState<string>();
  const [restoreMethod, setRestoreMethod] = useState<RestoreMethod>('script');
  const [environment, setEnvironment] = useState<RestoreEnvironment>('host');
  const [outputDir, setOutputDir] = useState('./databasus-restore');
  const [pgBin, setPgBin] = useState('');
  const [dockerImage, setDockerImage] = useState(`postgres:${pgVersion}`);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generateRestore = async () => {
    setIsGenerating(true);
    setErrorMessage(undefined);
    setBundleUrl(undefined);
    setCopiedKey(null);

    try {
      const response = backup
        ? await physicalBackupsApi.generateBackupRestoreToken(backup.id)
        : await physicalBackupsApi.generatePitrRestoreToken(
            database.id,
            targetTime ? targetTime.utc().toISOString() : undefined,
          );

      setBundleUrl(`${getApplicationServer()}${response.url}`);
    } catch (e) {
      setErrorMessage(describeRestoreError((e as Error).message, t));
    }

    setIsGenerating(false);
  };

  const copyText = async (id: string, text: string) => {
    await ClipboardHelper.copyToClipboard(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey((current) => (current === id ? null : current)), 2000);
  };

  useEffect(() => {
    generateRestore();
  }, [targetTime]);

  const hasWal = backup === undefined;
  const dataDir = clusterDataDir(outputDir, pgVersion);
  const scriptUrl = `${getApplicationServer()}/api/v1/backups/physical/recovery-script`;
  const recoveryTargetTime = targetTime ? targetTime.utc().format('YYYY-MM-DD HH:mm:ssZ') : '';
  const walSuffix = hasWal ? ' and its WAL' : '';

  const renderConfig = (env: RestoreEnvironment): JSX.Element => (
    <div className="mb-3">
      <div className="mb-2 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.restoreDirectory')}</div>
        <Input
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
          className="w-full max-w-[320px]"
        />
      </div>
      {env === 'host' ? (
        <div className="flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.postgresqlBinPath')}</div>
          <Input
            value={pgBin}
            onChange={(e) => setPgBin(e.target.value)}
            placeholder={`/usr/lib/postgresql/${pgVersion}/bin (optional)`}
            className="w-full max-w-[320px]"
          />
        </div>
      ) : (
        <div className="flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('backups.postgresqlImage')}</div>
          <Input
            value={dockerImage}
            onChange={(e) => setDockerImage(e.target.value)}
            className="w-full max-w-[320px]"
          />
        </div>
      )}
    </div>
  );

  const renderCommands = (env: RestoreEnvironment, url: string): JSX.Element => {
    if (restoreMethod === 'script') {
      const code =
        env === 'host'
          ? buildScriptCommand({
              scriptUrl,
              bundleUrl: url,
              outputDir,
              pgBin,
              targetTime: recoveryTargetTime,
            })
          : buildDockerScriptCommand({
              scriptUrl,
              bundleUrl: url,
              outputDir,
              image: dockerImage,
              targetTime: recoveryTargetTime,
            });

      return (
        <CopyableCommand
          id={`script-${env}`}
          title={env === 'host' ? t('backups.runOnRestoreHost') : t('backups.runWhereDockerAvailable')}
          code={code}
          copiedKey={copiedKey}
          onCopy={copyText}
        />
      );
    }

    const steps = buildManualSteps({
      bundleUrl: url,
      outputDir,
      pgVersion,
      pgBin,
      image: dockerImage,
      environment: env,
      hasWal,
      targetTime: recoveryTargetTime,
    });

    return (
      <>
        {steps.map((step, index) => (
          <CopyableCommand
            key={step.title}
            id={`manual-${env}-${index}`}
            title={`${index + 1}. ${step.title}`}
            code={step.code}
            copiedKey={copiedKey}
            onCopy={copyText}
          />
        ))}
      </>
    );
  };

  const renderEnvironmentPanel = (env: RestoreEnvironment, url: string): JSX.Element => (
    <div>
      {renderConfig(env)}
      <Alert
        type="info"
        showIcon
        message={t('backups.beforeYouRun')}
        description={
          env === 'host' ? (
            <ul className="ml-4 list-disc">
              <li>{t('backups.hostBeforeRunInstall', { version: pgVersion })}</li>
              <li>{t('backups.hostBeforeRunZstd', { walSuffix })}</li>
              <li>{t('backups.hostBeforeRunEmptyDir')}</li>
            </ul>
          ) : (
            <ul className="ml-4 list-disc">
              <li>{t('backups.dockerBeforeRunImage', { version: pgVersion })}</li>
              <li>{t('backups.dockerBeforeRunTools', { walSuffix })}</li>
            </ul>
          )
        }
      />
      {renderCommands(env, url)}
      <div className="mt-3" />
      <Alert
        type="info"
        showIcon
        message={t('backups.afterItFinishes')}
        description={
          env === 'host' ? (
            <ul className="ml-4 list-disc">
              <li>
                {t('backups.hostAfterClusterAt')} <code>{dataDir}</code>.
              </li>
              <li>
                {t('backups.hostAfterOwnIt')} <code>chown -R postgres:postgres {dataDir}</code>.
              </li>
              <li>
                {t('backups.hostAfterStartIt', { pgCtlCmd: `pg_ctl -D ${dataDir} start` })}
              </li>
              {hasWal && (
                <li>{t('backups.hostAfterWalReplay')}</li>
              )}
              {missingConfigFilesNote(pgVersion, t)}
            </ul>
          ) : (
            <ul className="ml-4 list-disc">
              <li>
                <code>{dataDir}</code> {t('backups.dockerAfterDataDir')}
              </li>
              {Number(pgVersion) >= 18 ? (
                <li>
                  {t('backups.dockerAfterPg18', {
                    version: pgVersion,
                    containerDataDir: containerDataDir(pgVersion),
                    containerVolumeDir: containerVolumeDir(pgVersion),
                  })}
                  <br />
                  <code>
                    {`docker run -e POSTGRES_PASSWORD=... -v "$PWD/${outputDir}:${containerVolumeDir(pgVersion)}" postgres:${pgVersion}`}
                  </code>
                </li>
              ) : (
                <li>
                  {t('backups.dockerAfterPg17', { containerDataDir: containerDataDir(pgVersion) })}
                  <br />
                  <code>
                    {`docker run -e POSTGRES_PASSWORD=... -v "$PWD/${dataDir}:${containerDataDir(pgVersion)}" postgres:${pgVersion}`}
                  </code>
                </li>
              )}
              <li>{t('backups.dockerAfterOwnership')}</li>
              {missingConfigFilesNote(pgVersion, t)}
            </ul>
          )
        }
      />
    </div>
  );

  return (
    <div>
      {backup ? (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          {t('backups.restoreCommandForBackup')}
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            {t('backups.pitrDescription')}
          </div>
          <div className="mb-3 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[120px] sm:mb-0">{t('backups.targetTime')}</div>
            <DatePicker
              showTime
              value={targetTime}
              onChange={(value) => setTargetTime(value ?? undefined)}
              className="w-full max-w-[260px] grow"
              placeholder={t('backups.latestAvailable')}
            />
          </div>
        </>
      )}

      {errorMessage && (
        <div className="mt-3 rounded border border-red-300/50 bg-red-50 px-3 py-2 text-sm whitespace-pre-line text-red-700 dark:border-red-600/30 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {isGenerating && (
        <div className="mt-5 flex items-center gap-2 border-t border-gray-200 pt-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <Spin size="small" />
          {t('backups.preparingRestoreCommand')}
        </div>
      )}

      {!isGenerating && bundleUrl && (
        <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Segmented<RestoreMethod>
            value={restoreMethod}
            onChange={setRestoreMethod}
            options={[
              { label: t('backups.viaScript'), value: 'script' },
              { label: t('backups.manual'), value: 'manual' },
            ]}
          />
          <Tabs
            className="mt-2"
            activeKey={environment}
            onChange={(key) => setEnvironment(key as RestoreEnvironment)}
            items={[
              {
                key: 'host',
                label: t('backups.hostPostgresql'),
                children: renderEnvironmentPanel('host', bundleUrl),
              },
              {
                key: 'docker',
                label: t('backups.docker'),
                children: renderEnvironmentPanel('docker', bundleUrl),
              },
            ]}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('backups.downloadLinkExpiry')}
          </p>
        </div>
      )}

      <div className="mt-4 flex">
        <Button className="ml-auto" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </div>
  );
};
