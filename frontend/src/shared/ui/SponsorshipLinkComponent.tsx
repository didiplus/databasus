import { Tooltip } from 'antd';

import { useTranslation } from '../i18n';

interface Props {
  className: string;
}

export const SponsorshipLinkComponent = ({ className }: Props) => {
  const { t } = useTranslation();

  return (
    <Tooltip title={t('sponsorship.tooltip')}>
      <a
        className={`!underline !decoration-blue-600 !decoration-2 underline-offset-4 ${className}`}
        href="https://databasus.com/sponsorship"
        target="_blank"
        rel="noreferrer"
      >
        {t('sponsorship.link')}
      </a>
    </Tooltip>
  );
};
