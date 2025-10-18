import { useTranslation } from "i18nexus";
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { trackHelpEvents } from "../../utils/analytics";
import "./index.css";

const Help = () => {
  const { t } = useTranslation();
  const location = useLocation();

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

  return (
    <div className="help-container">
      <article
        className={`help-content help-detailed ${
          isExpanded ? "expanded" : "collapsed"
        }`}
      >
        <header className="help-header">
          <h1 className="help-title">
            {t("Q-Asker: PDF/PPT 파일로 무료 AI 퀴즈 생성")}
          </h1>
          <p className="help-subtitle">
            {t(
              "가지고 계신 학습 자료(PDF, PPT)로 AI 퀴즈를 만드는 가장 쉬운 방법을 알려드립니다."
            )}
          </p>
        </header>

        <main>
          {/* === 단계별 가이드 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("usage_guide")}
            itemscope
            itemtype="https://schema.org/HowTo"
          >
            <h2 id="how-to-use">
              {t("📝 PDF/PPT로 AI 퀴즈 만들기 6단계 가이드")}
            </h2>
            {/* 각 단계별 내용은 기존과 유사하게 유지 */}
            <article
              class="step-card"
              itemprop="step"
              itemscope
              itemtype="https://schema.org/HowToStep"
            >
              <h3 itemprop="name">{t("1단계: 파일 업로드")}</h3>
              <div itemprop="text">
                <ul>
                  <li>
                    📄 <strong>{t("지원 형식: ")}</strong> PDF, PPT, PPTX
                    (PowerPoint)
                  </li>
                  <li>
                    📤 <strong>{t("업로드 ")}</strong>
                    {t("파일을 드래그하거나 버튼 클릭")}
                  </li>
                  <li>
                    💡 <strong>{t("팁: ")}</strong>
                    {t("원하는 페이지를 지정하면")}{" "}
                    <strong>{t("AI 퀴즈 생성")}</strong>
                    {t("시 더 좋은 퀴즈를 만들 수 있습니다.")}
                  </li>
                </ul>
              </div>
            </article>
            <article
              class="step-card"
              itemprop="step"
              itemscope
              itemtype="https://schema.org/HowToStep"
            >
              <h3 itemprop="name">{t("2단계: 퀴즈 옵션 설정")}</h3>
              <div itemprop="text">
                <ul>
                  <li>
                    🔢 <strong>{t("문제 수량: ")}</strong>
                    {t("5 ~ 25개 (5개 단위)")}
                  </li>
                  <li>
                    📑 <strong>{t("페이지 범위: ")}</strong>
                    {t("전체 또는 특정 페이지 지정")}
                  </li>
                  <li>
                    🎯 <strong>{t("난이도: ")}</strong>
                    {t("빈칸 채우기(Easy), OX(Normal), 객관식(Hard) 중 선택")}
                  </li>
                </ul>
              </div>
            </article>
            <article
              class="step-card"
              itemprop="step"
              itemscope
              itemtype="https://schema.org/HowToStep"
            >
              <h3 itemprop="name">{t("3단계: AI 문제 생성")}</h3>
              <div itemprop="text">
                <ul>
                  <li>
                    🤖 <strong>{t("AI 분석: ")}</strong>
                    {t("업로드된 문서를 AI가 분석하여 문제 생성")}
                  </li>
                  <li>
                    ⏱️ <strong>{t("소요 시간: ")}</strong>
                    {t("보통 10초 ~ 30초 (문서 길이에 따라 다름)")}
                  </li>
                  <li>
                    ✅ <strong>{t("완료: ")}</strong>
                    {t('"문제 풀기" 버튼으로')}{" "}
                    <strong>{t("AI 퀴즈 생성")}</strong>
                    {t("완료!")}
                  </li>
                </ul>
              </div>
            </article>
            <article
              class="step-card"
              itemprop="step"
              itemscope
              itemtype="https://schema.org/HowToStep"
            >
              <h3 itemprop="name">{t("4단계: 퀴즈 풀기")}</h3>
              <div itemprop="text">
                <ul>
                  <li>
                    🧩 <strong>{t("문제 풀이: ")}</strong>
                    {t("생성된 객관식 문제를 순서대로 풀이")}
                  </li>
                  <li>
                    🔍 <strong>{t("검토 기능: ")}</strong>
                    {t("나중에 다시 볼 문제에 체크 표시")}
                  </li>
                  <li>
                    📊 <strong>{t("네비게이션: ")}</strong>
                    {t("좌측 번호판으로 빠른 이동")}
                  </li>
                </ul>
              </div>
            </article>
            <article
              class="step-card"
              itemprop="step"
              itemscope
              itemtype="https://schema.org/HowToStep"
            >
              <h3 itemprop="name">{t("5단계: 결과 및 해설 확인")}</h3>
              <div itemprop="text">
                <ul>
                  <li>
                    📈 <strong>{t("성과 확인: ")}</strong>
                    {t("점수, 소요시간 등 결과 확인")}
                  </li>
                  <li>
                    📚 <strong>{t("상세 해설: ")}</strong>
                    {t("문제별 자세한 설명과 참조한 페이지 미리보기 제공")}
                  </li>
                  <li>
                    🔄 <strong>{t("반복 학습: ")}</strong>
                    {t("틀린 문제 중심 재학습 가능")}
                  </li>
                </ul>
              </div>
            </article>
            <article
              class="step-card"
              itemprop="step"
              itemscope
              itemtype="https://schema.org/HowToStep"
            >
              <h3 itemprop="name">{t("6단계: 퀴즈 기록 관리")}</h3>
              <div itemprop="text">
                <ul>
                  <li>
                    📋 <strong>{t("자동 저장: ")}</strong>
                    {t("만든 퀴즈가 퀴즈 기록에 자동 저장")}
                  </li>
                  <li>
                    📊 <strong>{t("결과 확인: ")}</strong>
                    {t("총 퀴즈 수, 평균 점수 등 확인")}
                  </li>
                  <li>
                    🎯 <strong>{t("복습: ")}</strong>
                    {t("언제든 이어서 풀거나 해설 다시 보기")}
                  </li>
                </ul>
              </div>
            </article>
          </section>

          {/* === 타겟 사용자별 활용 팁 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("tips")}
          >
            <h2 id="usage-tips">{t("💡 AI 퀴즈 활용 200% 팁")}</h2>
            <div className="tips-grid">
              <div className="tip-card">
                <h4>{t("🔄 복습 퀴즈")}</h4>
                <p>
                  {t(
                    "PDF, PPT 공부 자료로 퀴즈를 만들어 보세요. 핵심 개념을 빠르게 암기하고 시험 대비에 효과적입니다."
                  )}
                </p>
              </div>
              <div className="tip-card">
                <h4>{t("📈 단계별 풀어보기")}</h4>
                <p>
                  {t(
                    "Webb's Dok 이론에 기반한 단계별 풀어보기 기능을 활용해 한 단계씩 순서대로 풀어보세요."
                  )}

                  <br></br>
                  {t("1. Easy 단계를 통해 핵심 개념을 암기하세요.")}
                  <br></br>
                  {t("2. Normal 단계를 통해 간단한 맥락에 적용하세요.")}
                  <br></br>
                  {t(
                    "3. Hard 단계를 통해 깊은 추론을 요구하는 문제를 풀어보세요."
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* === 신뢰도 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("trust")}
          >
            <h2 id="why-trust-us">{t("🌟 Q-Asker를 신뢰할 수 있는 이유")}</h2>
            <div className="trust-grid">
              <div className="trust-card">
                <h4>{t("⏰ 자료 보호")}</h4>
                <p>{t("모든 자료는 업로드 이후 24시간 뒤에 삭제됩니다")}</p>
              </div>
              <div className="trust-card">
                <h4>{t("📋 명확한 문제 생성 기준")}</h4>
                <p>
                  {t(
                    "Webb's dok 이론에 기반한 문제 생성 기준을 통해 문제를 생성합니다."
                  )}

                  <br></br>
                  <li>{t("Easy: 순수 암기나 단순 이해를 묻는 문제")}</li>
                  <li>
                    {t(
                      "Normal: 주어진 개념을 간단한 맥락에 적용하거나 비교·분석하게 하는 문제"
                    )}
                  </li>
                  <li>
                    {t(
                      "Hard: 한 단계 더 깊은 추론, 문제 해결, 자료 해석 등을 요구"
                    )}
                  </li>
                </p>
              </div>
              {/* <div className="trust-card">
                <h4>{t("🛡️ 개인정보 보호")}</h4>
                <p>
                  {t(
                    "신뢰할 수있는 구글, 카카오 인증을 통해 별다른 개인정보를 서버에 제공하지 않습니다."
                  )}
                </p>
              </div> */}
            </div>
          </section>

          {/* === FAQ 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("faq")}
            itemscope
            itemtype="https://schema.org/FAQPage"
          >
            <h2 id="faq">{t("🙋‍♀️ 자주 묻는 질문 (FAQ)")}</h2>
            <div class="faq-grid">
              <div
                class="faq-item"
                itemprop="mainEntity"
                itemscope
                itemtype="https://schema.org/Question"
              >
                <h4 itemprop="name">{t("Q. Q-Asker는 정말 무료인가요?")}</h4>
                <div
                  itemprop="acceptedAnswer"
                  itemscope
                  itemtype="https://schema.org/Answer"
                >
                  <p itemprop="text">
                    {t(
                      "네, PDF/PPT 기반 AI 퀴즈 생성은 현재 완전 무료입니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다."
                    )}
                  </p>
                </div>
              </div>
              <div
                class="faq-item"
                itemprop="mainEntity"
                itemscope
                itemtype="https://schema.org/Question"
              >
                <h4 itemprop="name">
                  {t("Q. 업로드한 제 파일은 안전하게 관리되나요?")}
                </h4>
                <div
                  itemprop="acceptedAnswer"
                  itemscope
                  itemtype="https://schema.org/Answer"
                >
                  <p itemprop="text">
                    {t(
                      "네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 24시간 뒤에 삭제됩니다."
                    )}
                  </p>
                </div>
              </div>
              <div
                class="faq-item"
                itemprop="mainEntity"
                itemscope
                itemtype="https://schema.org/Question"
              >
                <h4 itemprop="name">
                  {t("Q. AI가 만든 퀴즈의 정확도는 어느 정도인가요?")}
                </h4>
                <div
                  itemprop="acceptedAnswer"
                  itemscope
                  itemtype="https://schema.org/Answer"
                >
                  <p itemprop="text">
                    {t(
                      "AI는 높은 정확도로 문서를 분석하지만, 100% 완벽하지 않을 수 있습니다. 생성된 문제는 학습 참고용이며, 중요한 정보는 반드시 원본과 교차 확인해주세요."
                    )}
                  </p>
                </div>
              </div>
              <div
                class="faq-item"
                itemprop="mainEntity"
                itemscope
                itemtype="https://schema.org/Question"
              >
                <h4 itemprop="name">
                  {t("Q. 이미지로 된 PDF 파일도 퀴즈로 만들 수 있나요?")}
                </h4>
                <div
                  itemprop="acceptedAnswer"
                  itemscope
                  itemtype="https://schema.org/Answer"
                >
                  <p itemprop="text">
                    {t(
                      "아니요. 현재는 텍스트 선택이 가능한 '텍스트 기반'의 PDF, PPT, PPTX 파일만 지원합니다. 스캔 본이나 사진 형태의 문서는 분석이 어렵습니다."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* === 주의사항 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("warnings")}
          >
            <h2 id="precautions">{t("🚨 꼭 읽어주세요: 주의사항")}</h2>
            <div className="warning-box">
              <ul>
                <li>
                  <strong>{t("AI 한계점:")}</strong>
                  {t(
                    "생성된 문제는 학습 참고용이며, 사실관계가 100% 정확하지 않을 수 있습니다. 중요한 정보는 반드시 원본과 교차 확인하세요."
                  )}
                </li>
                <li>
                  <strong>{t("기록 삭제:")}</strong>
                  {t(
                    "삭제된 퀴즈 기록은 복구할 수 없으니 신중하게 결정해주세요."
                  )}
                </li>
              </ul>
            </div>
          </section>

          {/* === 기존 문의 및 피드백 섹션 === */}
          <section
            className="help-section"
            onMouseEnter={() => handleSectionHover("contact")}
          >
            <h2 id="contact-support">{t("📞 문의 및 피드백")}</h2>
            <p>
              {t(
                "Q-Asker 사용 중 궁금한 점이나 개선 아이디어가 있으시면 언제든지 알려주세요! 더 좋은"
              )}

              <strong>{t("AI 퀴즈 생성")}</strong>
              {t("서비스를 만드는데 큰 도움이 됩니다.")}
            </p>
            <div className="contact-info">
              <p>
                📞 <strong>{t("구글 폼:")}</strong>{" "}
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
                  target="_blank"
                >
                  {t("구글 폼 링크")}
                </a>
              </p>
              <p>
                📧 <strong>{t("이메일:")}</strong>{" "}
                <a
                  href="mailto:inhapj01@gmail.com"
                  aria-label={t("Q-Asker 이메일 문의")}
                >
                  inhapj01@gmail.com
                </a>
              </p>
            </div>
          </section>
        </main>
      </article>
    </div>
  );
};

export default Help;
