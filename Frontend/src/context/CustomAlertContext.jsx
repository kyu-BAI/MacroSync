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
    let alertType = type;
    const lowerTitle = (title || '').toLowerCase();
    const lowerMsg   = (message || '').toLowerCase();
    const combined   = lowerTitle + ' ' + lowerMsg;

    if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerMsg.includes('error')) {
      alertType = 'error';
    } else if (
      lowerTitle.includes('success') || lowerTitle.includes('saved') || lowerTitle.includes('logged') ||
      lowerTitle.includes('tracked') || lowerTitle.includes('added') || lowerTitle.includes('complete') ||
      lowerMsg.includes('success') || lowerMsg.includes('successfully')
    ) {
      alertType = 'success';
    } else if (
      lowerTitle.includes('warning') || lowerTitle.includes('limit') || lowerTitle.includes('over') ||
      lowerTitle.includes('invalid') || lowerTitle.includes('exceed') || combined.includes('over your')
    ) {
      alertType = 'warning';
    } else if (
      lowerTitle.includes('confirm') || lowerTitle.includes('sure') || lowerTitle.includes('proceed') ||
      lowerMsg.includes('are you sure') || lowerMsg.includes('proceed')
    ) {
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
