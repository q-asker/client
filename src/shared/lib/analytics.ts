import ReactGA from 'react-ga4';

// Google Analytics 초기화
export const initGA = (measurementId: string): void => {
  if (import.meta.env.DEV) {
    console.group('🚀 Google Analytics 초기화');
    console.groupEnd();
  }

  if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(measurementId, {
      // 개발 환경에서는 디버그 모드 활성화
      debug: import.meta.env.DEV,
    });

    if (import.meta.env.DEV) {
      // GA 초기화 완료
    }
  } else {
    if (import.meta.env.DEV) {
      console.warn(
        '⚠️ Google Analytics 측정 ID가 설정되지 않았습니다. 이벤트는 콘솔에서만 확인됩니다.',
      );
    }
  }
};

// 페이지뷰 추적
export const logPageView = (path: string, title: string): void => {
  // 개발 환경에서는 콘솔에 페이지뷰 로그 출력
  if (import.meta.env.DEV) {
    console.group(`📄 GA PageView: ${title}`);
    console.groupEnd();
  }

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title,
  });
};

// 사용자 정의 이벤트 추적
export const logEvent = (eventName: string, parameters: Record<string, unknown> = {}): void => {
  // 개발 환경에서는 콘솔에 이벤트 로그 출력
  if (import.meta.env.DEV) {
    console.group(`🔥 GA Event: ${eventName}`);
    console.groupEnd();
  }

  ReactGA.event(eventName, parameters);
};

// 퀴즈 관련 이벤트들
export const trackQuizEvents = {
  // 퀴즈 시작
  startQuiz: (problemSetId: string): void => {
    logEvent('quiz_start', {
      problem_set_id: problemSetId,
    });
  },

  // 퀴즈 완료
  completeQuiz: (
    problemSetId: string,
    score: number,
    totalQuestions: number,
    totalTime: number,
  ): void => {
    logEvent('quiz_complete', {
      problem_set_id: problemSetId,
      score: score,
      total_questions: totalQuestions,
      success_rate: Math.round((score / totalQuestions) * 100),
      total_time: totalTime,
    });
  },

  // 해설 페이지 방문
  viewExplanation: (problemSetId: string, questionNumber: number): void => {
    logEvent('view_explanation', {
      problem_set_id: problemSetId,
      question_number: questionNumber,
    });
  },

  // PDF 슬라이드 토글
  togglePdfSlide: (problemSetId: string, isShown: boolean): void => {
    logEvent('toggle_pdf_slide', {
      problem_set_id: problemSetId,
      action: isShown ? 'show' : 'hide',
    });
  },

  // 문제 네비게이션
  navigateQuestion: (problemSetId: string, fromQuestion: number, toQuestion: number): void => {
    logEvent('navigate_question', {
      problem_set_id: problemSetId,
      from_question: fromQuestion,
      to_question: toQuestion,
    });
  },

  // 답안 선택
  selectAnswer: (
    problemSetId: string,
    questionNumber: number,
    optionId: string,
    isCorrect: boolean,
  ): void => {
    logEvent('answer_selected', {
      problem_set_id: problemSetId,
      question_number: questionNumber,
      option_id: optionId,
      is_correct: isCorrect,
    });
  },

  // 검토 체크박스 토글
  toggleReview: (problemSetId: string, questionNumber: number, isChecked: boolean): void => {
    logEvent('toggle_review', {
      problem_set_id: problemSetId,
      question_number: questionNumber,
      action: isChecked ? 'check' : 'uncheck',
    });
  },

  // 문제 확인 버튼 클릭
  confirmAnswer: (problemSetId: string, questionNumber: number): void => {
    logEvent('confirm_answer', {
      problem_set_id: problemSetId,
      question_number: questionNumber,
    });
  },

  // 퀴즈 제출
  submitQuiz: (
    problemSetId: string,
    answeredCount: number,
    totalQuestions: number,
    reviewCount: number,
  ): void => {
    logEvent('submit_quiz', {
      problem_set_id: problemSetId,
      answered_count: answeredCount,
      total_questions: totalQuestions,
      review_count: reviewCount,
      completion_rate: Math.round((answeredCount / totalQuestions) * 100),
    });
  },
};

// MakeQuiz 페이지 이벤트들
export const trackMakeQuizEvents = {
  // 페이지 진입
  viewMakeQuiz: (source: string = 'direct'): void => {
    logEvent('view_make_quiz', {
      source: source, // 'direct', 'header', 'help', 'history' 등
    });
  },

  // 파일 업로드 시작
  startFileUpload: (fileName: string, fileSize: number, fileType: string): void => {
    logEvent('file_upload_start', {
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      upload_method: 'click', // click 또는 drag_drop
    });
  },

  // 파일 드래그앤드롭 업로드
  dragDropFileUpload: (fileName: string, fileSize: number, fileType: string): void => {
    logEvent('file_upload_start', {
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      upload_method: 'drag_drop',
    });
  },

  // 파일 업로드 완료
  completeFileUpload: (fileName: string, uploadTime: number): void => {
    logEvent('file_upload_complete', {
      file_name: fileName,
      upload_time: uploadTime,
    });
  },

  // 파일 삭제
  deleteFile: (fileName: string): void => {
    logEvent('file_delete', {
      file_name: fileName,
    });
  },

  // 퀴즈 옵션 변경
  changeQuizOption: (optionType: string, optionValue: string | number): void => {
    logEvent('quiz_option_change', {
      option_type: optionType, // question_type, question_count, page_mode, quiz_level
      option_value: optionValue,
    });
  },

  // 문제 생성 시작
  startQuizGeneration: (
    questionCount: number,
    questionType: string,
    quizLevel: string,
    pageMode: string,
    startPage?: number | null,
    endPage?: number | null,
  ): void => {
    logEvent('quiz_generation_start', {
      question_count: questionCount,
      question_type: questionType,
      quiz_level: quizLevel,
      page_mode: pageMode,
      start_page: startPage || null,
      end_page: endPage || null,
    });
  },

  // 문제 생성 완료
  completeQuizGeneration: (problemSetId: string, generationTime: number): void => {
    logEvent('quiz_generation_complete', {
      problem_set_id: problemSetId,
      generation_time: generationTime,
    });
  },

  // 문제로 이동
  navigateToQuiz: (problemSetId: string): void => {
    logEvent('navigate_to_quiz', {
      problem_set_id: problemSetId,
    });
  },
};

