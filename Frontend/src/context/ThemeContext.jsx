import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@user_theme_mode_v2';

const lightPalette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  primary: '#10B981',
  primaryHover: '#059669',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  divider: 'rgba(0, 0, 0, 0.06)',
  navbar: '#FFFFFF',
  inputBg: '#F1F5F9',
  inputBorder: '#E2E8F0',
  placeholderText: '#94A3B8',
  iconBg: '#ECFDF5',
  shadowColor: 'transparent',
};

const darkPalette = {
  background: '#0F172A',
  surface: '#1E293B',
  cardBg: '#1E293B',
  primary: '#34D399',
  primaryHover: '#10B981',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  error: '#F87171',
  success: '#34D399',
  divider: 'rgba(255, 255, 255, 0.1)',
  navbar: '#0F172A',
  inputBg: '#334155',
  inputBorder: '#475569',
  placeholderText: '#64748B',
  iconBg: '#064E3B',
  shadowColor: 'transparent',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'dark' | 'light' | null
  const [themeMode, setThemeModeState] = useState('system'); // Default: follow phone OS theme

  useEffect(() => {
    const loadSavedThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode === 'dark' || savedMode === 'light' || savedMode === 'system') {
          setThemeModeState(savedMode);
        } else if (savedMode === 'true') {
          setThemeModeState('dark');
        } else if (savedMode === 'false') {
          setThemeModeState('light');
        } else {
          // First time opening app: follow phone OS dark/light mode
          setThemeModeState('system');
        }
      } catch (err) {
        console.log('Error loading saved theme mode:', err);
      }
    };
    loadSavedThemeMode();
  }, []);

  const setThemeMode = async (newMode) => {
    try {
      setThemeModeState(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (err) {
      console.log('Error saving theme mode:', err);
    }
  };

  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const toggleTheme = async () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(nextMode);
  };

  const theme = useMemo(() => {
    return isDarkMode ? darkPalette : lightPalette;
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
