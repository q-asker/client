import React, { useEffect, useRef, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
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

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const source =
      urlParams.get("source") ||
      (document.referrer.includes("/") ? "header" : "direct");
    trackHelpEvents.viewHelp(source);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

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

  const siteUrl = "https://www.q-asker.com";
  const pagePath = "";
  const canonicalUrl = siteUrl + pagePath;
  const ogImageUrl = `${siteUrl}/favicon.svg`;
  const twitterImageUrl = `${siteUrl}/favicon.svg`;

  const structuredData = {
    howTo: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "PDF, PPT로 AI 퀴즈 생성하기 (자동 문제 만들기)",
      description:
        "Q-Asker의 AI 퀴즈 생성 기능을 사용하면, 가지고 계신 PDF, PPT 학습 자료로 자동 퀴즈를 만들 수 있습니다. 몇 단계만으로 복잡한 문서가 학습에 최적화된 AI 퀴즈로 완성됩니다.",
      step: [
        {
          "@type": "HowToStep",
          name: "1단계: PDF/PPT 파일 업로드",
          text: "AI 퀴즈 생성을 위해 PDF 또는 PPT 파일을 업로드합니다. 원하는 페이지를 지정하면 AI 퀴즈 생성시 더 좋은 퀴즈를 만들 수 있습니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "2단계: AI 퀴즈 옵션 설정",
          text: "자동으로 생성할 문제 수량, 페이지 범위, 그리고 AI가 만들 퀴즈의 난이도(Easy, Normal, Hard)를 선택하여 맞춤형 AI 퀴즈 생성을 준비합니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "3단계: AI 퀴즈 자동 생성",
          text: "설정이 끝나면 AI가 문서 내용을 분석하여 PDF 퀴즈 또는 PPT 퀴즈를 자동으로 생성합니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "4단계: 생성된 퀴즈 풀기",
          text: "AI가 만든 퀴즈를 풀어보며 학습 내용을 점검합니다. 나중에 다시 볼 문제는 체크 표시를 하여 효율적인 복습이 가능합니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "5단계: 결과 확인 및 해설 학습",
          text: "채점 결과와 함께 모든 문제에 대한 상세한 해설을 제공합니다. 참조한 페이지 미리보기를 통해 PDF/PPT 내용을 다시 확인하며 깊이 있는 학습을 할 수 있습니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "6단계: 퀴즈 히스토리 관리",
          text: "생성했던 모든 AI 퀴즈 기록이 자동으로 저장됩니다. 언제든지 다시 방문하여 복습하거나 이어서 문제를 풀 수 있습니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
      ],
    },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "PDF나 PPT 파일로 AI 퀴즈를 만드는 기능은 무료인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, Q-Asker의 핵심 기능인 PDF/PPT 기반 AI 퀴즈 생성은 현재 완전 무료로 제공됩니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "PDF/PPT 퀴즈 생성을 위해 업로드한 파일은 안전한가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네. PDF 또는 PPT 퀴즈 생성을 위해 업로드된 파일은 오직 퀴즈를 만드는 데만 일시적으로 사용되며 24시간 뒤에 안전하게 삭제됩니다.",
          },
        },
        {
          "@type": "Question",
          name: "AI가 생성한 PDF/PPT 퀴즈의 정확도는 어떤가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AI는 높은 정확도로 PDF/PPT 문서의 핵심 내용을 파악하여 퀴즈를 생성하지만, 100% 완벽하지 않을 수 있습니다. AI가 생성한 모든 문제는 학습 참고용이며, 중요한 정보는 반드시 원본 문서를 통해 교차 확인하시기 바랍니다.",
          },
        },
        {
          "@type": "Question",
          name: "이미지나 스캔한 PDF, PPT로도 AI 퀴즈 생성이 가능한가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "아니요. 현재 Q-Asker의 AI 퀴즈 생성 기능은 텍스트를 선택하고 복사할 수 있는 '텍스트 기반'의 PDF, PPT, PPTX 파일만 지원합니다. 스캔 본이나 이미지 형태의 문서로는 AI가 내용을 분석할 수 없습니다.",
          },
        },
      ],
    },
  };

  return (
    <>
      <Helmet>
        {/* === [SEO 강화] Description 태그: 검색 결과 페이지의 미리보기 텍스트. 클릭을 유도하는 문장으로 구성 === */}
        <meta
          name="description"
          content="PDF, PPT 파일만 업로드하면 AI가 자동으로 퀴즈를 생성해줍니다. 회원가입 없이 무료로 사용하고, 단계별 난이도로 학습 효과를 높여보세요. 시험 대비, 복습에 최적화된 AI 퀴즈 생성 솔루션입니다."
        />
        {/* === [SEO 강화] Keywords 태그: 관련 검색어 확장. (참고: 구글은 keywords 태그의 중요도를 낮게 보지만, 다른 검색 엔진에는 여전히 유효할 수 있음) === */}
        <meta
          name="keywords"
          content="pdf 퀴즈 생성, ppt 퀴즈 생성, ai 퀴즈 생성, ai 문제 만들기, pdf 문제 만들기, ppt 문제 만들기, 시험 문제 자동 생성, 온라인 퀴즈 만들기, 무료 퀴즈 생성기, Q-Asker"
        />
        <link rel="canonical" href={canonicalUrl} />

        {/* === [SEO 강화] Open Graph (소셜 미디어 공유용) === */}
        <meta
          property="og:title"
          content="Q-Asker: PDF/PPT 파일로 무료 AI 퀴즈 생성"
        />
        <meta
          property="og:description"
          content="PDF, PPT 파일만 업로드하면 AI가 자동으로 퀴즈를 생성해줍니다. 회원가입 없이 무료로 사용하고, 단계별 난이도로 학습 효과를 높여보세요. 시험 대비, 복습에 최적화된 AI 퀴즈 생성 솔루션입니다."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:site_name" content="Q-Asker" />

        {/* === [SEO 강화] Twitter Cards (트위터 공유용) === */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Q-Asker: PDF/PPT 파일로 무료 AI 퀴즈 생성"
        />
        <meta
          name="twitter:description"
          content="PDF, PPT 파일만 업로드하면 AI가 자동으로 퀴즈를 생성해줍니다. 회원가입 없이 무료로 사용하고, 단계별 난이도로 학습 효과를 높여보세요. 시험 대비, 복습에 최적화된 AI 퀴즈 생성 솔루션입니다."
        />
        <meta name="twitter:image" content={twitterImageUrl} />

        {/* === 구조화된 데이터(JSON-LD) 스크립트 === */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData.howTo)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(structuredData.faq)}
        </script>
      </Helmet>

      <div className="help-container">
        <header className="help-header">
          <h1 className="help-title">
            Q-Asker: PDF/PPT 파일로 무료 AI 퀴즈 생성
          </h1>
          <p className="help-subtitle">
            가지고 계신 학습 자료(PDF, PPT)로 AI 퀴즈를 만드는 가장 쉬운 방법을
            알려드립니다.
          </p>
          <button
            className="help-toggle-button"
            onClick={handleToggle}
            aria-label={isExpanded ? "도움말 숨기기" : "도움말 보기"}
          >
            {isExpanded ? "📖 도움말 숨기기" : "📚 도움말 보기"}
          </button>
        </header>

        <main
          className={`help-content help-detailed ${
            isExpanded ? "expanded" : "collapsed"
          }`}
        >
          {/* === [개선] 단계별 가이드 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("usage_guide")}
          >
            <h2 id="how-to-use">📝 PDF/PPT로 AI 퀴즈 만들기 6단계 가이드</h2>
            {/* 각 단계별 내용은 기존과 유사하게 유지 */}
            <article className="step-card">
              <h3>1단계: 파일 업로드</h3>
              <ul>
                <li>
                  📄 <strong>지원 형식:</strong> PDF, PPT, PPTX (PowerPoint)
                </li>
                <li>
                  📤 <strong>업로드:</strong> 파일을 드래그하거나 버튼 클릭
                </li>
                <li>
                  💡 <strong>팁:</strong> 원하는 페이지를 지정하면{" "}
                  <strong>AI 퀴즈 생성</strong>시 더 좋은 퀴즈를 만들 수
                  있습니다.
                </li>
              </ul>
            </article>
            <article className="step-card">
              <h3>2단계: 퀴즈 옵션 설정</h3>
              <ul>
                <li>
                  🔢 <strong>문제 수량:</strong> {MinMakeQuiz} ~ {MaxMakeQuiz}개
                  ({MakeQuizStep}개 단위)
                </li>
                <li>
                  📑 <strong>페이지 범위:</strong> 전체 또는 특정 페이지 지정
                </li>
                <li>
                  🎯 <strong>난이도:</strong> Recall(Easy), Skills(Normal),
                  Strategic(Hard) 중 선택
                </li>
              </ul>
            </article>
            <article className="step-card">
              <h3>3단계: AI 문제 생성</h3>
              <ul>
                <li>
                  🤖 <strong>AI 분석:</strong> 업로드된 문서를 AI가 분석하여
                  문제 생성
                </li>
                <li>
                  ⏱️ <strong>소요 시간:</strong> 보통 {MinTime}초 ~ {MaxTime}초
                  (문서 길이에 따라 다름)
                </li>
                <li>
                  ✅ <strong>완료:</strong> "문제로 이동하기" 버튼으로{" "}
                  <strong>AI 퀴즈 생성</strong> 완료!
                </li>
              </ul>
            </article>
            <article className="step-card">
              <h3>4단계: 퀴즈 풀기</h3>
              <ul>
                <li>
                  🧩 <strong>문제 풀이:</strong> 생성된 객관식 문제를 순서대로
                  풀이
                </li>
                <li>
                  🔍 <strong>검토 기능:</strong> 나중에 다시 볼 문제에 체크 표시
                </li>
                <li>
                  📊 <strong>네비게이션:</strong> 좌측 번호판으로 빠른 이동
                </li>
              </ul>
            </article>
            <article className="step-card">
              <h3>5단계: 결과 및 해설 확인</h3>
              <ul>
                <li>
                  📈 <strong>성과 확인:</strong> 점수, 소요시간 등 결과 확인
                </li>
                <li>
                  📚 <strong>상세 해설:</strong> 문제별 자세한 설명과 참조한
                  페이지 미리보기 제공
                </li>
                <li>
                  🔄 <strong>반복 학습:</strong> 틀린 문제 중심 재학습 가능
                </li>
              </ul>
            </article>
            <article className="step-card">
              <h3>6단계: 히스토리 관리</h3>
              <ul>
                <li>
                  📋 <strong>자동 저장:</strong> 만든 퀴즈가 히스토리에 자동
                  저장
                </li>
                <li>
                  📊 <strong>성과 추적:</strong> 총 퀴즈 수, 평균 점수 등 확인
                </li>
                <li>
                  🎯 <strong>재학습:</strong> 언제든 이어서 풀거나 해설 다시
                  보기
                </li>
              </ul>
            </article>
          </section>

          {/* === [개선] 타겟 사용자별 활용 팁 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("tips")}
          >
            <h2 id="usage-tips">💡 AI 퀴즈 활용 200% 팁</h2>
            <div className="tips-grid">
              <div className="tip-card">
                <h4>🔄 복습 퀴즈</h4>
                <p>
                  PDF, PPT 공부 자료로 퀴즈를 만들어 보세요. 핵심 개념을 빠르게
                  암기하고 시험 대비에 효과적입니다.
                </p>
              </div>
              <div className="tip-card">
                <h4>📈 단계별 풀어보기</h4>
                <p>
                  Webb's Dok 이론에 기반한 단계별 풀어보기 기능을 활용해 한
                  단계씩 순서대로 풀어보세요.
                  <br></br>1. Easy 단계를 통해 핵심 개념을 암기하세요.
                  <br></br>2. Normal 단계를 통해 간단한 맥락에 적용하세요.
                  <br></br>3. Hard 단계를 통해 깊은 추론을 요구하는 문제를
                  풀어보세요.
                </p>
              </div>
            </div>
          </section>

          {/* === [신설] 신뢰도(E-E-A-T) 구축을 위한 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("trust")}
          >
            <h2 id="why-trust-us">🌟 Q-Asker를 신뢰할 수 있는 이유</h2>
            <div className="trust-grid">
              <div className="trust-card">
                <h4>⏰ 자료 보호</h4>
                <p>모든 자료는 업로드 이후 24시간 뒤에 삭제됩니다</p>
              </div>
              <div className="trust-card">
                <h4>📋 명확한 문제 생성 기준</h4>
                <p>
                  Webb's dok 이론에 기반한 문제 생성 기준을 통해 문제를
                  생성합니다.
                  <br></br>
                  <li>Easy: 순수 암기나 단순 이해를 묻는 문제</li>
                  <li>
                    Normal: 주어진 개념을 간단한 맥락에 적용하거나 비교·분석하게
                    하는 문제
                  </li>
                  <li>
                    Hard: 한 단계 더 깊은 추론, 문제 해결, 자료 해석, 간단한
                    설계 등을 요구
                  </li>
                </p>
              </div>
              <div className="trust-card">
                <h4>🛡️ 개인정보 보호</h4>
                <p>
                  신뢰할 수있는 구글, 카카오 인증을 통해 별다른 개인정보를
                  서버에 제공하지 않습니다.
                </p>
              </div>
            </div>
          </section>

          {/* === [신설] FAQ 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("faq")}
          >
            <h2 id="faq">🙋‍♀️ 자주 묻는 질문 (FAQ)</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h4>Q. Q-Asker는 정말 무료인가요?</h4>
                <p>
                  네, PDF/PPT 기반 AI 퀴즈 생성은 현재 완전 무료입니다. 별도의
                  회원가입 없이 누구나 자유롭게 이용할 수 있습니다.
                </p>
              </div>
              <div className="faq-item">
                <h4>Q. 업로드한 제 파일은 안전하게 관리되나요?</h4>
                <p>
                  네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며,
                  24시간 뒤에 삭제됩니다.
                </p>
              </div>
              <div className="faq-item">
                <h4>Q. AI가 만든 퀴즈의 정확도는 어느 정도인가요?</h4>
                <p>
                  AI는 높은 정확도로 문서를 분석하지만, 100% 완벽하지 않을 수
                  있습니다. 생성된 문제는 학습 참고용이며, 중요한 정보는 반드시
                  원본과 교차 확인해주세요.
                </p>
              </div>
              <div className="faq-item">
                <h4>Q. 이미지로 된 PDF 파일도 퀴즈로 만들 수 있나요?</h4>
                <p>
                  아니요. 현재는 텍스트 선택이 가능한 '텍스트 기반'의 PDF, PPT,
                  PPTX 파일만 지원합니다. 스캔 본이나 사진 형태의 문서는 분석이
                  어렵습니다.
                </p>
              </div>
            </div>
          </section>

          {/* === [통합 및 개선] 주의사항 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("warnings")}
          >
            <h2 id="precautions">🚨 꼭 읽어주세요: 주의사항</h2>
            <div className="warning-box">
              <ul>
                <li>
                  <strong>AI 한계점:</strong> 생성된 문제는 학습 참고용이며,
                  사실관계가 100% 정확하지 않을 수 있습니다. 중요한 정보는
                  반드시 원본과 교차 확인하세요.
                </li>
                <li>
                  <strong>기록 삭제:</strong> 삭제된 퀴즈 기록은 복구할 수
                  없으니 신중하게 결정해주세요.
                </li>
              </ul>
            </div>
          </section>

          {/* === 기존 문의 및 피드백 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("contact")}
          >
            <h2 id="contact-support">📞 문의 및 피드백</h2>
            <p>
              Q-Asker 사용 중 궁금한 점이나 개선 아이디어가 있으시면 언제든지
              알려주세요! 더 좋은 <strong>AI 퀴즈 생성</strong> 서비스를
              만드는데 큰 도움이 됩니다.
            </p>
            <div className="contact-info">
              <p>
                📞 <strong>구글 폼:</strong>{" "}
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
                  target="_blank"
                >
                  구글 폼 링크
                </a>
              </p>
              <p>
                📧 <strong>이메일:</strong>{" "}
                <a
                  href="mailto:inhapj01@gmail.com"
                  aria-label="Q-Asker 이메일 문의"
                >
                  inhapj01@gmail.com
                </a>
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

const HelpPage = () => (
  <HelmetProvider>
    <Help />
  </HelmetProvider>
);

export default HelpPage;
