import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { Button } from '@/shared/ui/components/button';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import type { ScoreBoardProblem } from '@/shared/ui/components/quiz-score-board';
import { Home } from 'lucide-react';

/** 선택지 타입 */
interface QuizSelection {
  id: string;
  content: string;
  correct?: boolean;
}

/** 퀴즈 문항 타입 */
interface QuizItem {
  number: number;
  title: string;
  selections: QuizSelection[];
  userAnswer: string | number;
}

/** location.state 타입 */
interface QuizResultLocationState {
  quizzes?: QuizItem[];
  totalTime?: string;
  uploadedUrl?: string;
  title?: string;
}

const QuizResultDesignK = () => {
  const { t } = useTranslation();
  const { state } = useLocation() as { state: QuizResultLocationState | null };
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const {
    quizzes = [],
    totalTime = '00:00:00',
    uploadedUrl,
    title = '',
  } = isMock
    ? { quizzes: MOCK_RESULT_QUIZZES, totalTime: MOCK_TOTAL_TIME, uploadedUrl: MOCK_UPLOADED_URL }
    : state || {};
  const {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  } = useQuizResult({
    navigate,
    problemSetId: problemSetId ?? '',
    quizzes,
    totalTime,
    uploadedUrl: uploadedUrl ?? '',
    title,
  });

  // 공통 컴포넌트용 데이터 변환
  const problems: ScoreBoardProblem[] = quizzes.map((q) => {
    const selected = q.selections.find((s) => s.id === q.userAnswer);
    return {
      number: q.number,
      title: q.title,
      correct: selected?.correct === true,
      userAnswer: q.userAnswer,
      selections: q.selections,
    };
  });

  return (
    <QuizScoreBoard
      scorePercent={scorePercent}
      totalCount={quizzes.length}
      correctCount={correctCount}
      totalTime={totalTime}
      actionButton={
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
            {t('해설 보기')}
          </Button>
          <button
            type="button"
            className="group mx-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => navigate('/')}
          >
            <Home className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
            {t('홈으로')}
          </button>
        </div>
      }
      problems={problems}
    />
  );
};

export default QuizResultDesignK;
