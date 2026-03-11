import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';

const LoginSelect = () => {
  const { t } = useTranslation();
  const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="flex w-[min(420px,100%)] flex-col gap-4 rounded-2xl bg-white p-8 text-center shadow-lg">
        <Logo />
        <div className="flex flex-col gap-3">
          <a
            className="inline-flex items-center justify-center rounded-xl bg-[#fee500] px-4 py-3 text-base font-semibold text-gray-900 no-underline transition-colors duration-200 hover:bg-[#f5dc00]"
            href={kakaoLoginUrl}
          >
            {t('카카오 로그인')}
          </a>
          <a
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 no-underline transition-colors duration-200 hover:bg-gray-50"
            href={googleLoginUrl}
          >
            {t('구글 로그인')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginSelect;