// QuizResult 페이지 이벤트들
export const trackResultEvents = {
  // 결과 페이지 진입
  viewResult: (
    problemSetId: string,
    score: number,
    totalQuestions: number,
    totalTime: number,
  ): void => {
    logEvent('view_result', {
      problem_set_id: problemSetId,
      score: score,
      total_questions: totalQuestions,
      success_rate: Math.round((score / totalQuestions) * 100),
      total_time: totalTime,
    });
  },

  // 해설 보기 버튼 클릭
  clickExplanation: (problemSetId: string): void => {
    logEvent('click_explanation', {
      problem_set_id: problemSetId,
    });
  },
};

// Help 페이지 이벤트들
export const trackHelpEvents = {
  // 도움말 페이지 진입
  viewHelp: (source: string): void => {
    logEvent('view_help', {
      source: source, // 'header', 'makeQuiz', 'direct' 등
    });
  },

  // 뒤로가기 버튼 클릭
  clickBack: (): void => {
    logEvent('help_back_click');
  },

  // 퀴즈 만들러 가기 버튼 클릭
  clickStartQuiz: (): void => {
    logEvent('help_start_quiz_click');
  },

  // 도움말 섹션 참여도 (스크롤 깊이)
  trackScrollDepth: (percentage: number): void => {
    logEvent('help_scroll_depth', {
      scroll_percentage: percentage,
    });
  },

  // 특정 섹션에 관심 표시 (호버나 클릭)
  interactWithSection: (sectionName: string): void => {
    logEvent('help_section_interact', {
      section_name: sectionName,
    });
  },

  // 도움말 페이지 체류 시간
  trackTimeSpent: (timeSpent: number): void => {
    logEvent('help_time_spent', {
      time_seconds: timeSpent,
    });
  },
};

// QuizHistory 페이지 이벤트들
export const trackQuizHistoryEvents = {
  // 히스토리 페이지 진입
  viewHistory: (totalQuizzes: number, completedQuizzes: number, averageScore: number): void => {
    logEvent('view_quiz_history', {
      total_quizzes: totalQuizzes,
      completed_quizzes: completedQuizzes,
      average_score: averageScore,
      completion_rate: totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0,
    });
  },

  // 해설 보기 버튼 클릭
  clickViewExplanation: (problemSetId: string, quizLevel: string, score: number): void => {
    logEvent('history_view_explanation', {
      problem_set_id: problemSetId,
      quiz_level: quizLevel,
      score: score,
    });
  },

  // 다시풀기 버튼 클릭 (완료된 퀴즈)
  clickRetryQuiz: (problemSetId: string, quizLevel: string, previousScore: number): void => {
    logEvent('history_retry_quiz', {
      problem_set_id: problemSetId,
      quiz_level: quizLevel,
      previous_score: previousScore,
    });
  },

  // 퀴즈 풀기 버튼 클릭 (미완료 퀴즈)
  clickResumeQuiz: (problemSetId: string, quizLevel: string, questionCount: number): void => {
    logEvent('history_resume_quiz', {
      problem_set_id: problemSetId,
      quiz_level: quizLevel,
      question_count: questionCount,
    });
  },

  // 개별 기록 삭제
  deleteQuizRecord: (problemSetId: string, quizStatus: string, quizLevel: string): void => {
    logEvent('history_delete_record', {
      problem_set_id: problemSetId,
      quiz_status: quizStatus, // 'completed' or 'created'
      quiz_level: quizLevel,
    });
  },

  // 전체 기록 삭제
  clearAllHistory: (totalRecords: number, completedRecords: number): void => {
    logEvent('history_clear_all', {
      total_records: totalRecords,
      completed_records: completedRecords,
    });
  },

  // 통계 카드 상호작용
  interactWithStats: (statType: string, statValue: number): void => {
    logEvent('history_stats_interact', {
      stat_type: statType, // 'total', 'completed', 'completion_rate', 'average_score'
      stat_value: statValue,
    });
  },

  // 히스토리 페이지 체류 시간
  trackTimeSpent: (timeSpent: number, totalQuizzes: number): void => {
    logEvent('history_time_spent', {
      time_seconds: timeSpent,
      total_quizzes: totalQuizzes,
    });
  },

  // 빈 히스토리에서 퀴즈 만들기 버튼 클릭
  clickCreateFromEmpty: (): void => {
    logEvent('history_create_from_empty');
  },
};
