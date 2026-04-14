import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { LogIn, LogOut } from 'lucide-react';
import { useTranslation } from 'i18nexus';
import { useAuthStore } from '#entities/auth';
import { authService } from '#entities/auth';
import { useClickOutside } from '#shared/lib/useClickOutside';
import CustomToast from '#shared/toast';

interface AuthButtonProps {
  /** 로그인 클릭 시 새 창으로 열기 (퀴즈 풀기 등 이탈 방지) */
  openInNewTab?: boolean;
  /** 드롭다운 ID 접두사 (같은 페이지에 여러 인스턴스 시 충돌 방지) */
  idPrefix?: string;
  /** 헤더 내 스타일 변형 */
  variant?: 'header' | 'header-mobile' | 'default';
}

/** JWT payload에서 UTF-8 닉네임 추출 */
const decodeNicknameFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1];
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const padded =
      normalized.length % 4
        ? normalized.padEnd(normalized.length + (4 - (normalized.length % 4)), '=')
        : normalized;
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));
    return payload?.nickname ? String(payload.nickname).trim() : null;
  } catch {
    return null;
  }
};

const AuthButton: React.FC<AuthButtonProps> = ({
  openInNewTab = false,
  idPrefix = 'auth',
  variant = 'default',
}) => {
  const { t } = useTranslation('common');
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = hasHydrated && Boolean(accessToken);
  const [isOpen, setIsOpen] = useState(false);

  const displayName = useMemo(() => {
    const nickname = decodeNicknameFromToken(accessToken);
    if (nickname) return nickname;
    const u = user as Record<string, unknown> | null;
    return (
      (
        (u?.nickname as string) ||
        (u?.name as string) ||
        (u?.username as string) ||
        (u?.email as string) ||
        ''
      ).trim() || t('사용자')
    );
  }, [accessToken, user, t]);

  const profileInitial = useMemo(() => displayName.slice(0, 1).toUpperCase() || '?', [displayName]);

  const buttonId = `${idPrefix}ProfileButton`;
  const dropdownId = `${idPrefix}ProfileDropdown`;

  useClickOutside({
    containerId: [dropdownId],
    triggerId: [buttonId],
    onOutsideClick: () => setIsOpen(false),
    isEnabled: isOpen,
  });

  const handleLogout = async () => {
    try {
      await authService.logout();
      CustomToast.info(t('로그아웃되었습니다.'));
    } catch {
      // 인터셉터에서 에러 토스트 처리
    }
    setIsOpen(false);
  };

  const email = (user as Record<string, unknown> | null)?.email as string | undefined;

  if (!hasHydrated) {
    return <div className={variant === 'header-mobile' ? 'size-8' : 'size-9'} />;
  }

  // 미인증 — 로그인 버튼
  if (!isAuthenticated) {
    if (openInNewTab) {
      return (
        <button
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-foreground/20"
          onClick={() => window.open('/login', '_blank', 'noopener')}
        >
          <LogIn className="size-3.5" />
          {t('로그인')}
        </button>
      );
    }
    if (variant === 'header-mobile') {
      return (
        <Link
          className="inline-flex items-center whitespace-nowrap rounded px-2.5 py-1.5 text-sm text-primary no-underline transition-all duration-200 hover:bg-primary/5"
          to="/login"
        >
          <LogIn className="mr-1 size-4" />
          <strong>{t('로그인')}</strong>
        </Link>
      );
    }
    return (
      <Link
        className="inline-flex items-center whitespace-nowrap rounded px-3 py-2 text-sm text-primary no-underline transition-all duration-200 hover:bg-primary/5 hover:text-primary md:text-base"
        to="/login"
      >
        <LogIn className="mr-1.5 size-4" />
        <strong>{t('로그인')}</strong>
      </Link>
    );
  }

  // 인증 — 프로필 버튼 + 드롭다운
  const profileSize =
    variant === 'header-mobile'
      ? 'size-8 text-sm'
      : variant === 'header'
        ? 'size-8 md:size-9 text-sm md:text-base'
        : 'size-8 text-sm';

  const profileColor = openInNewTab
    ? 'border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30'
    : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20';

  return (
    <div className="relative">
      <button
        id={buttonId}
        className={`inline-flex ${profileSize} cursor-pointer items-center justify-center rounded-full border p-0 font-bold transition-colors duration-200 ${profileColor}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={displayName}
        type="button"
      >
        {profileInitial}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={dropdownId}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[240px] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {/* 프로필 정보 */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {profileInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
              </div>
            </div>
            {/* 로그아웃 */}
            <div className="p-1.5">
              <button
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                type="button"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                {t('로그아웃')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthButton;
