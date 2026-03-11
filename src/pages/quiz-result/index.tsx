import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { cn } from '@/shared/ui/lib/utils';

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
}

const QuizResult = () => {
  const { t } = useTranslation();
  const { state } = useLocation() as { state: QuizResultLocationState | null };
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const { quizzes = [], totalTime = '00:00:00', uploadedUrl } = state || {};
  const {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  } = useQuizResult({
    navigate,
    problemSetId: problemSetId ?? '',
    quizzes,
    totalTime,
    uploadedUrl: uploadedUrl ?? '',
  });

  return (
    <div className="p-8 flex flex-col items-center bg-[#f4f6f8] min-h-screen box-border text-gray-800 max-md:p-4">
      {/* 메타데이터 카드 */}
      <div className="w-full max-w-[700px] flex justify-between gap-4 mb-8 max-md:flex-col max-md:gap-3">
        {[
          { icon: '📋', label: t('문제 수'), value: `${quizzes.length}${t('개')}` },
          { icon: '⏱️', label: t('걸린 시간'), value: totalTime },
          { icon: '🏆', label: t('점수'), value: `${scorePercent}${t('점')}` },
        ].map((meta) => (
          <div
            key={meta.label}
            className="flex-1 flex items-center bg-white px-5 py-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] max-md:justify-start max-md:px-4 max-md:py-3"
          >
            <span className="text-[1.75rem] mr-3 max-md:text-2xl max-md:mr-2">{meta.icon}</span>
            <div className="flex flex-col leading-snug">
              <span className="text-base font-medium text-gray-600 mb-1 max-md:text-[0.95rem]">
                {meta.label}
              </span>
              <span className="text-xl font-bold text-gray-900 max-md:text-lg">{meta.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 문제별 결과 리스트 */}
      <div className="w-full max-w-[700px] flex flex-col gap-6 mb-12 max-md:gap-4">
        {quizzes.map((q) => {
          const userAns = q.userAnswer;
          const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
          const isCorrect = selection.correct === true;
          const correctSelection =
            q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

          return (
            <div
              key={q.number}
              className={cn(
                'bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-8 py-6 transition-[transform,box-shadow] duration-200 border-l-[5px] border-l-transparent hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]',
                'max-md:px-6 max-md:py-4',
                isCorrect ? 'border-l-[#3bbb7b]' : 'border-l-[#e05263]',
              )}
            >
              <div className="text-xl font-semibold mb-3 text-gray-900 whitespace-pre-wrap break-words max-md:text-lg">
                {q.number}. {q.title}
              </div>

              <div className="text-[1.05rem] py-3 relative text-gray-600 mb-2 whitespace-pre-wrap break-words before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:border-t before:border-gray-200 max-md:text-base">
                {t('선택한 답:')}
                {userAns === 0 ? t('입력 X') : selection.content}
              </div>

              {!isCorrect && (
                <div className="text-[1.05rem] my-2 px-3 py-2 bg-[#f0f9f6] rounded-lg text-[#2d6a4f] border border-[#cce6db] whitespace-pre-wrap break-words max-md:text-base">
                  {t('정답 답안:')}
                  {correctSelection.content}
                </div>
              )}

              <div
                className={cn(
                  'inline-block mt-3 px-4 py-2 rounded-lg text-base font-semibold uppercase tracking-tight max-md:text-[0.95rem] max-md:px-3 max-md:py-1.5',
                  isCorrect ? 'bg-[#3bbb7b] text-white' : 'bg-[#e05263] text-white',
                )}
              >
                {isCorrect ? t('정답') : t('오답')}
              </div>
            </div>
          );
        })}
      </div>

      {/* 해설 보기 버튼 */}
      <button
        className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white text-lg font-semibold px-8 py-3.5 border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(102,126,234,0.3)] hover:bg-gradient-to-br hover:from-[#5a67d8] hover:to-[#6b46c1] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(102,126,234,0.4)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(102,126,234,0.3)] max-md:w-full max-md:text-base max-md:py-3 max-md:text-center"
        onClick={getQuizExplanation}
      >
        {t('해설 보기')}
      </button>
    </div>
  );
};

export default QuizResult;
