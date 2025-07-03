import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { trackHelpEvents } from "../../utils/analytics";
import "./index.css";

const Help = () => {
  const location = useLocation();
  const MaxMakeQuiz = 25;
  const MinMakeQuiz = 5;
  const MakeQuizStep = 5;
  const MaxTime = 30;
  const MinTime = 10;

  const [isExpanded, setIsExpanded] = useState(false);

  const startTimeRef = useRef(Date.now());
  const scrollTrackingRef = useRef({
    25: false,
    50: false,
    75: false,
    100: false,
  });

  // SEO 메타 태그 동적 추가
  useEffect(() => {
    // 기존 메타 태그 제거 및 새로운 메타 태그 추가
    const updateMetaTags = () => {
      // 기존 메타 태그 제거
      const existingMetas = document.querySelectorAll("meta[data-help-seo]");
      existingMetas.forEach((meta) => meta.remove());

      // 새로운 메타 태그 추가
      const metaTags = [
        {
          name: "description",
          content:
            "Q-Asker AI 퀴즈 생성 도구 완전 사용 가이드. PDF, PowerPoint 파일로 자동 문제 생성, 난이도별 퀴즈 제작, 학습 관리 방법을 상세히 안내합니다.",
        },
        {
          name: "keywords",
          content:
            "Q-Asker, AI 퀴즈 생성, PDF 문제 생성, PPT 문제 생성, 자동 문제 생성, 학습 도구, 온라인 퀴즈, 교육 도구",
        },
        { name: "author", content: "Q-Asker" },
        {
          property: "og:title",
          content: "Q-Asker: pdf, pptx 기반 AI 퀴즈 생성",
        },
        {
          property: "og:description",
          content:
            "PDF나 PPT 파일을 업로드하면 AI가 자동으로 문제를 생성해주는 스마트한 퀴즈 제작 도구 Q-Asker의 완전한 사용 가이드입니다.",
        },
        { property: "og:type", content: "website" },
        { property: "og:image", content: "/favicon.svg" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Q-Asker: pdf, pptx 기반 AI 퀴즈 생성",
        },
        {
          name: "twitter:description",
          content:
            "PDF나 PPT 파일로 AI가 자동으로 퀴즈를 생성해주는 Q-Asker 사용법을 알아보세요.",
        },
        { name: "robots", content: "index, follow" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      ];

      metaTags.forEach((tag) => {
        const meta = document.createElement("meta");
        if (tag.name) {
          meta.setAttribute("name", tag.name);
        } else if (tag.property) {
          meta.setAttribute("property", tag.property);
        }
        meta.setAttribute("content", tag.content);
        meta.setAttribute("data-help-seo", "true");
        document.head.appendChild(meta);
      });
    };

    updateMetaTags();

    // 컴포넌트 언마운트 시 메타 태그 정리
    return () => {
      const helpMetas = document.querySelectorAll("meta[data-help-seo]");
      helpMetas.forEach((meta) => meta.remove());
      document.title = "Q-Asker: pdf, pptx 기반 AI 퀴즈 생성";
    };
  }, []);

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

  // 섹션 호버 핸들러
  const handleSectionHover = (sectionName) => {
    trackHelpEvents.interactWithSection(sectionName);
  };

  // 토글 핸들러
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    trackHelpEvents.interactWithSection(
      isExpanded ? "collapse_help" : "expand_help"
    );
  };

  // 구조화된 데이터 (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Q-Asker",
    applicationCategory: "EducationalApplication",
    description:
      "PDF나 PPT 파일을 업로드하면 AI가 자동으로 문제를 생성해주는 스마트한 퀴즈 제작 도구",
    operatingSystem: "Web Browser",
    url: window.location.origin,
    author: {
      "@type": "Organization",
      name: "Q-Asker",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
    featureList: [
      "PDF 파일 자동 퀴즈 생성",
      "PPT 파일 퀴즈 변환",
      "AI 기반 문제 생성",
      "다양한 난이도 설정",
      "퀴즈 히스토리 관리",
      "실시간 학습 진도 추적",
    ],
  };

  return (
    <div
      className="help-container"
      itemScope
      itemType="https://schema.org/HelpPage"
    >
      {/* 구조화된 데이터 삽입 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="help-header">
        <h1 className="help-title" itemProp="name">
          Q-Asker: pdf, pptx 기반 AI 퀴즈 생성
        </h1>
        <button
          className="help-toggle-button"
          onClick={handleToggle}
          aria-label={isExpanded ? "도움말 숨기기" : "도움말 보기"}
        >
          {isExpanded ? "📖 도움말 숨기기" : "📚 도움말 보기"}
        </button>
      </header>

      {/* 모든 내용이 토글 가능 */}
      <main
        className={`help-content help-detailed ${
          isExpanded ? "expanded" : "collapsed"
        }`}
        itemProp="text"
      >
        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("introduction")}
          itemScope
          itemType="https://schema.org/AboutPage"
        >
          <h2 id="what-is-qasker">🚀 Q-Asker란?</h2>
          <p itemProp="description">
            Q-Asker는 PDF나 PPT 자료를 업로드하면 AI가 자동으로 문제를
            생성해주는 스마트한 퀴즈 제작 도구입니다.
          </p>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("usage_guide")}
          itemScope
          itemType="https://schema.org/HowTo"
        >
          <h2 id="how-to-use">📝 사용 방법</h2>

          <article
            className="step-card"
            itemScope
            itemType="https://schema.org/HowToStep"
          >
            <h3 itemProp="name">1단계: 파일 업로드</h3>
            <div itemProp="text">
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
          </article>

          <article
            className="step-card"
            itemScope
            itemType="https://schema.org/HowToStep"
          >
            <h3 itemProp="name">2단계: 퀴즈 옵션 설정</h3>
            <div itemProp="text">
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
                      <strong>Recall (Easy):</strong> 암기나 단순 이해 문제
                    </li>
                    <li>
                      <strong>Skills (Normal):</strong> 개념 적용 및 비교·분석
                      문제
                    </li>
                    <li>
                      <strong>Strategic (Hard):</strong> 깊은 추론 및 문제 해결
                      문제
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </article>

          <article
            className="step-card"
            itemScope
            itemType="https://schema.org/HowToStep"
          >
            <h3 itemProp="name">3단계: 문제 생성</h3>
            <div itemProp="text">
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
          </article>

          <article
            className="step-card"
            itemScope
            itemType="https://schema.org/HowToStep"
          >
            <h3 itemProp="name">4단계: 퀴즈 풀기</h3>
            <div itemProp="text">
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
          </article>

          <article
            className="step-card"
            itemScope
            itemType="https://schema.org/HowToStep"
          >
            <h3 itemProp="name">5단계: 결과 확인 및 해설</h3>
            <div itemProp="text">
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
          </article>

          <article
            className="step-card"
            itemScope
            itemType="https://schema.org/HowToStep"
          >
            <h3 itemProp="name">6단계: 퀴즈 히스토리 관리</h3>
            <div itemProp="text">
              <ul>
                <li>
                  📋 <strong>기록 자동 저장:</strong> 만든 퀴즈가 자동으로
                  히스토리에 저장
                </li>
                <li>
                  📊 <strong>통계 확인:</strong> 총 퀴즈 수, 완료율, 평균 점수
                  한눈에 보기
                </li>
                <li>
                  🔍 <strong>상태별 관리:</strong> 완료/미완료 퀴즈 구분하여
                  표시
                </li>
                <li>
                  🎯 <strong>재시도 가능:</strong> 미완료 퀴즈는 언제든 다시
                  풀이 가능
                </li>
                <li>
                  📚 <strong>해설 재확인:</strong> 완료된 퀴즈의 해설을 언제든
                  다시 볼 수 있음
                </li>
                <li>
                  🗑️ <strong>기록 관리:</strong> 개별 또는 전체 기록 삭제 기능
                </li>
              </ul>
            </div>
          </article>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("quiz_history")}
          itemScope
          itemType="https://schema.org/TechArticle"
        >
          <h2 id="quiz-history-guide">📚 퀴즈 히스토리 활용법</h2>

          <div className="step-card">
            <h3>📋 기록 확인하기</h3>
            <ul>
              <li>
                📊 <strong>통계 대시보드:</strong> 상단에서 전체 퀴즈 현황을
                한눈에 확인
              </li>
              <li>
                📝 <strong>총 퀴즈 수:</strong> 지금까지 만든 퀴즈의 총 개수
              </li>
              <li>
                ✅ <strong>완료한 퀴즈:</strong> 끝까지 풀어본 퀴즈 개수
              </li>
              <li>
                📈 <strong>완료율:</strong> 퀴즈 완주 비율 (%)
              </li>
              <li>
                🏆 <strong>평균 점수:</strong> 완료한 퀴즈들의 평균 점수
              </li>
            </ul>
          </div>

          <div className="step-card">
            <h3>🎯 퀴즈 상태 관리</h3>
            <ul>
              <li>
                🟢 <strong>완료 상태:</strong> 초록색 표시로 완료된 퀴즈 구분
              </li>
              <li>
                🟡 <strong>미완료 상태:</strong> 노란색 표시로 아직 안 푼 퀴즈
                구분
              </li>
              <li>
                📊 <strong>상세 정보:</strong> 문제 수, 난이도, 점수, 소요시간
                표시
              </li>
              <li>
                📅 <strong>날짜 정보:</strong> 퀴즈 생성일과 완료일 확인
              </li>
            </ul>
          </div>

          <div className="step-card">
            <h3>🔄 재학습 기능</h3>
            <ul>
              <li>
                🎮 <strong>퀴즈 다시 풀기:</strong> 미완료 퀴즈를 언제든 이어서
                풀기
              </li>
              <li>
                📚 <strong>해설 다시 보기:</strong> 완료된 퀴즈의 해설을 반복
                학습
              </li>
              <li>
                🔍 <strong>약점 분석:</strong> 틀린 문제들을 다시 확인하여 학습
              </li>
              <li>
                📈 <strong>성과 비교:</strong> 같은 자료로 여러 번 시도하여 실력
                향상 확인
              </li>
            </ul>
          </div>

          <div className="step-card">
            <h3>🗂️ 기록 정리하기</h3>
            <ul>
              <li>
                🗑️ <strong>개별 삭제:</strong> 필요없는 퀴즈 기록을 하나씩 삭제
              </li>
              <li>
                🧹 <strong>전체 삭제:</strong> 모든 기록을 한 번에 정리
              </li>
              <li>
                💾 <strong>자동 저장:</strong> 최대 20개까지 자동으로 관리
              </li>
              <li>
                🔒 <strong>로컬 저장:</strong> 모든 기록은 브라우저에 안전하게
                저장
              </li>
            </ul>
          </div>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("tips")}
          itemScope
          itemType="https://schema.org/TechArticle"
        >
          <h2 id="usage-tips">💡 활용 팁</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>📖 효과적인 자료 준비</h4>
              <ul>
                <li>문서가 텍스트 선택이 가능한 형식이어야합니다</li>
                <li>핵심 개념이 잘 정리된 강의 자료 활용</li>
              </ul>
            </div>

            <div className="tip-card">
              <h4>🎯 난이도별 활용법</h4>
              <ul>
                <li>
                  <strong>Easy:</strong> 시험 전 기본 개념 점검
                </li>
                <li>
                  <strong>Normal:</strong> 실습이나 과제 준비
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

            <div className="tip-card">
              <h4>📚 히스토리 활용</h4>
              <ul>
                <li>
                  <strong>복습 계획:</strong> 완료율이 낮은 퀴즈부터 우선 도전
                </li>
                <li>
                  <strong>성과 추적:</strong> 평균 점수 변화로 학습 진도 확인
                </li>
                <li>
                  <strong>효율적 학습:</strong> 미완료 퀴즈를 모두 완료한 후 새
                  퀴즈 생성
                </li>
              </ul>
            </div>

            <div className="tip-card">
              <h4>🎯 학습 전략</h4>
              <ul>
                <li>
                  <strong>점진적 난이도:</strong> Easy → Normal → Hard 순서로
                  도전
                </li>
                <li>
                  <strong>반복 학습:</strong> 같은 자료로 다른 난이도 퀴즈 생성
                </li>
                <li>
                  <strong>약점 파악:</strong> 히스토리를 통해 자주 틀리는 유형
                  분석
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("warnings")}
        >
          <h2 id="precautions">🚨 주의사항</h2>
          <div className="warning-box">
            <ul>
              <li>
                🔒 <strong>개인정보:</strong> 민감한 정보가 포함된 자료는
                업로드하지 마세요
              </li>
              <li>
                🤖 <strong>AI 한계:</strong> 생성된 문제는 참고용이며, 100%
                정확하지 않을 수 있습니다
              </li>
              <li>
                💾 <strong>기록 저장:</strong> 퀴즈 기록은 브라우저에만
                저장되므로, 브라우저 데이터를 삭제하면 기록이 사라집니다
              </li>
              <li>
                🔄 <strong>기기 변경:</strong> 다른 기기나 브라우저에서는 기존
                기록이 보이지 않습니다
              </li>
              <li>
                🗑️ <strong>기록 삭제:</strong> 삭제된 퀴즈 기록은 복구할 수
                없으니 신중하게 삭제하세요
              </li>
            </ul>
          </div>
        </section>

        <section
          className="help-section"
          onMouseEnter={() => handleSectionHover("contact")}
          itemScope
          itemType="https://schema.org/ContactPage"
        >
          <h2 id="contact-support">📞 문의 및 지원</h2>
          <p>
            Q-Asker 사용 중 문제가 발생하거나 개선 사항이 있으시면 언제든지
            연락주세요. 더 나은 서비스를 만들어가겠습니다!
          </p>
          <div
            className="contact-info"
            itemScope
            itemType="https://schema.org/ContactPoint"
          >
            <p>
              📧 <strong>이메일:</strong>{" "}
              <a
                href="mailto:inhapj01@gmail.com"
                itemProp="email"
                aria-label="Q-Asker 지원팀 이메일 문의"
              >
                inhapj01@gmail.com
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Help;
