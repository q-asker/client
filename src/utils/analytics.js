import ReactGA from "react-ga4";

// Google Analytics 초기화
export const initGA = (measurementId) => {
  if (import.meta.env.DEV) {
    console.group("🚀 Google Analytics 초기화");
    console.log("📍 측정 ID:", measurementId || "❌ 설정되지 않음");
    console.log("🛠️ 환경:", import.meta.env.DEV ? "개발" : "프로덕션");
    console.log("🔧 디버그 모드:", import.meta.env.DEV ? "활성화" : "비활성화");
    console.groupEnd();
  }

  if (measurementId && measurementId !== "G-XXXXXXXXXX") {
    ReactGA.initialize(measurementId, {
      // 개발 환경에서는 디버그 모드 활성화
      debug: import.meta.env.DEV,
    });

    if (import.meta.env.DEV) {
      console.log("✅ Google Analytics 초기화 완료");
    }
  } else {
    if (import.meta.env.DEV) {
      console.warn(
        "⚠️ Google Analytics 측정 ID가 설정되지 않았습니다. 이벤트는 콘솔에서만 확인됩니다."
      );
    }
  }
};

// 페이지뷰 추적
export const logPageView = (path, title) => {
  // 개발 환경에서는 콘솔에 페이지뷰 로그 출력
  if (import.meta.env.DEV) {
    console.group(`📄 GA PageView: ${title}`);
    console.log("🔗 Path:", path);
    console.log("📝 Title:", title);
    console.log("⏰ Timestamp:", new Date().toLocaleTimeString());
    console.groupEnd();
  }

  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: title,
  });
};

// 사용자 정의 이벤트 추적
export const logEvent = (eventName, parameters = {}) => {
  // 개발 환경에서는 콘솔에 이벤트 로그 출력
  if (import.meta.env.DEV) {
    console.group(`🔥 GA Event: ${eventName}`);
    console.log("📊 Parameters:", parameters);
    console.log("⏰ Timestamp:", new Date().toLocaleTimeString());
    console.groupEnd();
  }

  ReactGA.event(eventName, parameters);
};

