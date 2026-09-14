import { Spin } from 'antd';
import { useEffect, useState } from 'react';

import { healthcheckConfigApi } from '../../../entity/healthcheck';
import type { HealthcheckConfig } from '../../../entity/healthcheck';
import { useTranslation } from '../../../shared/i18n';

interface Props {
  databaseId: string;
}

export const ShowHealthcheckConfigComponent = ({ databaseId }: Props) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [healthcheckConfig, setHealthcheckConfig] = useState<HealthcheckConfig | undefined>(
    undefined,
  );

  useEffect(() => {
    setIsLoading(true);
    healthcheckConfigApi
      .getHealthcheckConfig(databaseId)
      .then((config) => {
        setHealthcheckConfig(config);
      })
      .catch((error) => {
        alert(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [databaseId]);

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (!healthcheckConfig) {
    return <div />;
  }

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center">
        <div className="min-w-[180px]">{t('healthcheck.showEnabled')}</div>
        <div>{healthcheckConfig.isHealthcheckEnabled ? t('common.yes') : t('common.no')}</div>
      </div>

      {healthcheckConfig.isHealthcheckEnabled && (
        <>
          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">{t('healthcheck.notifyUnavailable')}</div>
            <div className="lg:w-[200px]">
              {healthcheckConfig.isSentNotificationWhenUnavailable
                ? t('common.yes')
                : t('common.no')}
            </div>
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">{t('healthcheck.checkInterval')}</div>
            <div className="lg:w-[200px]">{healthcheckConfig.intervalMinutes}</div>
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">{t('healthcheck.attemptsBeforeDown')}</div>
            <div className="lg:w-[200px]">{healthcheckConfig.attemptsBeforeConcideredAsDown}</div>
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[180px]">{t('healthcheck.storeAttempts')}</div>
            <div className="lg:w-[200px]">{healthcheckConfig.storeAttemptsDays}</div>
          </div>
        </>
      )}
    </div>
  );
};
