import React, { createContext, useState, useContext, useMemo } from 'react';

const lightPalette = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  primary: '#00D084',
  primaryHover: '#00B875',
  textPrimary: '#1A1D1E',
  textSecondary: '#8A959E',
  border: '#EAEAEA',
  error: '#FF6B6B',
  success: '#00D084',
  divider: '#F0F0F0',
  navbar: '#FFFFFF'
};

const darkPalette = {
  background: '#121417',
  surface: '#1E2126',
  primary: '#00E676',
  primaryHover: '#00C853',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AAB2',
  border: '#2A2F35',
  error: '#FF5252',
  success: '#00E676',
  divider: '#2A2F35',
  navbar: '#1E2126'
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = useMemo(() => {
    return isDarkMode ? darkPalette : lightPalette;
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
