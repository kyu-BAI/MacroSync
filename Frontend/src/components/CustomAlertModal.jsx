import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { CheckCircle2, AlertCircle, HelpCircle, Info, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const baseColor = '#F0F4F2';
const logoGreen = '#4EA685';
const logoDarkShadow = '#37745D';
const logoLightHighlight = '#65D8AD';
const clearWhiteHighlight = '#FFFFFF';
const softGreenShadow = '#AEC2B7';

export default function CustomAlertModal({
  visible,
  title,
  message,
  type = 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
  buttons = [],
  onClose
}) {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 color="#2E7D32" size={32} />;
      case 'error':
      case 'warning':
        return <AlertCircle color="#C53030" size={32} />;
      case 'confirm':
        return <HelpCircle color={logoGreen} size={32} />;
      case 'info':
      default:
        return <Info color={logoGreen} size={32} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return '#E8F5E9';
      case 'error':
      case 'warning':
        return '#FFEBEE';
      case 'confirm':
      case 'info':
      default:
        return '#E6F4EE';
    }
  };

  const alertButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];
  const isMultiButton = alertButtons.length > 1;
  const hasLongText = alertButtons.some(btn => btn.text && btn.text.length > 12);
  const stackVertically = isMultiButton && hasLongText;

  let displayButtons = [...alertButtons];
  if (stackVertically) {
    // Put primary & destructive action buttons at the top, cancel at the bottom
    displayButtons.sort((a, b) => (a.style === 'cancel' ? 1 : 0) - (b.style === 'cancel' ? 1 : 0));
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X color="#7FA293" size={18} />
              </TouchableOpacity>

              <View style={[styles.iconContainer, { backgroundColor: getIconBg() }]}>
                {getIcon()}
              </View>

              {title ? <Text style={styles.titleText}>{title}</Text> : null}

              {message ? <Text style={styles.messageText}>{message}</Text> : null}

              <View style={[
                styles.buttonsContainer,
                stackVertically ? styles.buttonsColumn : styles.buttonsRow
              ]}>
                {displayButtons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (btn.onPress) btn.onPress();
                        onClose();
                      }}
                      style={[
                        styles.buttonBase,
                        stackVertically
                          ? styles.buttonFullWidth
                          : (alertButtons.length > 1 ? { flex: 1, marginHorizontal: 4 } : { minWidth: 120 }),
                        isCancel
                          ? styles.cancelButton
                          : isDestructive
                          ? styles.destructiveButton
                          : styles.primaryButton,
                        stackVertically && index > 0 && { marginTop: 10 }
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                        style={[
                          styles.buttonText,
                          isCancel
                            ? styles.cancelButtonText
                            : isDestructive
                            ? styles.destructiveButtonText
                            : styles.primaryButtonText
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 20, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: Math.min(width - 40, 360),
    backgroundColor: baseColor,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2B23',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#556B60',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '600',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  buttonBase: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: logoGreen,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: logoLightHighlight,
    borderLeftColor: logoLightHighlight,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelButton: {
    backgroundColor: '#E4ECE8',
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
  },
  cancelButtonText: {
    color: '#41544B',
    fontSize: 14,
    fontWeight: '700',
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
