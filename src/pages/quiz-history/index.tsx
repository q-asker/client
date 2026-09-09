import { useState } from 'react';
import { useTranslation } from 'i18nexus';
import Header from '#widgets/header';
import { useNavigate } from 'react-router-dom';
import { useQuizHistory } from '#features/quiz-history';
import type { FolderItem, HistoryItem, HistoryScope } from '#features/quiz-history';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import InlineEdit from '@/shared/ui/components/inline-edit';
import { FolderBar, FolderFormDialog, MoveToFolderDialog } from './folder-controls';
import {
  WrongAnswerCta,
  WrongAnswerCtaReason,
  WrongAnswerEmptyNotice,
  WrongAnswerResultDialog,
  getQuizTypeLabels,
} from './wrong-answer-controls';
import { useWrongAnswerSet } from '#features/wrong-answer-set';
import {
  FileText,
  Trophy,
  CheckCircle,
  BarChart3,
  Trash2,
  Play,
  RotateCcw,
  Plus,
  FolderInput,
  Folder as FolderIcon,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const QuizHistory = () => {
  const { t, currentLanguage } = useTranslation('quiz-history');
  const navigate = useNavigate();

  const {
    state: {
      quizHistory,
      loading,
      listLoading,
      isAuthenticated,
      stats,
      folders,
      unclassifiedCount,
      selectedScope,
      pagination,
    },
    actions: {
      navigateToDetail,
      navigateToQuiz,
      deleteQuizRecord,
      changeTitle,
      clearAllHistory,
      formatDate,
      handleCreateFromEmpty,
      goToPage,
      selectScope,
      createFolder,
      renameFolder,
      deleteFolder,
      assignFolder,
      refresh,
    },
  } = useQuizHistory({ t, navigate, currentLanguage });

  const quizTypeLabels = getQuizTypeLabels(t);
  const {
    submitting: collecting,
    result: wrongAnswerResult,
    collect,
    clearResult,
  } = useWrongAnswerSet();
  // 특정 폴더를 보고 있을 때만 실행할 수 있다 (FR-017)
  const folderSelected = selectedScope !== 'all' && selectedScope !== 'unclassified';

  /**
   * 오답 모아풀기 실행. 만들어진 문제집은 이 폴더에 함께 들어가므로(확정 제품 결정 5)
   * 목록과 폴더 카운트를 같이 다시 읽는다. 1개만 만들어졌으면 고르는 단계 없이 곧바로 풀이로 간다.
   */
  const handleCollectWrongAnswers = async (): Promise<void> => {
    if (!folderSelected) return;
    const result = await collect(selectedScope);
    if (!result) return;
    await refresh();
    if (result.createdSets.length === 1) {
      clearResult();
      navigate(`/quiz/${result.createdSets[0].problemSetId}`);
    }
  };

  const handleSelectWrongAnswerSet = (problemSetId: string): void => {
    clearResult();
    navigate(`/quiz/${problemSetId}`);
  };

  const handleSelectScope = (scope: HistoryScope): void => {
    clearResult();
    selectScope(scope);
  };

  // 인라인 제목 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  // 폴더 다이얼로그 상태
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FolderItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<HistoryItem | null>(null);

  const openCreateFolder = (): void => {
    setRenameTarget(null);
    setFolderFormOpen(true);
  };
  const openRenameFolder = (folder: FolderItem): void => {
    setRenameTarget(folder);
    setFolderFormOpen(true);
  };

  // 폴더/미분류/현재목록 중 하나라도 있으면 폴더 UI를 노출(전역 기준: /folders 응답 기반)
  const hasAnyContent = folders.length > 0 || unclassifiedCount > 0 || quizHistory.length > 0;
  // 필터 바 '전체' 카운트는 전역 총계(미분류 + 폴더별 합)로 계산 — 목록 필터에 흔들리지 않게
  const globalTotal = unclassifiedCount + folders.reduce((sum, f) => sum + f.count, 0);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-8 max-md:p-4">
          <div className="mx-auto max-w-6xl space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-6 py-8 max-md:px-4">
          {/* 헤더 */}
          <BlurFade delay={0.1}>
            <div className="mb-6 flex items-end justify-between max-md:flex-col max-md:items-start max-md:gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('내 퀴즈 기록')}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t('지금까지 만들고 푼 퀴즈들을 확인해보세요')}
                </p>
              </div>
              {isAuthenticated && quizHistory.length > 0 && (
                <Button variant="destructive" size="sm" onClick={clearAllHistory}>
                  <Trash2 className="mr-1 size-3.5" />
                  {t('전체 삭제')}
                </Button>
              )}
            </div>
          </BlurFade>

          {/* 비로그인 안내 */}
          {!isAuthenticated && (
            <BlurFade delay={0.2}>
              <div className="flex flex-col items-center py-20 text-center">
                <LogIn className="mb-4 size-10 text-muted-foreground opacity-40" />
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {t('로그인이 필요한 서비스입니다')}
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t('퀴즈 기록은 로그인 후에 확인할 수 있습니다.')}
                </p>
                <Button size="sm" onClick={() => navigate('/login')}>
                  <LogIn className="mr-1 size-3.5" />
                  {t('로그인하기')}
                </Button>
              </div>
            </BlurFade>
          )}

          {/* 폴더 생성/이름변경 · 이동 다이얼로그 (포털 — 위치 무관) */}
          <FolderFormDialog
            t={t}
            open={folderFormOpen}
            onOpenChange={setFolderFormOpen}
            folder={renameTarget}
            onSubmit={(name) =>
              renameTarget ? renameFolder(renameTarget.folderId, name) : createFolder(name)
            }
          />
          <MoveToFolderDialog
            t={t}
            record={moveTarget}
            folders={folders}
            onOpenChange={(open) => !open && setMoveTarget(null)}
            onMove={assignFolder}
          />
          {/* 유형별로 2개 이상 만들어졌을 때만 고르게 한다 (FR-007) */}
          <WrongAnswerResultDialog
            t={t}
            result={
              wrongAnswerResult && wrongAnswerResult.createdSets.length > 1
                ? wrongAnswerResult
                : null
            }
            onOpenChange={(open) => !open && clearResult()}
            onSelect={handleSelectWrongAnswerSet}
          />

          {/* 로그인·전역 기록 없음: 퀴즈 만들기 안내 (전체폭) */}
          {isAuthenticated && !hasAnyContent && (
            <BlurFade delay={0.2}>
              <div className="flex flex-col items-center py-20 text-center">
                <FileText className="mb-4 size-10 text-muted-foreground opacity-40" />
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {t('아직 만든 퀴즈가 없습니다')}
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t('퀴즈를 만들어서 문제를 풀어보세요!')}
                </p>
                <Button size="sm" onClick={handleCreateFromEmpty}>
                  <Plus className="mr-1 size-3.5" />
                  {t('퀴즈 만들기')}
                </Button>
              </div>
            </BlurFade>
          )}

          {/* 로그인·기록 있음: 통계 → 폴더 바(한 줄) → 목록 */}
          {isAuthenticated && hasAnyContent && (
            <>
              {quizHistory.length > 0 && (
                <BlurFade delay={0.2}>
                  <div className="mb-6 flex items-center gap-6 rounded-lg border border-border bg-card px-5 py-3 text-sm max-md:grid max-md:grid-cols-2 max-md:gap-3 max-md:px-4 max-md:py-3">
                    <div className="flex items-center gap-1.5">
                      <FileText className="size-4 text-primary" />
                      <span className="text-muted-foreground">{t('총 퀴즈 수')}</span>
                      <span className="font-bold text-foreground">{stats.totalQuizzes}</span>
                    </div>
                    <div className="hidden h-4 border-l border-border md:block" />
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="size-4 text-chart-2" />
                      <span className="text-muted-foreground">{t('완료한 퀴즈')}</span>
                      <span className="font-bold text-foreground">{stats.completedQuizzes}</span>
                    </div>
                    <div className="hidden h-4 border-l border-border md:block" />
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="size-4 text-accent-foreground" />
                      <span className="text-muted-foreground">{t('완료율')}</span>
                      <span className="font-bold text-foreground">{stats.completionRate}%</span>
                    </div>
                    <div className="hidden h-4 border-l border-border md:block" />
                    <div className="flex items-center gap-1.5">
                      <Trophy className="size-4 text-chart-3" />
                      <span className="text-muted-foreground">{t('평균 점수')}</span>
                      <span className="font-bold text-foreground">
                        {stats.averageScore}
                        {t('점')}
                      </span>
                    </div>
                  </div>
                </BlurFade>
              )}

              {/* 폴더 바: 통계와 목록 사이에 한 줄로 상시 노출 */}
              <BlurFade delay={0.25}>
                <FolderBar
                  t={t}
                  folders={folders}
                  unclassifiedCount={unclassifiedCount}
                  totalCount={globalTotal}
                  selectedScope={selectedScope}
                  onSelectScope={handleSelectScope}
                  onCreate={openCreateFolder}
                  onRename={openRenameFolder}
                  onDelete={deleteFolder}
                  actionSlot={
                    <WrongAnswerCta
                      t={t}
                      folderSelected={folderSelected}
                      submitting={collecting}
                      onClick={handleCollectWrongAnswers}
                    />
                  }
                />
                {/* 폴더 미선택 사유는 눌러보기 전에 드러낸다 (FR-017) */}
                {!folderSelected && <WrongAnswerCtaReason t={t} />}
              </BlurFade>

              {/* 모을 오답이 없었을 때의 인라인 안내 (FR-011·FR-016a) */}
              {wrongAnswerResult && wrongAnswerResult.createdSets.length === 0 && (
                <WrongAnswerEmptyNotice t={t} result={wrongAnswerResult} onDismiss={clearResult} />
              )}

              {quizHistory.length === 0 ? (
                <BlurFade delay={0.2}>
                  <div className="flex flex-col items-center py-16 text-center">
                    <FolderIcon className="mb-4 size-10 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      {selectedScope === 'unclassified'
                        ? t('미분류 기록이 없습니다.')
                        : selectedScope === 'all'
                          ? t('아직 만든 퀴즈가 없습니다')
                          : t('이 폴더에 기록이 없습니다.')}
                    </p>
                  </div>
                </BlurFade>
              ) : (
                /* 테이블형 리스트 */
                <BlurFade delay={0.4}>
                  <div
                    className={cn(
                      'overflow-hidden rounded-lg border border-border bg-card',
                      listLoading && 'opacity-60 transition-opacity',
                    )}
                  >
                    {/* 테이블 헤더 */}
                    <div className="hidden border-b border-border bg-muted/50 px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1.5fr_150px_64px_56px_120px_120px_72px] md:gap-2">
                      <span>{t('제목')}</span>
                      <span>{t('퀴즈 유형')}</span>
                      <span className="text-center">{t('상태')}</span>
                      <span className="text-center">{t('점수')}</span>
                      <span className="text-center">{t('생성일')}</span>
                      <span className="text-center">{t('완료일')}</span>
                      <span className="text-right">{t('액션')}</span>
                    </div>

                    {/* 행 목록 (필터 전환 시 재생 애니메이션 제거로 깜빡임 방지) */}
                    {quizHistory.map((record) => (
                      <div key={record.problemSetId}>
                        {/* 데스크톱: 테이블 행 */}
                        <div
                          className={cn(
                            'group/row hidden border-b border-border px-5 py-3 last:border-b-0',
                            'md:grid md:grid-cols-[1.5fr_150px_64px_56px_120px_120px_72px] md:items-center md:gap-2',
                            record.completed &&
                              'cursor-pointer transition-colors duration-150 hover:bg-muted/30',
                          )}
                          onClick={() => record.completed && navigateToDetail(record)}
                        >
                          {/* 제목 */}
                          <div
                            className="flex items-center gap-2 min-w-0"
                            onClick={(e) =>
                              editingId === record.problemSetId && e.stopPropagation()
                            }
                          >
                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                            <InlineEdit
                              value={record.title}
                              editing={editingId === record.problemSetId}
                              onStartEdit={() => setEditingId(record.problemSetId)}
                              onCancel={() => setEditingId(null)}
                              onSubmit={(v) => changeTitle(record.problemSetId, v)}
                              size="sm"
                              editButtonClassName="opacity-0 group-hover/row:opacity-100 transition-opacity"
                            />
                            {/* 오답을 모아 만든 문제집임을 구별 (FR-013). 근거는 origin 필드 — 제목은
                                사용자가 바꿀 수 있으므로 파싱하지 않는다 */}
                            {record.origin === 'WRONG_ANSWER' && (
                              <Badge
                                variant="outline"
                                className="shrink-0 gap-1 text-[0.65rem] font-normal"
                              >
                                <RotateCcw className="size-3" />
                                {t('오답 모음')}
                              </Badge>
                            )}
                            {selectedScope === 'all' && record.folderName && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 gap-1 text-[0.65rem] font-normal"
                              >
                                <FolderIcon className="size-3" />
                                {record.folderName}
                              </Badge>
                            )}
                          </div>

                          {/* 퀴즈 유형 */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate text-sm text-muted-foreground">
                              {quizTypeLabels[record.quizType]}
                            </span>
                            <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                              {record.totalCount}
                              {t('문제')}
                            </Badge>
                          </div>

                          {/* 상태 */}
                          <div className="text-center">
                            <Badge
                              variant={record.completed ? 'default' : 'secondary'}
                              className="text-[0.65rem]"
                            >
                              {record.completed ? t('완료') : t('미완료')}
                            </Badge>
                          </div>

                          {/* 점수 */}
                          <div className="text-center text-sm font-semibold">
                            {record.completed && record.score !== null ? (
                              <span className="text-foreground">
                                {record.quizType === 'ESSAY'
                                  ? record.score
                                  : Math.round((record.score / record.totalCount) * 100)}
                                {t('점')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>

                          {/* 생성일 */}
                          <div className="text-center text-xs text-muted-foreground">
                            {record.createdAt ? formatDate(record.createdAt) : '-'}
                          </div>

                          {/* 완료일 */}
                          <div className="text-center text-xs text-muted-foreground">
                            {record.takenAt ? formatDate(record.takenAt) : '-'}
                          </div>

                          {/* 액션 */}
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {record.completed ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => navigateToQuiz(record)}
                                title={String(t('다시 풀기'))}
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => navigateToQuiz(record)}
                                title={String(t('퀴즈 풀기'))}
                              >
                                <Play className="size-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={!record.historyId}
                              onClick={() => setMoveTarget(record)}
                              title={String(t('폴더로 이동'))}
                            >
                              <FolderInput className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => deleteQuizRecord(record.problemSetId)}
                              title={String(t('삭제'))}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* 모바일: 카드형 */}
                        <div
                          className={cn(
                            'group/row border-b border-border px-4 py-3 last:border-b-0 md:hidden',
                            record.completed &&
                              'cursor-pointer transition-colors duration-150 active:bg-muted/30',
                          )}
                          onClick={() => record.completed && navigateToDetail(record)}
                        >
                          {/* 상단: 제목 + 점수/상태 */}
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex min-w-0 flex-1 items-start gap-2"
                              onClick={(e) =>
                                editingId === record.problemSetId && e.stopPropagation()
                              }
                            >
                              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              <InlineEdit
                                value={record.title}
                                editing={editingId === record.problemSetId}
                                onStartEdit={() => setEditingId(record.problemSetId)}
                                onCancel={() => setEditingId(null)}
                                onSubmit={(v) => changeTitle(record.problemSetId, v)}
                                size="sm"
                                editButtonClassName="opacity-100"
                              />
                            </div>
                            {record.completed && record.score !== null ? (
                              <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                {record.quizType === 'ESSAY'
                                  ? record.score
                                  : Math.round((record.score / record.totalCount) * 100)}
                                {t('점')}
                              </span>
                            ) : (
                              <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
                                {t('미완료')}
                              </Badge>
                            )}
                          </div>

                          {/* 하단: 메타 + 액션 */}
                          <div className="mt-2 flex items-center justify-between pl-6">
                            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                              {record.origin === 'WRONG_ANSWER' && (
                                <>
                                  <span className="flex shrink-0 items-center gap-0.5 font-medium text-foreground">
                                    <RotateCcw className="size-3" />
                                    {t('오답 모음')}
                                  </span>
                                  <span className="text-border">·</span>
                                </>
                              )}
                              <span>{quizTypeLabels[record.quizType]}</span>
                              <span className="text-border">·</span>
                              <span>
                                {record.totalCount}
                                {t('문제')}
                              </span>
                              <span className="text-border">·</span>
                              <span>{record.createdAt ? formatDate(record.createdAt) : '-'}</span>
                              {selectedScope === 'all' && record.folderName && (
                                <>
                                  <span className="text-border">·</span>
                                  <span className="flex min-w-0 items-center gap-0.5">
                                    <FolderIcon className="size-3 shrink-0" />
                                    <span className="truncate">{record.folderName}</span>
                                  </span>
                                </>
                              )}
                            </div>
                            <div
                              className="flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => navigateToQuiz(record)}
                                title={String(record.completed ? t('다시 풀기') : t('퀴즈 풀기'))}
                              >
                                {record.completed ? (
                                  <RotateCcw className="size-3.5" />
                                ) : (
                                  <Play className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={!record.historyId}
                                onClick={() => setMoveTarget(record)}
                                title={String(t('폴더로 이동'))}
                              >
                                <FolderInput className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                onClick={() => deleteQuizRecord(record.problemSetId)}
                                title={String(t('삭제'))}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 페이지 이동 — 훅이 이미 주는 pagination·goToPage 를 화면에 연결한다.
                      없으면 한 페이지(20건)를 넘어간 기록은 화면에서 닿을 수단이 없다. */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pagination.currentPage === 0 || listLoading}
                        onClick={() => goToPage(pagination.currentPage - 1)}
                        title={String(t('이전 페이지'))}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-sm font-medium text-muted-foreground">
                        {pagination.currentPage + 1} / {pagination.totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          pagination.currentPage + 1 >= pagination.totalPages || listLoading
                        }
                        onClick={() => goToPage(pagination.currentPage + 1)}
                        title={String(t('다음 페이지'))}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  )}
                </BlurFade>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizHistory;
