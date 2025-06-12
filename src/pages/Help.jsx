import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackHelpEvents } from "../utils/analytics";
import "./Help.css";

const Help = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const MaxMakeQuiz = 25;
  const MinMakeQuiz = 5;
  const MakeQuizStep = 5;
  const MaxTime = 60;
  const MinTime = 30;

  const startTimeRef = useRef(Date.now());
  const scrollTrackingRef = useRef({
    25: false,
    50: false,
    75: false,
    100: false,
  });

  // 도움말 페이지 진입 추적
  useEffect(() => {
    // URL에서 source 파라미터 확인 또는 referrer로 source 결정
    const urlParams = new URLSearchParams(location.search);
    const source =
      urlParams.get("source") ||
      (document.referrer.includes("/") ? "header" : "direct");

    trackHelpEvents.viewHelp(source);
  }, [location]);

  // 스크롤 깊이 추적
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // 25%, 50%, 75%, 100% 지점에서 각각 한 번씩만 추적
      Object.keys(scrollTrackingRef.current).forEach((threshold) => {
        if (
          scrollPercent >= parseInt(threshold) &&
          !scrollTrackingRef.current[threshold]
        ) {
          scrollTrackingRef.current[threshold] = true;
          trackHelpEvents.trackScrollDepth(parseInt(threshold));
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 페이지 떠날 때 체류 시간 추적
  useEffect(() => {
    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 5) {
        // 5초 이상 머문 경우만 추적
        trackHelpEvents.trackTimeSpent(timeSpent);
      }
    };
  }, []);

  // 뒤로가기 핸들러
  const handleBack = () => {
    trackHelpEvents.clickBack();
    navigate("/");
  };

  // 퀴즈 시작 핸들러
  const handleStartQuiz = () => {
    trackHelpEvents.clickStartQuiz();
    navigate("/");
  };

  // 섹션 호버 핸들러
  const handleSectionHover = (sectionName) => {
    trackHelpEvents.interactWithSection(sectionName);
  };

  return (
    <div className="help-container">
      <header className="help-header">
        <button className="back-button" onClick={handleBack}>
          ← 뒤로가기
        </button>
        <h1 className="help-title">❓ Q-Asker 사용 가이드</h1>
      </header>

      <main className="help-content">
        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("introduction")}
        >
          <h2>🚀 Q-Asker란?</h2>
          <p>
            Q-Asker는 PDF나 PowerPoint 자료를 업로드하면 AI가 자동으로 문제를
            생성해주는 스마트한 퀴즈 제작 도구입니다.
          </p>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("usage_guide")}
        >
          <h2>📝 사용 방법</h2>

          <div className="step-card">
            <h3>1단계: 파일 업로드</h3>
            <ul>
              <li>
                📄 <strong>지원 형식:</strong> PDF, PPTX (PowerPoint) 파일
              </li>
              <li>
                📤 <strong>업로드 방법:</strong>
                <ul>
                  <li>파일을 화면에 드래그하여 놓기</li>
                  <li>"파일 선택하기" 버튼 클릭</li>
                </ul>
              </li>
              <li>
                💡 <strong>팁:</strong> 텍스트가 많고 명확한 자료일수록 좋은
                문제가 생성됩니다
              </li>
            </ul>
          </div>

          <div className="step-card">
            <h3>2단계: 퀴즈 옵션 설정</h3>
            <ul>
              <li>
                🔢 <strong>문제 수량:</strong> {MinMakeQuiz}개~{MaxMakeQuiz}개
                중 선택 ({MakeQuizStep}개 단위)
              </li>
              <li>
                📑 <strong>페이지 범위:</strong>
                <ul>
                  <li>"전체" - 문서 전체에서 문제 생성</li>
                  <li>"사용자 지정" - 특정 페이지 범위 지정</li>
                </ul>
              </li>
              <li>
                🎯 <strong>난이도 설정:</strong>
                <ul>
                  <li>
                    <strong>Recall:</strong> 암기나 단순 이해 문제
                  </li>
                  <li>
                    <strong>Skills:</strong> 개념 적용 및 비교·분석 문제
                  </li>
                  <li>
                    <strong>Strategic:</strong> 깊은 추론 및 문제 해결 문제
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="step-card">
            <h3>3단계: 문제 생성</h3>
            <ul>
              <li>
                🤖 <strong>AI 분석:</strong> 업로드된 문서를 AI가 자동 분석
              </li>
              <li>
                ⏱️ <strong>소요 시간:</strong> 보통 {MinTime}초~{MaxTime}초
                (문서 길이에 따라)
              </li>
              <li>
                ✅ <strong>완료:</strong> "문제로 이동하기" 버튼이 나타남
              </li>
            </ul>
          </div>

          <div className="step-card">
            <h3>4단계: 퀴즈 풀기</h3>
            <ul>
              <li>
                🧩 <strong>문제 풀이:</strong> 객관식 문제를 순서대로 풀이
              </li>
              <li>
                ⏰ <strong>시간 측정:</strong> 자동으로 소요 시간 기록
              </li>
              <li>
                🔍 <strong>검토 기능:</strong> 나중에 다시 볼 문제에 체크 표시
              </li>
              <li>
                📊 <strong>네비게이션:</strong> 좌측 번호판으로 문제 간 이동
              </li>
            </ul>
          </div>

          <div className="step-card">
            <h3>5단계: 결과 확인 및 해설</h3>
            <ul>
              <li>
                📈 <strong>성과 확인:</strong> 점수, 소요시간, 정답률 표시
              </li>
              <li>
                📚 <strong>상세 해설:</strong> 각 문제별 자세한 설명 제공
              </li>
              <li>
                📄 <strong>관련 자료:</strong> 원본 PDF 슬라이드와 함께 학습
              </li>
              <li>
                🔄 <strong>반복 학습:</strong> 틀린 문제 중심으로 재학습 가능
              </li>
            </ul>
          </div>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("tips")}
        >
          <h2>💡 활용 팁</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>📖 효과적인 자료 준비</h4>
              <ul>
                <li>텍스트가 명확하고 읽기 쉬운 자료 사용</li>
                <li>핵심 개념이 잘 정리된 강의 자료 활용</li>
                <li>이미지만 있는 슬라이드보다 설명이 포함된 자료 권장</li>
              </ul>
            </div>

            <div className="tip-card">
              <h4>🎯 난이도별 활용법</h4>
              <ul>
                <li>
                  <strong>Easy:</strong> 시험 전 기본 개념 점검
                </li>
                <li>
                  <strong>Medium:</strong> 실습이나 과제 준비
                </li>
                <li>
                  <strong>Hard:</strong> 심화 학습 및 응용 연습
                </li>
              </ul>
            </div>

            <div className="tip-card">
              <h4>📊 효과적인 학습</h4>
              <ul>
                <li>틀린 문제는 해설을 꼼꼼히 읽고 이해</li>
                <li>검토 기능을 활용해 어려운 문제 재도전</li>
                <li>같은 자료로 다른 난이도 문제도 생성해보기</li>
              </ul>
            </div>

            <div className="tip-card">
              <h4>🔧 문제해결</h4>
              <ul>
                <li>파일 업로드가 안 될 때: 파일 형식(PDF, PPTX) 확인</li>
                <li>
                  문제 생성이 오래 걸릴 때: 잠시 기다려주세요 (최대 {MaxTime}초)
                </li>
                <li>문제가 이상할 때: 다른 난이도로 재생성 시도</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("warnings")}
        >
          <h2>🚨 주의사항</h2>
          <div className="warning-box">
            <ul>
              <li>
                📁 <strong>파일 크기:</strong> 너무 큰 파일(50MB 이상)은
                업로드에 시간이 오래 걸릴 수 있습니다
              </li>
              <li>
                🔒 <strong>개인정보:</strong> 민감한 정보가 포함된 자료는
                업로드하지 마세요
              </li>
              <li>
                🤖 <strong>AI 한계:</strong> 생성된 문제는 참고용이며, 100%
                정확하지 않을 수 있습니다
              </li>
              <li>
                📱 <strong>브라우저:</strong> 최신 브라우저 사용을 권장합니다
              </li>
            </ul>
          </div>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("contact")}
        >
          <h2>📞 문의 및 지원</h2>
          <p>
            Q-Asker 사용 중 문제가 발생하거나 개선 사항이 있으시면 언제든지
            연락주세요. 더 나은 서비스를 만들어가겠습니다!
          </p>
          <div className="contact-info">
            <p>
              📧 <strong>이메일:</strong>{" "}
              <a href="mailto:inhapj01@gmail.com">inhapj01@gmail.com</a>
            </p>
          </div>
        </section>
      </main>

      <footer className="help-footer">
        <button className="primary-button large" onClick={handleStartQuiz}>
          🚀 퀴즈 만들러 가기
        </button>
      </footer>
    </div>
  );
};

export default Help;
