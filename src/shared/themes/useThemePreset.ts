import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { DEFAULT_PRESET_ID, getDefaultPreset, presets, THEME_CSS_KEYS } from './presets';
import type { ThemePreset } from './types';

const STORAGE_KEY = 'q-asker-theme';
const STORAGE_VARS_KEY = 'q-asker-theme-vars';
const NEXT_THEMES_STORAGE_KEY = 'theme';

// CSS 변수를 document에 적용
const applyVarsToDocument = (vars: Record<string, string>) => {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

// 모든 테마 CSS 변수를 제거하여 globals.css 원본 값 복원
const removeVarsFromDocument = () => {
  const root = document.documentElement;
  THEME_CSS_KEYS.forEach((key) => {
    root.style.removeProperty(key);
  });
};

// 현재 다크모드 여부에 따라 적절한 변수 세트 적용
const applyPresetForMode = (preset: ThemePreset, isDark: boolean) => {
  if (preset.id === 'default') {
    removeVarsFromDocument();
    return;
  }
  const vars = isDark ? preset.darkVars : preset.lightVars;
  removeVarsFromDocument();
  applyVarsToDocument(vars);
};

// CSS 변수를 localStorage에 저장 (React 마운트 전 복원용)
const persistVars = (vars: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_VARS_KEY, JSON.stringify(vars));
  } catch {
    // localStorage 에러 무시
  }
};

const clearPersistedVars = () => {
  try {
    localStorage.removeItem(STORAGE_VARS_KEY);
  } catch {
    // localStorage 에러 무시
  }
};

// 저장된 next-themes 설정 + 시스템 선호도로 다크 모드 추정 (마운트 전용)
const detectIsDarkBeforeMount = (): boolean => {
  try {
    const stored = localStorage.getItem(NEXT_THEMES_STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {
    // localStorage 접근 불가 → 시스템 선호도 폴백
  }
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * React 마운트 전에 호출하여 저장된 테마 CSS 변수를 즉시 적용한다.
 * main.tsx에서 createRoot() 전에 호출해야 플래싱이 방지된다.
 * 저장된 프리셋이 없으면 기본 프리셋(claude)을 적용한다.
 */
export const restoreThemeBeforeMount = () => {
  try {
    const savedVars = localStorage.getItem(STORAGE_VARS_KEY);
    if (savedVars) {
      const vars = JSON.parse(savedVars) as Record<string, string>;
      applyVarsToDocument(vars);
      return;
    }
    const savedPresetId = localStorage.getItem(STORAGE_KEY);
    if (savedPresetId === 'default') return;
    const fallback = getDefaultPreset();
    if (fallback.id === 'default') return;
    const isDark = detectIsDarkBeforeMount();
    const vars = isDark ? fallback.darkVars : fallback.lightVars;
    applyVarsToDocument(vars);
  } catch {
    // 복원 실패 시 globals.css 원본으로 폴백
  }
};

export const useThemePreset = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [currentPresetId, setCurrentPresetId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PRESET_ID;
    } catch {
      return DEFAULT_PRESET_ID;
    }
  });

  const currentPreset = presets.find((p) => p.id === currentPresetId) ?? getDefaultPreset();

  // 프리셋 적용
  const applyPreset = useCallback(
    (preset: ThemePreset) => {
      setCurrentPresetId(preset.id);
      applyPresetForMode(preset, isDark);
      try {
        if (preset.id === 'default') {
          localStorage.removeItem(STORAGE_KEY);
          clearPersistedVars();
        } else {
          const vars = isDark ? preset.darkVars : preset.lightVars;
          localStorage.setItem(STORAGE_KEY, preset.id);
          persistVars(vars);
        }
      } catch {
        // localStorage 에러 무시
      }
    },
    [isDark],
  );

  // 기본 테마로 리셋
  const resetToDefault = useCallback(() => {
    setCurrentPresetId('default');
    removeVarsFromDocument();
    try {
      localStorage.removeItem(STORAGE_KEY);
      clearPersistedVars();
    } catch {
      // localStorage 에러 무시
    }
  }, []);

  // 다크/라이트 모드 전환 시 현재 프리셋의 변수 세트 자동 전환 + 저장
  useEffect(() => {
    if (currentPreset.id === 'default') return;
    applyPresetForMode(currentPreset, isDark);
    const vars = isDark ? currentPreset.darkVars : currentPreset.lightVars;
    persistVars(vars);
  }, [isDark, currentPreset]);

  return {
    presets,
    currentPreset,
    currentPresetId,
    applyPreset,
    resetToDefault,
  };
};
