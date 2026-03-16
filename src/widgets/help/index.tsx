import React, { Suspense } from 'react';
import { useTranslation } from 'i18nexus';
import { useSearchParams } from 'react-router-dom';
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
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { useHelp } from './model/useHelp';

const STAGGER_DELAY = 0.15;

/** 타임라인 스텝 데이터 */
interface TimelineStep {
  number: number;
  titleKey: string;
  items: { icon: React.ComponentType<{ className?: string }>; labelKey: string; textKey: string }[];
  /** 추가 강조 텍스트 (3단계 완료 항목처럼 bold가 중간에 들어가는 경우) */
  extraBold?: { beforeKey: string; boldKey: string; afterKey: string };
}

const Help = () => {
  const { t } = useTranslation();
  const {
    actions: { handleSectionHover },
  } = useHelp();

  const steps: TimelineStep[] = [
    {
      number: 1,
      titleKey: '1단계: 파일 업로드',
      items: [
        { icon: FileText, labelKey: '지원 형식: ', textKey: '학습 자료 파일' },
        { icon: Upload, labelKey: '업로드 ', textKey: '파일을 드래그하거나 버튼 클릭' },
        {
          icon: Lightbulb,
          labelKey: '팁: ',
          textKey: '원하는 페이지를 지정하면 AI 퀴즈 생성시 더 좋은 퀴즈를 만들 수 있습니다.',
        },
      ],
    },
    {
      number: 2,
      titleKey: '2단계: 퀴즈 옵션 설정',
      items: [
        { icon: FileText, labelKey: '문제 수량: ', textKey: '5 ~ 25개 (5개 단위)' },
        { icon: FileText, labelKey: '페이지 범위: ', textKey: '전체 또는 특정 페이지 지정' },
        { icon: Target, labelKey: '문제 유형: ', textKey: '빈칸 채우기, OX, 객관식 중 선택' },
      ],
    },
    {
      number: 3,
      titleKey: '3단계: AI 문제 생성',
      items: [
        {
          icon: FileText,
          labelKey: 'AI 분석: ',
          textKey: '업로드된 문서를 AI가 분석하여 문제 생성',
        },
        {
          icon: Timer,
          labelKey: '소요 시간: ',
          textKey: '보통 10초 ~ 30초 (문서 길이에 따라 다름)',
        },
      ],
      extraBold: {
        beforeKey: '"문제 풀기" 버튼으로',
        boldKey: 'AI 퀴즈 생성',
        afterKey: '완료!',
      },
    },
    {
      number: 4,
      titleKey: '4단계: 퀴즈 풀기',
      items: [
        { icon: FileText, labelKey: '문제 풀이: ', textKey: '생성된 객관식 문제를 순서대로 풀이' },
        { icon: Search, labelKey: '검토 기능: ', textKey: '나중에 다시 볼 문제에 체크 표시' },
        { icon: BarChart3, labelKey: '네비게이션: ', textKey: '좌측 번호판으로 빠른 이동' },
      ],
    },
    {
      number: 5,
      titleKey: '5단계: 결과 및 해설 확인',
      items: [
        { icon: TrendingUp, labelKey: '성과 확인: ', textKey: '점수, 소요시간 등 결과 확인' },
        { icon: FileText, labelKey: '반복 학습: ', textKey: '틀린 문제 중심 재학습 가능' },
      ],
    },
    {
      number: 6,
      titleKey: '6단계: 퀴즈 기록 관리',
      items: [
        {
          icon: ClipboardList,
          labelKey: '자동 저장: ',
          textKey: '만든 퀴즈가 퀴즈 기록에 자동 저장',
        },
        { icon: BarChart3, labelKey: '결과 확인: ', textKey: '총 퀴즈 수, 평균 점수 등 확인' },
        { icon: Target, labelKey: '복습: ', textKey: '언제든 이어서 풀거나 해설 다시 보기' },
      ],
    },
  ];

  return (
    <div id="help-section" className="px-4 pt-[100px] pb-5 md:px-4 md:pt-[50px]">
      <div className="mx-auto max-w-3xl">
        {/* === 헤더 === */}
        <header className="mb-12 text-center">
          <BlurFade delay={0} inView>
            <h1 className="mb-4 text-[2.5rem] font-bold text-foreground md:text-[1.8rem]">
              {t('Q-Asker: PDF, PPT, Word로 무료 AI 퀴즈 생성')}
            </h1>
          </BlurFade>
          <BlurFade delay={0.1} inView>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t('가지고 계신 학습 자료로 AI 퀴즈를 만드는 가장 쉬운 방법을 알려드립니다.')}
            </p>
          </BlurFade>
        </header>

        <main>
          {/* === 단계별 가이드 섹션 (타임라인 레이아웃) === */}
          <section
            className="mb-12"
            onMouseEnter={() => handleSectionHover('usage_guide')}
            itemScope
            itemType="https://schema.org/HowTo"
          >
            <h2
              id="how-to-use"
              className="mb-8 text-[1.8rem] font-bold text-foreground md:text-2xl"
            >
              <FileText className="inline size-5" />{' '}
              <TextAnimate animation="fadeIn" by="word" as="span">
                {t('AI 퀴즈 만들기 6단계 가이드')}
              </TextAnimate>
            </h2>

            {/* 타임라인 컨테이너 */}
            <div className="relative ml-6 border-l-2 border-border pl-8 md:ml-4 md:pl-6">
              {steps.map((step, index) => (
                <BlurFade
                  key={step.number}
                  delay={index * STAGGER_DELAY}
                  inView
                  className="relative mb-10 last:mb-0"
                >
                  <article itemProp="step" itemScope itemType="https://schema.org/HowToStep">
                    {/* 번호 원 */}
                    <div className="absolute -left-[calc(2rem+13px)] flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground md:-left-[calc(1.5rem+13px)]">
                      {step.number}
                    </div>

                    {/* 카드 */}
                    <div className="rounded-lg border border-border bg-muted p-6 transition-colors duration-200 hover:border-primary md:p-5">
                      <h3 itemProp="name" className="mb-3 text-xl font-semibold text-primary">
                        {t(step.titleKey)}
                      </h3>
                      <div itemProp="text">
                        <ul className="m-0 list-none pl-0">
                          {step.items.map((item, i) => (
                            <li
                              key={i}
                              className="mb-2 text-base leading-relaxed text-muted-foreground"
                            >
                              <item.icon className="inline size-4" />{' '}
                              <strong className="font-semibold text-foreground">
                                {t(item.labelKey)}
                              </strong>
                              {t(item.textKey)}
                            </li>
                          ))}
                          {step.extraBold && (
                            <li className="mb-2 text-base leading-relaxed text-muted-foreground">
                              <CheckCircle className="inline size-4" />{' '}
                              <strong className="font-semibold text-foreground">
                                {t('완료: ')}
                              </strong>
                              {t(step.extraBold.beforeKey)}{' '}
                              <strong className="font-semibold text-foreground">
                                {t(step.extraBold.boldKey)}
                              </strong>
                              {t(step.extraBold.afterKey)}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </article>
                </BlurFade>
              ))}
            </div>
          </section>

          {/* === 타겟 사용자별 활용 팁 섹션 (단일 컬럼 스택) === */}
          <section className="mb-12" onMouseEnter={() => handleSectionHover('tips')}>
            <h2
              id="usage-tips"
              className="mb-6 text-[1.8rem] font-bold text-foreground md:text-2xl"
            >
              <Lightbulb className="inline size-5" />{' '}
              <TextAnimate animation="fadeIn" by="word" as="span">
                {t('AI 퀴즈 활용 200% 팁')}
              </TextAnimate>
            </h2>

            <div className="space-y-4">
              <BlurFade delay={0} inView>
                <div className="rounded-lg border border-border bg-muted p-6 transition-colors duration-200 hover:border-primary md:p-5">
                  <h4 className="mb-3 text-xl font-semibold text-foreground">{t('복습 퀴즈')}</h4>
                  <p className="leading-relaxed text-muted-foreground">
                    {t(
                      'PDF, PPT, Word 공부 자료로 퀴즈를 만들어 보세요. 핵심 개념을 빠르게 암기하고 시험 대비에 효과적입니다.',
                    )}
                  </p>
                </div>
              </BlurFade>
              <BlurFade delay={STAGGER_DELAY} inView>
                <div className="rounded-lg border border-border bg-muted p-6 transition-colors duration-200 hover:border-primary md:p-5">
                  <h4 className="mb-3 text-xl font-semibold text-foreground">
                    <TrendingUp className="inline size-4" /> {t('유형별 풀어보기')}
                  </h4>
                  <p className="leading-relaxed text-muted-foreground">
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
              </BlurFade>
            </div>
          </section>

          {/* === 신뢰도 섹션 (단일 컬럼 스택) === */}
          <section className="mb-12" onMouseEnter={() => handleSectionHover('trust')}>
            <TextAnimate
              as="h2"
              animation="fadeIn"
              by="word"
              id="why-trust-us"
              className="mb-6 text-[1.8rem] font-bold text-foreground md:text-2xl"
            >
              {t('Q-Asker를 신뢰할 수 있는 이유')}
            </TextAnimate>

            <div className="space-y-4">
              <BlurFade delay={0} inView>
                <div className="rounded-lg border border-border bg-muted p-6 transition-colors duration-200 hover:border-primary md:p-5">
                  <h4 className="mb-3 text-xl font-semibold text-foreground">{t('자료 보호')}</h4>
                  <p className="leading-relaxed text-muted-foreground">
                    {t('모든 자료는 업로드 이후 24시간 뒤에 삭제됩니다')}
                  </p>
                </div>
              </BlurFade>
              <BlurFade delay={STAGGER_DELAY} inView>
                <div className="rounded-lg border border-border bg-muted p-6 transition-colors duration-200 hover:border-primary md:p-5">
                  <h4 className="mb-3 text-xl font-semibold text-foreground">
                    <ClipboardList className="inline size-4" /> {t('명확한 문제 생성 기준')}
                  </h4>
                  <p className="leading-relaxed text-muted-foreground">
                    {t('문제 유형별 기준에 맞춰 퀴즈를 생성합니다.')}
                    <br />
                    <li>{t('빈칸: 핵심 개념을 정확히 기억하는지 확인')}</li>
                    <li>{t('OX: 핵심 개념의 옳고 그름을 빠르게 점검하는 문제')}</li>
                    <li>{t('객관식: 개념을 비교·분석하고 적용하는 문제')}</li>
                  </p>
                </div>
              </BlurFade>
            </div>
          </section>

          {/* === FAQ 섹션 (아코디언 비주얼, 단일 컬럼) === */}
          <section
            className="mb-12"
            onMouseEnter={() => handleSectionHover('faq')}
            itemScope
            itemType="https://schema.org/FAQPage"
          >
            <h2 id="faq" className="mb-6 text-[1.8rem] font-bold text-foreground md:text-2xl">
              <CircleHelp className="inline size-5" />{' '}
              <TextAnimate animation="fadeIn" by="word" as="span">
                {t('자주 묻는 질문 (FAQ)')}
              </TextAnimate>
            </h2>

            <div className="space-y-3">
              {[
                {
                  q: 'Q. Q-Asker는 정말 무료인가요?',
                  a: '네, PDF, PPT, Word 기반 AI 퀴즈 생성은 현재 완전 무료입니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.',
                },
                {
                  q: 'Q. 업로드한 제 파일은 안전하게 관리되나요?',
                  a: '네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 24시간 뒤에 삭제됩니다.',
                },
                {
                  q: 'Q. AI가 만든 퀴즈의 정확도는 어느 정도인가요?',
                  a: 'AI는 높은 정확도로 문서를 분석하지만, 100% 완벽하지 않을 수 있습니다. 생성된 문제는 학습 참고용이며, 중요한 정보는 반드시 원본과 교차 확인해주세요.',
                },
                {
                  q: 'Q. 이미지로 된 파일도 퀴즈로 만들 수 있나요?',
                  a: '네. OCR을 지원하여 스캔 본이나 사진 형태의 문서도 분석할 수 있습니다.',
                },
              ].map((faq, index) => (
                <BlurFade key={index} delay={index * 0.1} inView>
                  <div
                    className="rounded-lg border border-border bg-muted p-5 transition-colors duration-200 hover:border-primary"
                    itemProp="mainEntity"
                    itemScope
                    itemType="https://schema.org/Question"
                  >
                    <h4 itemProp="name" className="mb-2 text-lg font-bold text-foreground">
                      {t(faq.q)}
                    </h4>
                    <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                      <p itemProp="text" className="leading-relaxed text-muted-foreground">
                        {t(faq.a)}
                      </p>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </section>

          {/* === 주의사항 섹션 (왼쪽 보더 콜아웃) === */}
          <section className="mb-12" onMouseEnter={() => handleSectionHover('warnings')}>
            <TextAnimate
              as="h2"
              animation="fadeIn"
              by="word"
              id="precautions"
              className="mb-6 text-[1.8rem] font-bold text-foreground md:text-2xl"
            >
              {t('꼭 읽어주세요: 주의사항')}
            </TextAnimate>

            <BlurFade delay={0} inView>
              <div className="rounded-r-lg border-l-4 border-primary bg-muted p-6">
                <ul className="m-0 list-none pl-0">
                  <li className="mb-3 text-base font-medium leading-relaxed text-foreground">
                    <strong className="font-bold text-primary">{t('AI 한계점:')}</strong>{' '}
                    {t(
                      '생성된 문제는 학습 참고용이며, 사실관계가 100% 정확하지 않을 수 있습니다. 중요한 정보는 반드시 원본과 교차 확인하세요.',
                    )}
                  </li>
                  <li className="text-base font-medium leading-relaxed text-foreground">
                    <strong className="font-bold text-primary">{t('기록 삭제:')}</strong>{' '}
                    {t('삭제된 퀴즈 기록은 복구할 수 없으니 신중하게 결정해주세요.')}
                  </li>
                </ul>
              </div>
            </BlurFade>
          </section>

          {/* === 문의 및 피드백 섹션 === */}
          <section className="mb-12" onMouseEnter={() => handleSectionHover('contact')}>
            <TextAnimate
              as="h2"
              animation="fadeIn"
              by="word"
              id="contact-support"
              className="mb-6 text-[1.8rem] font-bold text-foreground md:text-2xl"
            >
              {t('문의 및 피드백')}
            </TextAnimate>

            <BlurFade delay={0} inView>
              <p className="mb-5 text-[1.1rem] leading-relaxed text-muted-foreground">
                {t(
                  'Q-Asker 사용 중 궁금한 점이나 개선 아이디어가 있으시면 언제든지 알려주세요! 더 좋은',
                )}
                <strong className="text-foreground">{t('AI 퀴즈 생성')}</strong>
                {t('서비스를 만드는데 큰 도움이 됩니다.')}
              </p>
            </BlurFade>

            <BlurFade delay={STAGGER_DELAY} inView>
              <div className="rounded-lg border border-border bg-muted p-5">
                <p className="mb-2">
                  <strong className="text-foreground">{t('구글 폼:')}</strong>{' '}
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary no-underline hover:underline"
                  >
                    {t('구글 폼 링크')}
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">{t('이메일:')}</strong>{' '}
                  <a
                    href="mailto:inhapj01@gmail.com"
                    aria-label={t('Q-Asker 이메일 문의')}
                    className="text-primary no-underline hover:underline"
                  >
                    inhapj01@gmail.com
                  </a>
                </p>
              </div>
            </BlurFade>
          </section>
        </main>
      </div>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const HELP_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};

const HelpWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('help');
  const VariantComponent = variant ? HELP_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <Help />;
};

export default HelpWithVariant;
