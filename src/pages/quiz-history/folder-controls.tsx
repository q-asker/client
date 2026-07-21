import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/components/button';
import { Input } from '@/shared/ui/components/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/components/dialog';
import { cn } from '@/shared/ui/lib/utils';
import { Plus, Pencil, Trash2, FolderInput, Inbox, Layers, Folder } from 'lucide-react';
import type { FolderItem, HistoryItem, HistoryScope } from '#features/quiz-history';
import { FOLDER_NAME_MAX } from '#features/quiz-history';

type T = (key: string) => string;

// ── 폴더 생성/이름변경 다이얼로그 ──

interface FolderFormDialogProps {
  t: T;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 이름변경 대상. 없으면 생성 모드 */
  folder?: FolderItem | null;
  onSubmit: (name: string) => Promise<boolean>;
}

export const FolderFormDialog = ({
  t,
  open,
  onOpenChange,
  folder,
  onSubmit,
}: FolderFormDialogProps) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isRename = !!folder;

  useEffect(() => {
    if (open) setName(folder?.name ?? '');
  }, [open, folder]);

  const handleSubmit = async (): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(name);
    setSubmitting(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isRename ? t('폴더 이름 변경') : t('새 폴더')}</DialogTitle>
          <DialogDescription>{t('폴더 이름을 입력하세요.')}</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          maxLength={FOLDER_NAME_MAX}
          placeholder={String(t('폴더 이름'))}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('취소')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {isRename ? t('저장') : t('만들기')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── 폴더 바 (전체/미분류/폴더를 통계와 목록 사이에 가로 한 줄로 상시 노출) ──

interface FolderBarProps {
  t: T;
  folders: FolderItem[];
  unclassifiedCount: number;
  totalCount: number;
  selectedScope: HistoryScope;
  onSelectScope: (scope: HistoryScope) => void;
  onCreate: () => void;
  onRename: (folder: FolderItem) => void;
  onDelete: (folderId: string) => void;
}

export const FolderBar = ({
  t,
  folders,
  unclassifiedCount,
  totalCount,
  selectedScope,
  onSelectScope,
  onCreate,
  onRename,
  onDelete,
}: FolderBarProps) => {
  const activeFolder =
    selectedScope !== 'all' && selectedScope !== 'unclassified'
      ? folders.find((f) => f.folderId === selectedScope)
      : null;

  const chip = (selected: boolean): string =>
    cn(
      'flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
      selected
        ? 'border-primary bg-primary/10 font-medium text-foreground'
        : 'border-border text-muted-foreground hover:bg-muted/60',
    );

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
        {/* 전체 */}
        <button
          type="button"
          onClick={() => onSelectScope('all')}
          className={chip(selectedScope === 'all')}
        >
          <Layers className="size-3.5 shrink-0" />
          {t('전체')}
          <span className="text-xs text-muted-foreground">({totalCount})</span>
        </button>

        {/* 미분류 */}
        <button
          type="button"
          onClick={() => onSelectScope('unclassified')}
          className={chip(selectedScope === 'unclassified')}
        >
          <Inbox className="size-3.5 shrink-0" />
          {t('미분류')}
          <span className="text-xs text-muted-foreground">({unclassifiedCount})</span>
        </button>

        {folders.length > 0 && <div className="mx-1 h-5 w-px shrink-0 bg-border" />}

        {/* 폴더 목록 */}
        {folders.map((f) => (
          <button
            key={f.folderId}
            type="button"
            onClick={() => onSelectScope(f.folderId)}
            className={chip(selectedScope === f.folderId)}
          >
            <Folder className="size-3.5 shrink-0" />
            <span className="max-w-[10rem] truncate">{f.name}</span>
            <span className="text-xs text-muted-foreground">({f.count})</span>
          </button>
        ))}
      </div>

      {/* 선택된 폴더의 이름변경·삭제 */}
      {activeFolder && (
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onRename(activeFolder)}
            title={String(t('폴더 이름 변경'))}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(activeFolder.folderId)}
            title={String(t('폴더 삭제'))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      <Button variant="outline" size="sm" className="shrink-0" onClick={onCreate}>
        <Plus className="mr-1 size-3.5" />
        {t('새 폴더')}
      </Button>
    </div>
  );
};

// ── 기록을 폴더로 이동하는 다이얼로그 ──

interface MoveToFolderDialogProps {
  t: T;
  record: HistoryItem | null;
  folders: FolderItem[];
  onOpenChange: (open: boolean) => void;
  onMove: (historyId: string, folderId: string | null) => void;
}

export const MoveToFolderDialog = ({
  t,
  record,
  folders,
  onOpenChange,
  onMove,
}: MoveToFolderDialogProps) => {
  if (!record) return null;
  const currentFolderId = record.folderId;

  const move = (folderId: string | null): void => {
    if (record.historyId) onMove(record.historyId, folderId);
    onOpenChange(false);
  };

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('폴더로 이동')}</DialogTitle>
          <DialogDescription>{record.title}</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {/* 미분류로 빼기 */}
          <button
            type="button"
            onClick={() => move(null)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60',
              currentFolderId === null && 'bg-muted font-medium',
            )}
          >
            <Inbox className="size-4 text-muted-foreground" />
            {t('미분류로 빼기')}
          </button>
          {folders.map((f) => (
            <button
              key={f.folderId}
              type="button"
              onClick={() => move(f.folderId)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60',
                currentFolderId === f.folderId && 'bg-muted font-medium',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <FolderInput className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{f.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{f.count}</span>
            </button>
          ))}
          {folders.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t('아직 만든 폴더가 없습니다. 새 폴더를 만들어보세요.')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
