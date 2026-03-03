// mobile/src/store/themeStore.ts
// ─────────────────────────────────────────────────
// Theme state: light | dark | system.
// Persisted to AsyncStorage. Syncs with system preference.
// ─────────────────────────────────────────────────

import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '../theme/colors';

const THEME_KEY = '@app_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    setTheme: (theme: ThemeMode) => Promise<void>;
    initTheme: () => Promise<void>;
    updateSystemTheme: (systemColorScheme: ColorSchemeName) => void;
}

const resolveIsDark = (theme: ThemeMode, system: ColorSchemeName): boolean =>
    theme === 'system' ? system === 'dark' : theme === 'dark';

const resolveColors = (isDark: boolean): ThemeColors =>
    isDark ? darkColors : lightColors;

export const useThemeStore = create<ThemeState>((set, get) => {
    const systemScheme = Appearance.getColorScheme();
    const defaultIsDark = resolveIsDark('system', systemScheme);

    return {
        theme: 'system',
        isDark: defaultIsDark,
        colors: resolveColors(defaultIsDark),

        setTheme: async (theme) => {
            const isDark = resolveIsDark(theme, Appearance.getColorScheme());
            set({ theme, isDark, colors: resolveColors(isDark) });
            await AsyncStorage.setItem(THEME_KEY, theme);
        },

        initTheme: async () => {
            try {
                const stored = await AsyncStorage.getItem(THEME_KEY) as ThemeMode | null;
                if (stored && ['light', 'dark', 'system'].includes(stored)) {
                    const isDark = resolveIsDark(stored, Appearance.getColorScheme());
                    set({ theme: stored, isDark, colors: resolveColors(isDark) });
                }
            } catch {
                // Keep defaults if AsyncStorage fails
            }
        },

        updateSystemTheme: (systemColorScheme) => {
            const { theme } = get();
            if (theme === 'system') {
                const isDark = systemColorScheme === 'dark';
                set({ isDark, colors: resolveColors(isDark) });
            }
        },
    };
});
