import { useTranslation } from 'i18nexus';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { loadResult, loadEssayGradeResults } from '#features/solve-quiz';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME } from './mockResultData';
import { Button } from '@/shared/ui/components/button';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import type { ScoreBoardProblem } from '@/shared/ui/components/quiz-score-board';
import { Home } from 'lucide-react';
import type { Quiz } from '#features/quiz-generation';
import { RepeatQuizCta } from '#features/quiz-generation';
import { deserializeRealBlankTokens } from '#shared/lib/blank-scoring';
import { gradeRealBlankSet, toTextAnswer } from '#shared/lib/realBlankGrading';
import type { GradeResultItem } from '#shared/lib/realBlankGrading';

/** 부모에서 전달받는 서버 데이터 */
interface ServerData {
  quiz: Quiz[];
  title: string;
  quizType?: string;
}

interface QuizResultDesignKProps {
  serverData: ServerData;
}

const QuizResultDesignK = ({ serverData }: QuizResultDesignKProps) => {
  const { t } = useTranslation('quiz-result');
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const savedResult = useMemo(
    () => (problemSetId ? loadResult(problemSetId) : null),
    [problemSetId],
  );

  const essayGradeResults = useMemo(
    () => (problemSetId ? loadEssayGradeResults(problemSetId) : {}),
    [problemSetId],
  );

  const mergedQuizzes = useMemo(() => {
    if (isMock) return MOCK_RESULT_QUIZZES as Quiz[];
    const serverQuizzes = serverData.quiz;
    if (savedResult) {
      return serverQuizzes.map((q) => ({
        ...q,
        type: (q.type ?? serverData.quizType) as Quiz['type'],
        userAnswer: savedResult.answers[q.number] ?? q.userAnswer,
        inReview: savedResult.inReview?.[q.number] ?? false,
        gradeResult: essayGradeResults[q.number] ?? q.gradeResult ?? null,
      }));
    }
    return serverQuizzes.map((q) => ({
      ...q,
      type: (q.type ?? serverData.quizType) as Quiz['type'],
      gradeResult: essayGradeResults[q.number] ?? q.gradeResult ?? null,
    }));
  }, [isMock, serverData, savedResult, essayGradeResults]);

  const [quizzes] = useState<Quiz[]>(mergedQuizzes);
  const totalTime = isMock ? MOCK_TOTAL_TIME : (savedResult?.totalTime ?? '00:00:00');
  const title = savedResult?.title || serverData.title;

  // REAL_BLANK 세트는 서버 SSOT 채점(POST /grade)으로 판정·정답을 받는다.
  const isRealBlankSet = quizzes.length > 0 && quizzes[0]?.type === 'REAL_BLANK';
  const [realBlankGrades, setRealBlankGrades] = useState<
    Map<number, GradeResultItem> | undefined
  >();

  useEffect(() => {
    if (isMock || !isRealBlankSet || !problemSetId) return;
    const answers = quizzes.map((q) => ({
      number: q.number,
      textAnswer: toTextAnswer(q.userAnswer),
    }));
    gradeRealBlankSet(problemSetId, answers)
      .then(setRealBlankGrades)
      .catch(() => setRealBlankGrades(new Map()));
  }, [isMock, isRealBlankSet, problemSetId, quizzes]);

  const {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  } = useQuizResult({
    navigate,
    problemSetId: problemSetId ?? '',
    quizzes,
    totalTime,
    title,
    realBlankGrades,
  });

  const actionButton = (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
        {t('해설 보기')}
      </Button>
      {problemSetId && <RepeatQuizCta problemSetId={problemSetId} className="w-full text-base" />}
      <button
        type="button"
        className="group mx-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => navigate('/')}
      >
        <Home className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
        {t('홈으로')}
      </button>
    </div>
  );

  const problems: ScoreBoardProblem[] = quizzes.map((q) => {
    // REAL_BLANK: 서버 SSOT 판정(correct)과 대표정답(answer)을 grade 결과에서 읽는다.
    if (q.type === 'REAL_BLANK') {
      const grade = realBlankGrades?.get(q.number);
      const userRaw = toTextAnswer(q.userAnswer);
      // 사용자 답안 표시(단일/다중 모두 U+001F 역직렬화 후 콤마 결합 — 단일은 그대로)
      const userDisplay = userRaw ? deserializeRealBlankTokens(userRaw).join(', ') : '';
      const answerText = grade?.answer ?? '';
      // score-board가 selection으로 답/정답을 표시하므로 가상 selection을 조립한다.
      const virtualSelections = [
        ...(userDisplay !== '' ? [{ id: '__real_blank_user__', content: userDisplay }] : []),
        ...(answerText !== ''
          ? [{ id: '__real_blank_correct__', content: answerText, correct: true }]
          : []),
      ];
      return {
        number: q.number,
        title: q.title,
        correct: grade?.isCorrect ?? false,
        userAnswer: userDisplay !== '' ? '__real_blank_user__' : '',
        inReview: savedResult?.inReview?.[q.number] ?? false,
        selections: virtualSelections,
      };
    }
    const selected = q.selections.find((s) => String(s.id) === String(q.userAnswer));
    return {
      number: q.number,
      title: q.title,
      correct: selected?.correct === true,
      userAnswer: q.userAnswer ?? '',
      inReview: savedResult?.inReview?.[q.number] ?? false,
      selections: q.selections,
    };
  });

  // REAL_BLANK 세트는 서버 채점 결과가 도착해야 점수·판정이 정확하다.
  if (isRealBlankSet && !isMock && !realBlankGrades) return null;

  return (
    <QuizScoreBoard
      scorePercent={scorePercent}
      totalCount={quizzes.length}
      correctCount={correctCount}
      totalTime={totalTime}
      actionButton={actionButton}
      problems={problems}
    />
  );
};

export default QuizResultDesignK;
