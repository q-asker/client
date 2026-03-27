import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'i18nexus';
import { Pencil, Check, X } from 'lucide-react';
import { Input } from '@/shared/ui/components/input';
import { Button } from '@/shared/ui/components/button';
import { cn } from '@/shared/ui/lib/utils';

type InlineEditSize = 'sm' | 'md';

const sizeConfig: Record<InlineEditSize, { input: string; btn: string; icon: string }> = {
  sm: { input: 'h-7 text-sm', btn: 'size-6', icon: 'size-3.5' },
  md: { input: 'h-8 text-sm font-medium', btn: 'size-7', icon: 'size-4' },
};

interface InlineEditProps {
  /** 현재 표시할 제목 */
  value: string;
  /** 편집 완료 콜백 (새 값 전달) */
  onSubmit: (newValue: string) => void | Promise<void>;
  /** 편집 모드 여부 (외부 제어) */
  editing: boolean;
  /** 편집 모드 진입 */
  onStartEdit: () => void;
  /** 편집 취소 */
  onCancel: () => void;
  /** 크기 프리셋 */
  size?: InlineEditSize;
  /** 편집 모드 wrapper 클래스 */
  editClassName?: string;
  /** 읽기 모드 텍스트 클래스 */
  textClassName?: string;
  /** 편집 버튼 클래스 (읽기 모드) */
  editButtonClassName?: string;
  /** 편집 버튼 숨김 여부 (비로그인 등) */
  hideEditButton?: boolean;
  /** 읽기 모드에서 텍스트 뒤에 추가할 요소 */
  readSuffix?: ReactNode;
}

const InlineEdit = ({
  value,
  onSubmit,
  editing,
  onStartEdit,
  onCancel,
  size = 'sm',
  editClassName,
  textClassName,
  editButtonClassName,
  hideEditButton = false,
  readSuffix,
}: InlineEditProps) => {
  const { t } = useTranslation('common');
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const s = sizeConfig[size];

  // 편집 모드 진입 시 포커스 + 전체 선택
  useEffect(() => {
    if (editing) {
      setEditValue(value);
      // 다음 프레임에서 포커스 (ref 연결 후)
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, value]);

  const submit = async () => {
    if (editValue.trim() && editValue.trim() !== value) {
      await onSubmit(editValue.trim());
    }
    onCancel();
  };

  if (editing) {
    return (
      <div className={cn('flex items-center gap-1 min-w-0 flex-1', editClassName)}>
        <Input
          ref={inputRef}
          value={editValue}
          maxLength={100}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          className={s.input}
        />
        <Button variant="ghost" size="icon" className={cn(s.btn, 'shrink-0')} onClick={submit}>
          <Check className={cn(s.icon, 'text-primary')} />
        </Button>
        <Button variant="ghost" size="icon" className={cn(s.btn, 'shrink-0')} onClick={onCancel}>
          <X className={cn(s.icon, 'text-muted-foreground')} />
        </Button>
      </div>
    );
  }

  return (
    <>
      <span className={cn('truncate text-sm font-medium text-foreground', textClassName)}>
        {value}
      </span>
      {!hideEditButton && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(s.btn, 'shrink-0', editButtonClassName)}
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          title={String(t('제목 수정'))}
        >
          <Pencil className={cn('text-muted-foreground', size === 'sm' ? 'size-3' : 'size-3.5')} />
        </Button>
      )}
      {readSuffix}
    </>
  );
};

export default InlineEdit;
