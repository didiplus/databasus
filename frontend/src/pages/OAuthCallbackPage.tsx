import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { getOAuthRedirectUri } from '../constants';
import { userApi } from '../entity/users';
import { useTranslation } from '../shared/i18n';

export function OAuthCallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        setError(t('oauth.authCodeNotFound'));
        return;
      }

      if (!state) {
        setError(t('oauth.stateMissing'));
        return;
      }

      const redirectUri = getOAuthRedirectUri();

      try {
        if (state === 'github') {
          await userApi.handleGitHubOAuth({ code, redirectUri });
        } else if (state === 'google') {
          await userApi.handleGoogleOAuth({ code, redirectUri });
        } else {
          setError(t('oauth.invalidProvider'));
          return;
        }

        navigate('/');
      } catch (e) {
        setError((e as Error).message || t('oauth.authFailed'));
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, t]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      {error ? (
        <div>
          <div className="mb-4 text-center text-xl font-semibold text-red-600">
            {t('oauth.authFailedTitle')}
          </div>
          <div className="text-center text-sm text-gray-600">{error}</div>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cursor-pointer font-medium text-blue-600 hover:text-blue-700"
            >
              {t('oauth.returnToSignIn')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
          <div className="mt-4 text-gray-600">{t('oauth.completing')}</div>
        </div>
      )}
    </div>
  );
}
