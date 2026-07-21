import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlertModal from '../components/CustomAlertModal';

const CustomAlertContext = createContext(null);

export function CustomAlertProvider({ children }) {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  const showAlert = useCallback((title, message, buttons = [], type = 'info') => {
    // Deduce type automatically if title contains keywords like "Error", "Success", "Warning", etc.
    let alertType = type;
    const lowerTitle = (title || '').toLowerCase();
    const lowerMsg = (message || '').toLowerCase();

    if (lowerTitle.includes('error') || lowerMsg.includes('error') || lowerTitle.includes('failed')) {
      alertType = 'error';
    } else if (lowerTitle.includes('success') || lowerMsg.includes('success') || lowerTitle.includes('saved')) {
      alertType = 'success';
    } else if (lowerTitle.includes('warning') || lowerTitle.includes('confirm')) {
      alertType = 'confirm';
    }

    setAlertConfig({
      visible: true,
      title,
      message,
      type: alertType,
      buttons
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <CustomAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </CustomAlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within a CustomAlertProvider');
  }
  return context;
}
