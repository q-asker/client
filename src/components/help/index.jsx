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

  const [isExpanded, setIsExpanded] = useState(true);

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
      name: "PDF 또는 PPT 파일로 AI 퀴즈 만드는 방법",
      description:
        "Q-Asker를 사용하여 PDF 또는 PPT 학습 자료로 몇 단계 만에 AI 퀴즈를 생성하는 방법입니다.",
      step: [
        {
          "@type": "HowToStep",
          name: "1단계: 파일 업로드",
          text: '화면에 PDF 또는 PPTX 파일을 드래그하거나 "파일 선택하기" 버튼을 클릭하여 업로드합니다. 텍스트 기반의 선명한 자료일수록 좋습니다.',
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "2단계: 퀴즈 옵션 설정",
          text: "생성할 문제 수량, 페이지 범위, 그리고 Recall(Easy), Skills(Normal), Strategic(Hard) 중 난이도를 선택합니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "3단계: AI 문제 생성",
          text: "설정이 끝나면 AI가 문서를 분석하여 문제를 생성합니다. 문서 길이에 따라 수 초에서 수십 초가 소요됩니다.",
          url: `${canonicalUrl}#how-to-use`,
        },
        {
          "@type": "HowToStep",
          name: "4단계: 퀴즈 풀기 및 결과 확인",
          text: "생성된 퀴즈를 풀고, 채점 후 상세한 해설과 원본 위치를 확인하며 학습합니다.",
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
          name: "Q-Asker는 정말 무료인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, Q-Asker의 핵심 기능인 PDF/PPT 기반 AI 퀴즈 생성은 현재 완전 무료로 제공됩니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "업로드한 제 파일은 안전하게 관리되나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, 보안을 매우 중요하게 생각합니다. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 퀴즈 생성 후 서버에 영구적으로 저장되지 않습니다. 사용자의 퀴즈 기록은 개인의 브라우저에만 저장되어 외부에서 접근할 수 없습니다.",
          },
        },
        {
          "@type": "Question",
          name: "AI가 만든 퀴즈의 정확도는 어느 정도인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Q-Asker의 AI는 높은 정확도로 문서의 핵심 내용을 파악하여 문제를 생성하지만, 100% 완벽하지 않을 수 있습니다. AI가 생성한 모든 문제와 해설은 학습 참고용으로 활용하시고, 중요한 정보는 반드시 원본 문서와 교차 확인하는 것을 권장합니다.",
          },
        },
        {
          "@type": "Question",
          name: "이미지로 된 PDF 파일도 퀴즈로 만들 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "아니요, 현재는 텍스트를 선택하고 복사할 수 있는 '텍스트 기반'의 PDF와 PPTX 파일만 지원합니다. 스캔하거나 사진을 찍어 만든 이미지 형태의 문서는 AI가 내용을 분석하기 어렵습니다.",
          },
        },
      ],
    },
  };

  return (
    <>
      <Helmet>
        <meta
          name="description"
          content="PDF, PPT 파일을 올리면 AI가 3초 만에 퀴즈를 생성해 드립니다. 학생, 교사, 교육 담당자를 위한 가장 빠른 무료 온라인 AI 문제 만들기 솔루션, Q-Asker를 경험해보세요."
        />
        <meta
          name="keywords"
          content="PDF 퀴즈 생성, PPT 퀴즈 생성, AI 퀴즈 만들기, AI 문제 만들기, 온라인 문제 생성기, 시험 자동 출제, Q-Asker, 무료 퀴즈 생성"
        />
        {/* [수정] canonical URL은 검색엔진이 페이지의 대표 주소를 식별하는데 매우 중요하므로, 동적 값 대신 정적 절대 경로를 사용해야 합니다. */}
        <link rel="canonical" href={canonicalUrl} />

        {/* === [개선] Open Graph (Facebook, KakaoTalk) & Twitter Cards === */}
        <meta
          property="og:title"
          content="PDF, PPT 퀴즈 생성 | 무료 AI 문제 만들기 - Q-Asker"
        />
        <meta
          property="og:description"
          content="수업 자료, 강의안, 업무 매뉴얼(PDF/PPT)만 있다면 AI가 똑똑하게 문제를 만들어 드립니다. 지금 바로 Q-Asker의 혁신을 무료로 경험해보세요."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        {/* [수정] OG 이미지는 일부 플랫폼에서 절대 경로를 요구하므로, 전체 URL을 사용하는 것이 안정적입니다. */}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:site_name" content="Q-Asker" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="PDF, PPT 퀴즈 생성 | 무료 AI 문제 만들기 - Q-Asker"
        />
        <meta
          name="twitter:description"
          content="가지고 있는 PDF, PPT 파일로 AI 퀴즈를 만드는 가장 쉬운 방법. 학생, 교사, 기업을 위한 최고의 학습 파트너, Q-Asker."
        />
        <meta name="twitter:image" content={twitterImageUrl} />

        {/* === [수정] 구조화된 데이터(JSON-LD) 스크립트 === */}
        {/* 스크립트가 유효하려면 데이터가 실제로 존재해야 합니다. 컴포넌트 내에서 객체를 직접 정의하여 사용합니다. */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData.howTo)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(structuredData.faq)}
        </script>
      </Helmet>

      <div className="help-container">
        <header className="help-header">
          <h1 className="help-title">Q-Asker: PDF/PPT 파일로 AI 퀴즈 생성</h1>
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
            <h2 id="how-to-use">📝 PDF/PPT로 AI 퀴즈 만들기: 6단계 가이드</h2>
            {/* 각 단계별 내용은 기존과 유사하게 유지 */}
            <article className="step-card">
              <h3>1단계: 파일 업로드</h3>
              <ul>
                <li>
                  📄 <strong>지원 형식:</strong> PDF, PPTX (PowerPoint)
                </li>
                <li>
                  📤 <strong>업로드:</strong> 파일을 드래그하거나 버튼 클릭
                </li>
                <li>
                  💡 <strong>팁:</strong> 텍스트가 선명하고 구조적인 자료가{" "}
                  <strong>AI 퀴즈 생성</strong>에 유리합니다.
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
                  📚 <strong>상세 해설:</strong> 문제별 자세한 설명과 원본 위치
                  제공
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
            <h2 id="usage-tips">💡 AI 퀴즈 활용 200% 올리기</h2>
            <div className="tips-grid">
              <div className="tip-card">
                <h4>👨‍🎓 학생의 복습 노트</h4>
                <p>
                  수업 필기, 전공 서적 PDF로 퀴즈를 만들어 보세요. 핵심 개념을
                  빠르게 암기하고 시험 대비에 효과적입니다.
                </p>
              </div>
              <div className="tip-card">
                <h4>👩‍🏫 교사/강사의 수업 자료</h4>
                <p>
                  매주 사용하는 PPT 강의안으로 형성평가 문제를 손쉽게 만드세요.
                  난이도를 조절하며 학생들의 이해도를 바로 확인할 수 있습니다.
                </p>
              </div>
              <div className="tip-card">
                <h4>👨‍💼 기업 담당자의 역량 평가</h4>
                <p>
                  사내 교육 자료, 업무 매뉴얼 PDF로 신입사원 또는 팀원의 역량
                  평가 퀴즈를 생성하여 교육 효과를 측정할 수 있습니다.
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
            <div className="trust-box">
              <ul>
                <li>
                  <strong>🔒 강력한 개인정보 보호:</strong> 여러분의 파일은 퀴즈
                  생성을 위해서만 사용될 뿐, 서버에 저장되거나 외부에 노출되지
                  않습니다. 안심하고 사용하세요.
                </li>
                <li>
                  <strong>🤖 똑똑하지만 겸손한 AI:</strong> AI는 학습을 돕는
                  훌륭한 조수입니다. 100%의 정답을 보장하기보다, 여러분이 원본을
                  다시 찾아보며 깊이 있게 학습하도록 유도합니다.
                </li>
                <li>
                  <strong>💸 가입 없는 완전 무료:</strong> 저희는 지식 습득의
                  장벽을 낮추고 싶습니다. 핵심 기능은 회원가입 없이 누구나 평생
                  무료로 사용할 수 있도록 제공하는 것이 목표입니다.
                </li>
              </ul>
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
                  네, 핵심 기능인 PDF/PPT 기반 AI 퀴즈 생성은 현재 완전
                  무료입니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수
                  있습니다.
                </p>
              </div>
              <div className="faq-item">
                <h4>Q. 업로드한 제 파일은 안전하게 관리되나요?</h4>
                <p>
                  네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며,
                  이후 서버에 영구 저장되지 않습니다. 퀴즈 기록은 사용자의
                  브라우저에만 저장되어 외부에서 접근이 불가능합니다.
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
                  아니요. 현재는 텍스트 선택이 가능한 '텍스트 기반'의 PDF, PPTX
                  파일만 지원합니다. 스캔 본이나 사진 형태의 문서는 분석이
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
                  <strong>개인정보:</strong> 주민등록번호, 비밀번호 등 민감
                  정보가 포함된 자료는 업로드하지 마세요.
                </li>
                <li>
                  <strong>AI 한계점:</strong> 생성된 문제는 학습 참고용이며,
                  사실관계가 100% 정확하지 않을 수 있습니다. 중요한 정보는
                  반드시 원본과 교차 확인하세요.
                </li>
                <li>
                  <strong>데이터 저장:</strong> 퀴즈 기록은 현재 사용 중인
                  브라우저에만 저장됩니다. 다른 기기나 브라우저와 연동되지
                  않으며, 브라우저 캐시 삭제 시 기록이 사라질 수 있습니다.
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
              연락주세요. 여러분의 목소리가 더 좋은{" "}
              <strong>AI 퀴즈 생성</strong> 서비스를 만듭니다.
            </p>
            <div className="contact-info">
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