// 퀴즈 관련 이벤트들
export const trackQuizEvents = {
  // 퀴즈 시작
  startQuiz: (problemSetId) => {
    logEvent("quiz_start", {
      problem_set_id: problemSetId,
    });
  },

  // 퀴즈 완료
  completeQuiz: (problemSetId, score, totalQuestions, totalTime) => {
    logEvent("quiz_complete", {
      problem_set_id: problemSetId,
      score: score,
      total_questions: totalQuestions,
      success_rate: Math.round((score / totalQuestions) * 100),
      total_time: totalTime,
    });
  },

  // 해설 페이지 방문
  viewExplanation: (problemSetId, questionNumber) => {
    logEvent("view_explanation", {
      problem_set_id: problemSetId,
      question_number: questionNumber,
    });
  },

  // PDF 슬라이드 토글
  togglePdfSlide: (problemSetId, isShown) => {
    logEvent("toggle_pdf_slide", {
      problem_set_id: problemSetId,
      action: isShown ? "show" : "hide",
    });
  },

  // 문제 네비게이션
  navigateQuestion: (problemSetId, fromQuestion, toQuestion) => {
    logEvent("navigate_question", {
      problem_set_id: problemSetId,
      from_question: fromQuestion,
      to_question: toQuestion,
    });
  },

  // 답안 선택
  selectAnswer: (problemSetId, questionNumber, optionId, isCorrect) => {
    logEvent("answer_selected", {
      problem_set_id: problemSetId,
      question_number: questionNumber,
      option_id: optionId,
      is_correct: isCorrect,
    });
  },

  // 검토 체크박스 토글
  toggleReview: (problemSetId, questionNumber, isChecked) => {
    logEvent("toggle_review", {
      problem_set_id: problemSetId,
      question_number: questionNumber,
      action: isChecked ? "check" : "uncheck",
    });
  },

  // 문제 확인 버튼 클릭
  confirmAnswer: (problemSetId, questionNumber) => {
    logEvent("confirm_answer", {
      problem_set_id: problemSetId,
      question_number: questionNumber,
    });
  },

  // 퀴즈 제출
  submitQuiz: (problemSetId, answeredCount, totalQuestions, reviewCount) => {
    logEvent("submit_quiz", {
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
  // 파일 업로드 시작
  startFileUpload: (fileName, fileSize, fileType) => {
    logEvent("file_upload_start", {
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      upload_method: "click", // click 또는 drag_drop
    });
  },

  // 파일 드래그앤드롭 업로드
  dragDropFileUpload: (fileName, fileSize, fileType) => {
    logEvent("file_upload_start", {
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      upload_method: "drag_drop",
    });
  },

  // 파일 업로드 완료
  completeFileUpload: (fileName, uploadTime) => {
    logEvent("file_upload_complete", {
      file_name: fileName,
      upload_time: uploadTime,
    });
  },

  // 파일 삭제
  deleteFile: (fileName) => {
    logEvent("file_delete", {
      file_name: fileName,
    });
  },

  // 퀴즈 옵션 변경
  changeQuizOption: (optionType, optionValue) => {
    logEvent("quiz_option_change", {
      option_type: optionType, // question_type, question_count, page_mode, quiz_level
      option_value: optionValue,
    });
  },

  // 문제 생성 시작
  startQuizGeneration: (
    questionCount,
    questionType,
    quizLevel,
    pageMode,
    startPage,
    endPage
  ) => {
    logEvent("quiz_generation_start", {
      question_count: questionCount,
      question_type: questionType,
      quiz_level: quizLevel,
      page_mode: pageMode,
      start_page: startPage || null,
      end_page: endPage || null,
    });
  },

  // 문제 생성 완료
  completeQuizGeneration: (problemSetId, generationTime) => {
    logEvent("quiz_generation_complete", {
      problem_set_id: problemSetId,
      generation_time: generationTime,
    });
  },

  // 문제로 이동
  navigateToQuiz: (problemSetId) => {
    logEvent("navigate_to_quiz", {
      problem_set_id: problemSetId,
    });
  },
};

// QuizResult 페이지 이벤트들
export const trackResultEvents = {
  // 결과 페이지 진입
  viewResult: (problemSetId, score, totalQuestions, totalTime) => {
    logEvent("view_result", {
      problem_set_id: problemSetId,
      score: score,
      total_questions: totalQuestions,
      success_rate: Math.round((score / totalQuestions) * 100),
      total_time: totalTime,
    });
  },

  // 해설 보기 버튼 클릭
  clickExplanation: (problemSetId) => {
    logEvent("click_explanation", {
      problem_set_id: problemSetId,
    });
  },
};

// Help 페이지 이벤트들
export const trackHelpEvents = {
  // 도움말 페이지 진입
  viewHelp: (source) => {
    logEvent("view_help", {
      source: source, // 'header', 'makeQuiz', 'direct' 등
    });
  },

  // 뒤로가기 버튼 클릭
  clickBack: () => {
    logEvent("help_back_click");
  },

  // 퀴즈 만들러 가기 버튼 클릭
  clickStartQuiz: () => {
    logEvent("help_start_quiz_click");
  },

  // 도움말 섹션 참여도 (스크롤 깊이)
  trackScrollDepth: (percentage) => {
    logEvent("help_scroll_depth", {
      scroll_percentage: percentage,
    });
  },

  // 특정 섹션에 관심 표시 (호버나 클릭)
  interactWithSection: (sectionName) => {
    logEvent("help_section_interact", {
      section_name: sectionName,
    });
  },

  // 도움말 페이지 체류 시간
  trackTimeSpent: (timeSpent) => {
    logEvent("help_time_spent", {
      time_seconds: timeSpent,
    });
  },
};
