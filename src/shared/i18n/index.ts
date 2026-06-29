/**
 * 평탄화된 단일 lang JSON에서 namespace key를 조회한다.
 *
 * 디렉토리 구조 단순화 후의 호환 어댑터 — i18nexus의 `loadNamespace(namespace, lang)`
 * 계약을 유지하면서 단일 파일(`./{lang}.json`)을 한 번만 로드하고 namespace 단위로
 * 슬라이스를 반환한다. 도구 자동 갱신(`npm run i18n:sync`)은 본 평탄화 이후 비활성 —
 * 추후 번역 추가 시 수동 편집 또는 도구 옵션(`namespacing.enabled: false`) 재구성 필요.
 *
 * @param namespace - 네임스페이스 키 (예: "common", "make-quiz")
 * @param lang - 언어 코드 (예: "ko", "en")
 * @returns 해당 namespace의 번역 객체. 누락 시 빈 객체
 */
const cache: Record<string, Record<string, unknown>> = {};

export async function loadNamespace(namespace: string, lang: string) {
  if (!cache[lang]) {
    const module = await import(`./${lang}.json`);
    cache[lang] = module.default as Record<string, unknown>;
  }
  const bundle = cache[lang];
  return (bundle[namespace] as Record<string, unknown> | undefined) ?? {};
}
