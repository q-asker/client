import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'i18nexus';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/shared/ui/lib/utils';
import {
  useEssayGrading,
  saveEssayGradeResult,
  loadEssayGradeResults,
  loadEssayAttempts,
  saveEssayAttempts,
} from '#features/solve-quiz';
import type { GradeResult, Quiz } from '#features/quiz-generation';

const MAX_ESSAY_ATTEMPTS = 4;
const MAX_ESSAY_LENGTH = 1000;

/** level별 색상 매핑 */
const LEVEL_COLOR: Record<string, string> = {
  충족: 'text-green-600 bg-green-500/10',
  '부분 충족': 'text-yellow-600 bg-yellow-500/10',
  미충족: 'text-red-600 bg-red-500/10',
};

/** 총점 비율로 테두리 색상 결정 */
const borderColor = (total: number, max: number) => {
  const r = max > 0 ? total / max : 0;
  if (r >= 0.8) return 'border-green-500/30';
  if (r >= 0.4) return 'border-yellow-500/30';
  return 'border-red-500/30';
};

interface EssayInputProps {
  problemSetId: string;
  currentQuiz: Quiz;
  onAnswerChange: (answer: string) => void;
}

/** ESSAY 문제 입력·채점 컴포넌트 */
const EssayInput: React.FC<EssayInputProps> = ({ problemSetId, currentQuiz, onAnswerChange }) => {
  const { t } = useTranslation('solve-quiz');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { gradeEssayAnswer, isQuestionGrading, getGradeError } = useEssayGrading();

  // 답안 — API의 userAnswer가 숫자 0 등 비문자열일 수 있으므로 항상 String 변환
  const [answer, setAnswer] = useState(() => {
    const ua = currentQuiz.userAnswer;
    return typeof ua === 'string' && ua.trim() ? ua : '';
  });

  // 채점 결과·시도 횟수·편집 모드 (문제별)
  const [gradeResults, setGradeResults] = useState<Record<number, GradeResult>>({});
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [editing, setEditing] = useState<Record<number, boolean>>({});

  // problemSetId 변경 시 state 초기화 + localStorage 복원
  useEffect(() => {
    setGradeResults(loadEssayGradeResults(problemSetId));
    setAttempts(loadEssayAttempts(problemSetId));
    setEditing({});
  }, [problemSetId]);

  // 문제 전환 시 답안 동기화 (render-phase update로 플래싱 방지)
  const [prevQuizNumber, setPrevQuizNumber] = useState(currentQuiz.number);
  if (currentQuiz.number !== prevQuizNumber) {
    setPrevQuizNumber(currentQuiz.number);
    const ua = currentQuiz.userAnswer;
    setAnswer(typeof ua === 'string' && ua.trim() ? ua : '');
  }

  const quizNumber = currentQuiz.number;
  const isGrading = isQuestionGrading(quizNumber);
  const gradeError = getGradeError(quizNumber);
  const grade = gradeResults[quizNumber] ?? currentQuiz.gradeResult ?? null;
  const isEditing = editing[quizNumber] ?? false;
  const isGraded = !!grade && !isEditing;
  const attemptCount = attempts[quizNumber] ?? 0;
  const hasRetry = attemptCount < MAX_ESSAY_ATTEMPTS;

  /** 채점 요청 */
  const handleSubmit = async () => {
    if (!answer.trim() || attemptCount >= MAX_ESSAY_ATTEMPTS) return;
    onAnswerChange(answer);
    const nextAttempt = (attempts[quizNumber] ?? 0) + 1;
    const result = await gradeEssayAnswer(problemSetId, quizNumber, answer, nextAttempt);
    if (result) {
      setGradeResults((prev) => ({ ...prev, [quizNumber]: result }));
      const newAttempts = { ...attempts, [quizNumber]: nextAttempt };
      setAttempts(newAttempts);
      setEditing((prev) => ({ ...prev, [quizNumber]: false }));
      saveEssayGradeResult(problemSetId, quizNumber, result);
      saveEssayAttempts(problemSetId, newAttempts);
    }
  };

  /** 재시도: 결과를 유지하면서 답안 편집 모드로 전환 */
  const handleRetry = () => {
    if (attemptCount >= MAX_ESSAY_ATTEMPTS) return;
    setEditing((prev) => ({ ...prev, [quizNumber]: true }));
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col gap-3 max-md:mt-2">
      {/* textarea 입력 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length > MAX_ESSAY_LENGTH) return;
            setAnswer(value);
            onAnswerChange(value);
          }}
          placeholder={t('답변을 입력하세요')}
          readOnly={isGraded}
          maxLength={MAX_ESSAY_LENGTH}
          rows={6}
          className={cn(
            'w-full resize-y rounded-2xl border border-input bg-card px-4 py-4 text-base leading-relaxed text-foreground shadow-card',
            'placeholder:text-muted-foreground/50',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
            'transition-all duration-200',
            isGraded && 'cursor-default bg-muted/30',
          )}
        />
        {/* 글자수 카운터 */}
        <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
          {answer.length}/{MAX_ESSAY_LENGTH}
        </div>
      </div>

      {/* 채점 버튼 */}
      {!isGraded && (
        <div className="flex items-center gap-3">
          <button
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-none px-6 py-3.5 text-base font-medium transition-all duration-200',
              answer.trim()
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
            onClick={handleSubmit}
            disabled={!answer.trim() || isGrading}
          >
            {isGrading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('채점 중...')}
              </>
            ) : (
              <>
                <Send className="size-4" />
                {t('채점하기')}
              </>
            )}
          </button>
          {attemptCount > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t('시도')} {attemptCount}/{MAX_ESSAY_ATTEMPTS}
            </span>
          )}
        </div>
      )}

      {/* 채점 에러 */}
      {gradeError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {t('채점 실패')}: {gradeError}
        </div>
      )}

      {/* 채점 결과 */}
      {grade && (
        <div
          className={cn(
            'rounded-2xl border bg-card p-5 shadow-card',
            borderColor(grade.totalScore, grade.maxScore),
          )}
        >
          {/* 헤더: 총점 + 시도 횟수 + 재시도 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">
                {grade.totalScore}/{grade.maxScore}
                {t('점')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('시도')} {attemptCount}/{MAX_ESSAY_ATTEMPTS}
              </span>
            </div>
            {hasRetry && (
              <button
                className="cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                onClick={handleRetry}
              >
                {t('다시 작성')}
              </button>
            )}
          </div>

          {/* 요소별 점수 */}
          <div className="mb-4 flex flex-col gap-2">
            {grade.elementScores.map((el, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-background p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{el.element}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-xs font-semibold',
                        LEVEL_COLOR[el.level] ?? 'text-muted-foreground bg-muted',
                      )}
                    >
                      {el.level}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {el.earnedPoints}/{el.maxPoints}
                    </span>
                  </div>
                </div>
                <p className="m-0 text-xs leading-relaxed text-muted-foreground">{el.feedback}</p>
              </div>
            ))}
          </div>

          {/* 종합 피드백 */}
          <p className="m-0 text-sm leading-relaxed text-foreground/80">{grade.overallFeedback}</p>
        </div>
      )}
    </div>
  );
};

export default EssayInput;
