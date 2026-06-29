import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ListChecks, PenLine, CircleDot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import InlineEdit from '@/shared/ui/components/inline-edit';
import { Skeleton } from '@/shared/ui/components/skeleton';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import type { QuestionType } from '#features/prepare-quiz';

interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

interface ProblemSetSummary {
  title: string;
  quizType: 'MULTIPLE' | 'BLANK' | 'OX' | 'ESSAY' | 'REAL_BLANK';
  totalCount: number;
}

interface ProblemSetResultCardProps {
  t: (key: string) => string;
  problemSetId: string | null;
  isAuthenticated: boolean;
  handleNavigateToQuiz: () => void;
  handleReCreate: () => void;
  handleRemoveFile: () => void;
  refreshPdfCopy: () => void;
}

/** 생성 완료 결과 카드 — ProblemSet 정보 표시 + 인라인 제목 편집 + CTA */
const ProblemSetResultCard: React.FC<ProblemSetResultCardProps> = ({
  t,
  problemSetId,
  isAuthenticated,
  handleNavigateToQuiz,
  handleReCreate,
  handleRemoveFile,
  refreshPdfCopy,
}) => {
  const [problemSetInfo, setProblemSetInfo] = useState<ProblemSetSummary | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // 생성 완료 후 서버에서 ProblemSet 정보 조회
  useEffect(() => {
    if (!problemSetId) {
      setProblemSetInfo(null);
      return;
    }
    let cancelled = false;
    axiosInstance
      .get<ProblemSetSummary>(`/problem-set/${problemSetId}`)
      .then(({ data }) => {
        if (!cancelled) setProblemSetInfo(data);
      })
      .catch(() => {
        // 조회 실패 시 무시 — 클라이언트 정보 폴백
      });
    return () => {
      cancelled = true;
    };
  }, [problemSetId]);

  const submitTitleEdit = async (trimmed: string) => {
    if (!problemSetId) return;
    try {
      const { data } = await axiosInstance.patch<{ title: string }>(
        `/problem-set/${problemSetId}/title`,
        { title: trimmed },
      );
      // 서버 응답으로 로컬 상태 즉시 반영
      setProblemSetInfo((prev) => (prev ? { ...prev, title: data.title } : prev));
      CustomToast.success(t('제목이 변경되었습니다.'));
    } catch (error) {
      console.error(t('제목 변경 실패:'), error);
    }
  };

  const quizTypes: QuizTypeOption[] = [
    { key: 'ESSAY', label: t('서술형'), icon: FileText },
    { key: 'MULTIPLE', label: t('객관식'), icon: ListChecks },
    { key: 'OX', label: t('OX 퀴즈'), icon: CircleDot },
    { key: 'BLANK', label: t('빈칸 넣기'), icon: PenLine },
  ];

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <Card className="mx-auto mt-4 max-w-lg overflow-hidden rounded-2xl border border-border sm:mt-8">
        {/* 히어로 영역: 파일명 + 유형 + 문제 수 */}
        <div className="flex flex-col items-center gap-2 px-4 pt-5 sm:px-6 sm:pt-6">
          {problemSetInfo ? (
            <>
              {/* 파일명 — 서버 응답 */}
              <div className="flex w-full max-w-[360px] items-center justify-center gap-2 text-foreground">
                {!isEditingTitle && <FileText className="size-5 shrink-0" />}
                <InlineEdit
                  value={problemSetInfo.title}
                  editing={isEditingTitle}
                  onStartEdit={() => setIsEditingTitle(true)}
                  onCancel={() => setIsEditingTitle(false)}
                  onSubmit={submitTitleEdit}
                  size="md"
                  textClassName="max-w-[260px] truncate text-base font-bold sm:max-w-[360px] sm:text-lg"
                  hideEditButton={!isAuthenticated}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <ListChecks className="size-3.5" />
                  <span className="text-sm font-medium">
                    {quizTypes.find((qt) => qt.key === problemSetInfo.quizType)?.label ||
                      t('객관식')}
                  </span>
                </Badge>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums text-primary sm:text-3xl">
                  {problemSetInfo.totalCount}
                </span>
                <span className="text-sm font-medium text-muted-foreground">{t('문제')}</span>
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-7 w-48 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 pt-2 pb-4 sm:px-6 sm:pt-2 sm:pb-6">
          <button
            className="w-full cursor-pointer rounded-xl border-none bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:shadow-md hover:shadow-primary/30"
            onClick={handleNavigateToQuiz}
          >
            {t('문제 풀기')}
          </button>

          {/* 보조 액션 */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              onClick={() => {
                if (window.confirm(String(t('현재 생성된 퀴즈가 사라집니다. 계속하시겠습니까?')))) {
                  handleReCreate();
                  refreshPdfCopy();
                }
              }}
            >
              {t('다른 문제 생성')}
            </button>
            <button
              className="cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-destructive/70 transition-colors duration-200 hover:bg-muted hover:text-destructive"
              onClick={() => {
                if (window.confirm(String(t('현재 생성된 퀴즈가 사라집니다. 계속하시겠습니까?')))) {
                  handleRemoveFile();
                }
              }}
            >
              {t('다른 파일 넣기')}
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProblemSetResultCard;
