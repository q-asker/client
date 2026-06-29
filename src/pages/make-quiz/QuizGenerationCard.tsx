import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { TextAnimate } from '@/shared/ui/components/text-animate';

/** 최근 작성 프롬프트 localStorage 키 (최신 1개만 유지) */
const RECENT_PROMPT_KEY = 'recentMakeQuizPrompt';

interface QuizGenerationCardProps {
  t: (key: string) => string;
  isWaitingForFirstQuiz: boolean;
  generationElapsedTime: number;
  showWaitMessage: boolean;
  uploadedUrl: string | null;
  selectedPagesLength: number;
  numPages: number | null;
  generateQuestions: (customInstruction?: string) => void;
}

/** 스텝 4: AI 커스텀 지시사항 입력 + 생성 버튼 + 로딩 스피너 */
const QuizGenerationCard: React.FC<QuizGenerationCardProps> = ({
  t,
  isWaitingForFirstQuiz,
  generationElapsedTime,
  showWaitMessage,
  uploadedUrl,
  selectedPagesLength,
  numPages,
  generateQuestions,
}) => {
  // AI 커스텀 지시사항
  const [customInstruction, setCustomInstruction] = useState('');

  // 최근 작성 프롬프트 (localStorage에서 최신 1개만 유지)
  const [recentPrompt, setRecentPrompt] = useState<string>(() => {
    try {
      return localStorage.getItem(RECENT_PROMPT_KEY) ?? '';
    } catch {
      return '';
    }
  });

  const handleGenerateQuestionsClick = () => {
    const trimmed = customInstruction.trim();
    if (trimmed) {
      try {
        localStorage.setItem(RECENT_PROMPT_KEY, customInstruction);
        setRecentPrompt(customInstruction);
      } catch {
        // localStorage 에러 무시
      }
    }
    generateQuestions(customInstruction);
  };

  const handleLoadRecentPrompt = () => {
    setCustomInstruction(recentPrompt.slice(0, 500));
  };

  return (
    <Card className="rounded-2xl border border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>
            <p className="mb-0.5 text-sm font-normal text-muted-foreground">
              {t('AI에게 원하는 지시사항을 작성하고')}
            </p>
            <TextAnimate
              animation="slideUp"
              by="word"
              className="text-xl font-semibold tracking-tight md:text-xl"
            >
              {t('문제를 생성하세요')}
            </TextAnimate>
          </CardTitle>
          {!isWaitingForFirstQuiz && recentPrompt && recentPrompt !== customInstruction && (
            <button
              type="button"
              onClick={handleLoadRecentPrompt}
              className="shrink-0 cursor-pointer rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t('최근 작성 프롬프트 불러오기')}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isWaitingForFirstQuiz ? (
            /* 생성 중: 버튼이 위로 올라가며 스피너로 전환 */
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border border-border bg-muted p-4 text-center sm:min-h-[100px] sm:p-6"
            >
              <div className="mb-4 size-12 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
              <p className="m-0 text-sm md:text-sm">
                {t('문제 생성 중...')}
                {Math.floor(generationElapsedTime / 1000)}
                {t('초')}
                <br />
                <span className="mt-1.5 inline-block text-xs text-muted-foreground/60">
                  {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
                  <br />
                  {t('AI는 실수를 할 수 있습니다. 학습 보조 도구로 활용해 주세요.')}
                </span>
              </p>
              {showWaitMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="pt-2.5 text-sm text-muted-foreground"
                >
                  {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                </motion.p>
              )}
            </motion.div>
          ) : (
            /* 대기: 커스텀 지시사항 입력 + 버튼 */
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
            >
              <textarea
                value={customInstruction}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCustomInstruction(e.target.value.slice(0, 500))
                }
                placeholder={t(
                  'AI에게 원하는 지시사항을 입력하세요. (선택 사항) \n 예) ~스타일로 만들어줘 \n 예) ~유형으로 만들어줘',
                )}
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-2xl border border-border bg-muted px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {customInstruction.length} / 500
              </p>

              {/* 생성 버튼 */}
              <div className="mt-4 flex flex-col items-center gap-3 sm:mt-6">
                <button
                  className="w-full cursor-pointer rounded-2xl border-none bg-primary py-4 text-base font-bold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:py-5 sm:text-lg"
                  onClick={handleGenerateQuestionsClick}
                  disabled={!uploadedUrl || isWaitingForFirstQuiz || !selectedPagesLength}
                >
                  {t('문제 생성하기')}
                </button>
                {!selectedPagesLength && numPages === null && (
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default QuizGenerationCard;
