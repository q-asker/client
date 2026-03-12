import { useTranslation } from 'i18nexus';
import React from 'react';
import {
  BarChart3,
  CheckCircle,
  CircleHelp,
  ClipboardList,
  FileText,
  Lightbulb,
  Search,
  Target,
  Timer,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useHelp } from './model/useHelp';

const HelpDesignB = () => {
  const { t } = useTranslation();
  const {
    actions: { handleSectionHover },
  } = useHelp();

  return (
    <div id="help-section" className="px-4 pt-[100px] pb-5 md:px-4 md:pt-[50px]">
      <div className="mx-auto max-w-5xl">
        {/* === 헤더 === */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            {t('Q-Asker: PDF, PPT, Word로 무료 AI 퀴즈 생성')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('가지고 계신 학습 자료로 AI 퀴즈를 만드는 가장 쉬운 방법을 알려드립니다.')}
          </p>
        </header>

        <main className="space-y-12">
          {/* === 단계별 가이드 섹션 (3x2 그리드) === */}
          <section
            onMouseEnter={() => handleSectionHover('usage_guide')}
            itemScope
            itemType="https://schema.org/HowTo"
          >
            <h2 id="how-to-use" className="mb-6 text-2xl font-bold text-foreground">
              <FileText className="inline size-5" /> {t('AI 퀴즈 만들기 6단계 가이드')}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* 1단계 */}
              <article
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
                itemProp="step"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('1단계: 파일 업로드')}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground" itemProp="text">
                  <ul className="m-0 list-none space-y-1 pl-0">
                    <li>
                      <FileText className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('지원 형식: ')}</strong>
                      {t('학습 자료 파일')}
                    </li>
                    <li>
                      <Upload className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('업로드 ')}</strong>
                      {t('파일을 드래그하거나 버튼 클릭')}
                    </li>
                    <li>
                      <Lightbulb className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('팁: ')}</strong>
                      {t(
                        '원하는 페이지를 지정하면 AI 퀴즈 생성시 더 좋은 퀴즈를 만들 수 있습니다.',
                      )}
                    </li>
                  </ul>
                </div>
              </article>

              {/* 2단계 */}
              <article
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
                itemProp="step"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('2단계: 퀴즈 옵션 설정')}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground" itemProp="text">
                  <ul className="m-0 list-none space-y-1 pl-0">
                    <li>
                      <FileText className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('문제 수량: ')}</strong>
                      {t('5 ~ 25개 (5개 단위)')}
                    </li>
                    <li>
                      <FileText className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('페이지 범위: ')}</strong>
                      {t('전체 또는 특정 페이지 지정')}
                    </li>
                    <li>
                      <Target className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('문제 유형: ')}</strong>
                      {t('빈칸 채우기, OX, 객관식 중 선택')}
                    </li>
                  </ul>
                </div>
              </article>

              {/* 3단계 */}
              <article
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
                itemProp="step"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('3단계: AI 문제 생성')}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground" itemProp="text">
                  <ul className="m-0 list-none space-y-1 pl-0">
                    <li>
                      <FileText className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('AI 분석: ')}</strong>
                      {t('업로드된 문서를 AI가 분석하여 문제 생성')}
                    </li>
                    <li>
                      <Timer className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('소요 시간: ')}</strong>
                      {t('보통 10초 ~ 30초 (문서 길이에 따라 다름)')}
                    </li>
                    <li>
                      <CheckCircle className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('완료: ')}</strong>
                      {t('"문제 풀기" 버튼으로')}{' '}
                      <strong className="text-foreground">{t('AI 퀴즈 생성')}</strong>
                      {t('완료!')}
                    </li>
                  </ul>
                </div>
              </article>

              {/* 4단계 */}
              <article
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
                itemProp="step"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  4
                </div>
                <h3 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('4단계: 퀴즈 풀기')}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground" itemProp="text">
                  <ul className="m-0 list-none space-y-1 pl-0">
                    <li>
                      <FileText className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('문제 풀이: ')}</strong>
                      {t('생성된 객관식 문제를 순서대로 풀이')}
                    </li>
                    <li>
                      <Search className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('검토 기능: ')}</strong>
                      {t('나중에 다시 볼 문제에 체크 표시')}
                    </li>
                    <li>
                      <BarChart3 className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('네비게이션: ')}</strong>
                      {t('좌측 번호판으로 빠른 이동')}
                    </li>
                  </ul>
                </div>
              </article>

              {/* 5단계 */}
              <article
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
                itemProp="step"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  5
                </div>
                <h3 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('5단계: 결과 및 해설 확인')}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground" itemProp="text">
                  <ul className="m-0 list-none space-y-1 pl-0">
                    <li>
                      <TrendingUp className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('성과 확인: ')}</strong>
                      {t('점수, 소요시간 등 결과 확인')}
                    </li>
                    <li>
                      <FileText className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('반복 학습: ')}</strong>
                      {t('틀린 문제 중심 재학습 가능')}
                    </li>
                  </ul>
                </div>
              </article>

              {/* 6단계 */}
              <article
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
                itemProp="step"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  6
                </div>
                <h3 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('6단계: 퀴즈 기록 관리')}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground" itemProp="text">
                  <ul className="m-0 list-none space-y-1 pl-0">
                    <li>
                      <ClipboardList className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('자동 저장: ')}</strong>
                      {t('만든 퀴즈가 퀴즈 기록에 자동 저장')}
                    </li>
                    <li>
                      <BarChart3 className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('결과 확인: ')}</strong>
                      {t('총 퀴즈 수, 평균 점수 등 확인')}
                    </li>
                    <li>
                      <Target className="inline size-4" />{' '}
                      <strong className="text-foreground">{t('복습: ')}</strong>
                      {t('언제든 이어서 풀거나 해설 다시 보기')}
                    </li>
                  </ul>
                </div>
              </article>
            </div>
          </section>

          {/* === 타겟 사용자별 활용 팁 섹션 (필/태그 스타일) === */}
          <section onMouseEnter={() => handleSectionHover('tips')}>
            <h2 id="usage-tips" className="mb-6 text-2xl font-bold text-foreground">
              <Lightbulb className="inline size-5" /> {t('AI 퀴즈 활용 200% 팁')}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible">
              <div className="min-w-[280px] flex-shrink-0 rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 md:min-w-0">
                <h4 className="mb-2 text-base font-semibold text-foreground">{t('복습 퀴즈')}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(
                    'PDF, PPT, Word 공부 자료로 퀴즈를 만들어 보세요. 핵심 개념을 빠르게 암기하고 시험 대비에 효과적입니다.',
                  )}
                </p>
              </div>
              <div className="min-w-[280px] flex-shrink-0 rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 md:min-w-0">
                <h4 className="mb-2 text-base font-semibold text-foreground">
                  <TrendingUp className="inline size-4" /> {t('유형별 풀어보기')}
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(
                    '빈칸, OX, 객관식 유형을 번갈아 풀어보며 개념 이해와 기억을 균형 있게 강화하세요.',
                  )}
                  <br />
                  {t('1. 빈칸 채우기로 핵심 개념을 정리하세요.')}
                  <br />
                  {t('2. OX로 빠르게 개념을 점검하세요.')}
                  <br />
                  {t('3. 객관식으로 개념을 응용해 보세요.')}
                </p>
              </div>
            </div>
          </section>

          {/* === 신뢰도 섹션 (아이콘 중심 레이아웃) === */}
          <section onMouseEnter={() => handleSectionHover('trust')}>
            <h2 id="why-trust-us" className="mb-6 text-2xl font-bold text-foreground">
              {t('Q-Asker를 신뢰할 수 있는 이유')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 text-center transition hover:border-primary/50">
                <div className="mb-3 flex justify-center">
                  <Timer className="size-10 text-muted-foreground" />
                </div>
                <h4 className="mb-2 text-base font-semibold text-foreground">{t('자료 보호')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('모든 자료는 업로드 이후 24시간 뒤에 삭제됩니다')}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center transition hover:border-primary/50">
                <div className="mb-3 flex justify-center">
                  <ClipboardList className="size-10 text-muted-foreground" />
                </div>
                <h4 className="mb-2 text-base font-semibold text-foreground">
                  {t('명확한 문제 생성 기준')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('문제 유형별 기준에 맞춰 퀴즈를 생성합니다.')}
                </p>
                <ul className="mt-2 list-none space-y-1 pl-0 text-sm text-muted-foreground">
                  <li>{t('빈칸: 핵심 개념을 정확히 기억하는지 확인')}</li>
                  <li>{t('OX: 핵심 개념의 옳고 그름을 빠르게 점검하는 문제')}</li>
                  <li>{t('객관식: 개념을 비교·분석하고 적용하는 문제')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* === FAQ 섹션 (교차 배경 행) === */}
          <section
            onMouseEnter={() => handleSectionHover('faq')}
            itemScope
            itemType="https://schema.org/FAQPage"
          >
            <h2 id="faq" className="mb-6 text-2xl font-bold text-foreground">
              <CircleHelp className="inline size-5" /> {t('자주 묻는 질문 (FAQ)')}
            </h2>
            <div className="overflow-hidden rounded-xl border border-border">
              <div
                className="bg-muted/30 px-6 py-4"
                itemProp="mainEntity"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('Q. Q-Asker는 정말 무료인가요?')}
                </h4>
                <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                  <p className="mt-1 text-sm text-muted-foreground" itemProp="text">
                    {t(
                      '네, PDF, PPT, Word 기반 AI 퀴즈 생성은 현재 완전 무료입니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.',
                    )}
                  </p>
                </div>
              </div>
              <div
                className="bg-transparent px-6 py-4"
                itemProp="mainEntity"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('Q. 업로드한 제 파일은 안전하게 관리되나요?')}
                </h4>
                <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                  <p className="mt-1 text-sm text-muted-foreground" itemProp="text">
                    {t(
                      '네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 24시간 뒤에 삭제됩니다.',
                    )}
                  </p>
                </div>
              </div>
              <div
                className="bg-muted/30 px-6 py-4"
                itemProp="mainEntity"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('Q. AI가 만든 퀴즈의 정확도는 어느 정도인가요?')}
                </h4>
                <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                  <p className="mt-1 text-sm text-muted-foreground" itemProp="text">
                    {t(
                      'AI는 높은 정확도로 문서를 분석하지만, 100% 완벽하지 않을 수 있습니다. 생성된 문제는 학습 참고용이며, 중요한 정보는 반드시 원본과 교차 확인해주세요.',
                    )}
                  </p>
                </div>
              </div>
              <div
                className="bg-transparent px-6 py-4"
                itemProp="mainEntity"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 className="text-base font-semibold text-foreground" itemProp="name">
                  {t('Q. 이미지로 된 파일도 퀴즈로 만들 수 있나요?')}
                </h4>
                <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                  <p className="mt-1 text-sm text-muted-foreground" itemProp="text">
                    {t('네. OCR을 지원하여 스캔 본이나 사진 형태의 문서도 분석할 수 있습니다.')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* === 주의사항 섹션 === */}
          <section onMouseEnter={() => handleSectionHover('warnings')}>
            <h2 id="precautions" className="mb-6 text-2xl font-bold text-foreground">
              {t('꼭 읽어주세요: 주의사항')}
            </h2>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <ul className="m-0 list-disc space-y-2 pl-5">
                <li className="text-sm leading-relaxed text-foreground">
                  <strong>{t('AI 한계점:')}</strong>{' '}
                  {t(
                    '생성된 문제는 학습 참고용이며, 사실관계가 100% 정확하지 않을 수 있습니다. 중요한 정보는 반드시 원본과 교차 확인하세요.',
                  )}
                </li>
                <li className="text-sm leading-relaxed text-foreground">
                  <strong>{t('기록 삭제:')}</strong>{' '}
                  {t('삭제된 퀴즈 기록은 복구할 수 없으니 신중하게 결정해주세요.')}
                </li>
              </ul>
            </div>
          </section>

          {/* === 문의 및 피드백 섹션 (필 스타일 링크) === */}
          <section onMouseEnter={() => handleSectionHover('contact')}>
            <h2 id="contact-support" className="mb-6 text-2xl font-bold text-foreground">
              {t('문의 및 피드백')}
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {t(
                'Q-Asker 사용 중 궁금한 점이나 개선 아이디어가 있으시면 언제든지 알려주세요! 더 좋은',
              )}
              <strong className="text-foreground">{t('AI 퀴즈 생성')}</strong>
              {t('서비스를 만드는데 큰 도움이 됩니다.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
              >
                <strong>{t('구글 폼:')}</strong> {t('구글 폼 링크')}
              </a>
              <a
                href="mailto:inhapj01@gmail.com"
                aria-label={t('Q-Asker 이메일 문의')}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
              >
                <strong>{t('이메일:')}</strong> inhapj01@gmail.com
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HelpDesignB;
