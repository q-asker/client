import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { presets, THEME_CSS_KEYS } from './presets';
import type { ThemePreset } from './types';

const STORAGE_KEY = 'q-asker-theme';

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
  // 먼저 이전 값 제거 후 새 값 적용
  removeVarsFromDocument();
  applyVarsToDocument(vars);
};

export const useThemePreset = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [currentPresetId, setCurrentPresetId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? 'default';
    } catch {
      return 'default';
    }
  });

  const currentPreset = presets.find((p) => p.id === currentPresetId) ?? presets[0];

  // 프리셋 적용
  const applyPreset = useCallback(
    (preset: ThemePreset) => {
      setCurrentPresetId(preset.id);
      applyPresetForMode(preset, isDark);
      try {
        if (preset.id === 'default') {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, preset.id);
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
    } catch {
      // localStorage 에러 무시
    }
  }, []);

  // 다크/라이트 모드 전환 시 현재 프리셋의 변수 세트 자동 전환
  useEffect(() => {
    if (currentPreset.id === 'default') return;
    applyPresetForMode(currentPreset, isDark);
  }, [isDark, currentPreset]);

  // 초기 로드 시 저장된 프리셋 복원
  useEffect(() => {
    if (currentPreset.id === 'default') return;
    applyPresetForMode(currentPreset, isDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    presets,
    currentPreset,
    currentPresetId,
    applyPreset,
    resetToDefault,
  };
};
