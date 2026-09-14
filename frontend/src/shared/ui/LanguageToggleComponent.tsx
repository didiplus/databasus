import { GlobalOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';

import { type Locale, useTranslation } from '../i18n';

export function LanguageToggleComponent() {
  const { locale, setLocale, t } = useTranslation();

  const items: MenuProps['items'] = [
    {
      key: 'en',
      label: (
        <div className="flex items-center gap-2">
          <span>🇬🇧</span>
          <span>{t('language.en')}</span>
        </div>
      ),
      onClick: () => setLocale('en'),
    },
    {
      key: 'zh',
      label: (
        <div className="flex items-center gap-2">
          <span>🇨🇳</span>
          <span>{t('language.zh')}</span>
        </div>
      ),
      onClick: () => setLocale('zh'),
    },
  ];

  const getLabel = (current: Locale) => {
    return current === 'zh' ? t('language.zh') : t('language.en');
  };

  return (
    <Dropdown menu={{ items, selectedKeys: [locale] }} trigger={['click']} placement="bottomRight">
      <button
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        title={t('language.title', { label: getLabel(locale) })}
      >
        <GlobalOutlined style={{ fontSize: 16 }} />
        <span className="hidden sm:inline">{getLabel(locale)}</span>
      </button>
    </Dropdown>
  );
}