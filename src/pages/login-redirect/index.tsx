import { useTranslation } from 'i18nexus';
import { useNavigate } from 'react-router-dom';
import { useLoginRedirect } from '#features/auth';

const LoginRedirect = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useLoginRedirect({ navigate });

  return <div>{t('로그인 처리 중...')}</div>;
};

export default LoginRedirect;
