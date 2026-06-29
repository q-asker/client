import React, { useMemo } from 'react';
import { getLevelDescriptions, levelMapping, type QuestionType } from '#features/prepare-quiz';
import type { PrepareQuizOptionsState, PrepareQuizOptionsActions } from '#features/prepare-quiz';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { cn } from '@/shared/ui/lib/utils';
import { ListChecks, PenLine, CircleDot, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { TextAnimate } from '@/shared/ui/components/text-animate';

interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

interface QuizOptionsPanelProps {
  t: (key: string) => string;
  options: PrepareQuizOptionsState;
  optionActions: PrepareQuizOptionsActions;
}

/** 스텝 1~3: 퀴즈 타입 / 문제 개수 / 언어 선택 카드 묶음 */
const QuizOptionsPanel: React.FC<QuizOptionsPanelProps> = ({ t, options, optionActions }) => {
  const levelDescriptions = useMemo(() => getLevelDescriptions(t), [t]);

  const quizTypes: QuizTypeOption[] = [
    { key: 'ESSAY', label: t('서술형'), icon: FileText },
    { key: 'MULTIPLE', label: t('객관식'), icon: ListChecks },
    { key: 'OX', label: t('OX 퀴즈'), icon: CircleDot },
    { key: 'BLANK', label: t('빈칸 넣기'), icon: PenLine },
  ];

  const currentLevel: { title: string; question: string; options: string[] } | undefined =
    levelDescriptions[levelMapping[options.questionType as QuestionType]];

  return (
    <>
      {/* ─── 스텝 1: 퀴즈 타입 ─── */}
      <Card className="rounded-2xl border border-border">
        <CardHeader>
          <CardTitle>
            <TextAnimate
              animation="slideUp"
              by="word"
              className="text-xl font-semibold tracking-tight md:text-xl"
            >
              {t('퀴즈 타입을 선택하세요')}
            </TextAnimate>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 세그먼트 컨트롤 */}
          <div className="flex overflow-hidden rounded-2xl border border-border">
            {quizTypes.map((type, index) => (
              <button
                key={type.key}
                className={cn(
                  'flex-1 cursor-pointer border-none px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200',
                  index < quizTypes.length - 1 && 'border-r border-border',
                  options.questionType === type.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
                onClick={() => {
                  optionActions.handleQuestionTypeChange(type.key, type.label);
                }}
              >
                <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                  <type.icon className="size-4" strokeWidth={1.8} />
                  <span className="text-xs sm:text-sm">{type.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* BLANK 전용: '선택지 추가' 토글 — ON이면 선택지 표시 */}
          {options.questionType === 'BLANK' && (
            <div className="mt-3 flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-muted px-4 py-3 sm:mt-4 sm:px-5 sm:py-4">
              <button
                type="button"
                role="switch"
                aria-checked={!options.blankHideSelections}
                onClick={() => optionActions.setBlankHideSelections(!options.blankHideSelections)}
                className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border-none bg-transparent px-0 py-1 text-sm font-medium text-foreground"
              >
                <span>{t('선택지 추가')}</span>
                <span
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                    !options.blankHideSelections ? 'bg-primary' : 'bg-muted-foreground/30',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                      !options.blankHideSelections ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
                    )}
                  />
                </span>
              </button>
              {options.blankHideSelections && (
                <p className="text-center text-xs leading-snug text-muted-foreground">
                  {t('표기/띄어쓰기 차이로 정답 인정이 까다로울 수 있습니다.')}
                </p>
              )}
            </div>
          )}

          {/* 난이도 미리보기 카드 */}
          <div className="mt-3 rounded-2xl border border-border bg-muted p-3 sm:mt-4 sm:p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {currentLevel?.title}
            </div>
            <div className="rounded-xl bg-background p-3">
              <MarkdownText className="break-keep text-sm leading-relaxed text-foreground md:break-words">
                {currentLevel?.question ?? ''}
              </MarkdownText>
            </div>
            {/* BLANK + blankHideSelections=ON일 때 선택지 영역을 렌더링하지 않음 */}
            {currentLevel?.options &&
              currentLevel.options.length > 0 &&
              !(options.questionType === 'BLANK' && options.blankHideSelections) && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {currentLevel.options.map((option: string, index: number) => (
                    <div
                      key={`${option}-${index}`}
                      className="flex items-center rounded-xl bg-background px-3 py-2"
                    >
                      <span className="mr-3 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="whitespace-pre-wrap break-keep text-sm leading-relaxed text-foreground md:break-words">
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* ─── 스텝 2: 문제 개수 ─── */}
      <Card className="rounded-2xl border border-border">
        <CardHeader className="py-4">
          <CardTitle>
            <TextAnimate
              animation="slideUp"
              by="word"
              className="text-xl font-semibold tracking-tight md:text-xl"
            >
              {t('문제 개수를 지정하세요')}
            </TextAnimate>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5 pt-0">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted p-4 sm:p-6">
            <div className="text-[2.5rem] font-black leading-none tracking-tight text-primary sm:text-[3rem]">
              {options.questionCount}
            </div>
            <span className="mt-1 text-sm font-medium text-muted-foreground">{t('문제')}</span>
            <div className="mt-4 w-full max-w-md">
              {options.questionType === 'ESSAY' ? (
                <>
                  <input
                    type="range"
                    min="5"
                    max="10"
                    step="5"
                    value={options.questionCount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newCount: number = +e.target.value;
                      optionActions.handleQuestionCountChange(newCount);
                    }}
                    aria-label={t('문제 수')}
                    className="h-1.5 w-full accent-primary md:h-1"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>10</span>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={options.questionCount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newCount: number = +e.target.value;
                      optionActions.handleQuestionCountChange(newCount);
                    }}
                    aria-label={t('문제 수')}
                    className="h-1.5 w-full accent-primary md:h-1"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 스텝 3: 언어 설정 ─── */}
      <Card className="rounded-2xl border border-border">
        <CardHeader>
          <CardTitle>
            <TextAnimate
              animation="slideUp"
              by="word"
              className="text-xl font-semibold tracking-tight md:text-xl"
            >
              {t('생성할 언어를 선택하세요')}
            </TextAnimate>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 세그먼트 컨트롤 */}
          <div className="flex overflow-hidden rounded-2xl border border-border">
            {(['KO', 'EN'] as const).map((lang, index) => (
              <button
                key={lang}
                className={cn(
                  'flex-1 cursor-pointer border-none px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200',
                  index < 1 && 'border-r border-border',
                  options.language === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
                onClick={() => {
                  optionActions.handleLanguageChange(lang);
                }}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span className="text-xs sm:text-sm">
                    {lang === 'KO' ? t('한국어') : t('영어')}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default QuizOptionsPanel;
