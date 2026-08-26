import React from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { CheckCircle2, AlertCircle, HelpCircle, Info, AlertTriangle, X, LogOut } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { styles } from './CustomAlertModal.styles';

// ── Per-type color palettes ───────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: {
    accent:    '#10B981',
    accentBg:  'rgba(16, 185, 129, 0.12)',
    accentBdr: 'rgba(16, 185, 129, 0.30)',
    icon: (size) => <CheckCircle2 color="#10B981" size={size} strokeWidth={2.5} />,
  },
  error: {
    accent:    '#EF4444',
    accentBg:  'rgba(239, 68, 68, 0.12)',
    accentBdr: 'rgba(239, 68, 68, 0.30)',
    icon: (size) => <AlertCircle color="#EF4444" size={size} strokeWidth={2.5} />,
  },
  logout: {
    accent:    '#EF4444',
    accentBg:  'rgba(239, 68, 68, 0.12)',
    accentBdr: 'rgba(239, 68, 68, 0.30)',
    icon: (size) => <LogOut color="#EF4444" size={size} strokeWidth={2.5} />,
  },
  warning: {
    accent:    '#F59E0B',
    accentBg:  'rgba(245, 158, 11, 0.12)',
    accentBdr: 'rgba(245, 158, 11, 0.30)',
    icon: (size) => <AlertTriangle color="#F59E0B" size={size} strokeWidth={2.5} />,
  },
  confirm: {
    accent:    '#10B981',
    accentBg:  'rgba(16, 185, 129, 0.12)',
    accentBdr: 'rgba(16, 185, 129, 0.30)',
    icon: (size) => <HelpCircle color="#10B981" size={size} strokeWidth={2.5} />,
  },
  info: {
    accent:    '#3B82F6',
    accentBg:  'rgba(59, 130, 246, 0.12)',
    accentBdr: 'rgba(59, 130, 246, 0.30)',
    icon: (size) => <Info color="#3B82F6" size={size} strokeWidth={2.5} />,
  },
};

export default function CustomAlertModal({
  visible,
  title,
  message,
  type = 'info',
  buttons = [],
  onClose
}) {
  const { theme, isDarkMode } = useTheme();

  if (!visible) return null;

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const alertButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];
  const isMultiButton = alertButtons.length > 1;
  const hasLongText = alertButtons.some(btn => btn.text && btn.text.length > 12);
  const stackVertically = isMultiButton && hasLongText;

  let displayButtons = [...alertButtons];
  if (stackVertically) {
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
            <View style={[
              styles.cardContainer,
              {
                backgroundColor: theme?.surface || theme?.cardBg || '#FFFFFF',
                borderColor: theme?.border || '#E2E8F0',
              }
            ]}>

              {/* ── Close button ── */}
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: theme?.inputBg || '#F1F5F9' }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X color={theme?.textSecondary || '#94A3B8'} size={16} />
              </TouchableOpacity>

              {/* ── Icon ring ── */}
              <View style={[styles.iconContainer, { backgroundColor: cfg.accentBg, borderColor: theme?.border || '#E2E8F0' }]}>
                {cfg.icon(30)}
              </View>

              {/* ── Title ── */}
              {title ? (
                <Text style={[styles.titleText, { color: theme?.textPrimary || '#0F172A' }]}>
                  {title}
                </Text>
              ) : null}

              {/* ── Message ── */}
              {message ? (
                <Text style={[styles.messageText, { color: theme?.textSecondary || '#64748B' }]}>
                  {message}
                </Text>
              ) : null}

              {/* ── Buttons ── */}
              <View style={[
                styles.buttonsContainer,
                stackVertically ? styles.buttonsColumn : styles.buttonsRow
              ]}>
                {displayButtons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  let btnStyle, btnTextStyle;
                  if (isCancel) {
                    btnStyle = [styles.cancelButton, {
                      backgroundColor: theme?.inputBg || '#F1F5F9',
                      borderColor: theme?.border || '#E2E8F0',
                    }];
                    btnTextStyle = [styles.cancelButtonText, { color: theme?.textSecondary || '#64748B' }];
                  } else if (isDestructive) {
                    btnStyle = [styles.destructiveButton];
                    btnTextStyle = styles.destructiveButtonText;
                  } else {
                    // Primary — use standard clean green
                    btnStyle = [styles.primaryButton, { backgroundColor: '#10B981' }];
                    btnTextStyle = styles.primaryButtonText;
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      onPress={() => {
                        onClose();
                        if (btn.onPress) {
                          setTimeout(() => {
                            btn.onPress();
                          }, 100);
                        }
                      }}
                      style={[
                        styles.buttonBase,
                        stackVertically
                          ? styles.buttonFullWidth
                          : (alertButtons.length > 1 ? { flex: 1, marginHorizontal: 4 } : { minWidth: 120 }),
                        btnStyle,
                        stackVertically && index > 0 && { marginTop: 10 }
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                        style={[styles.buttonText, btnTextStyle]}
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