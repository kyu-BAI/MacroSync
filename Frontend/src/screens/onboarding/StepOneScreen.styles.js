import { StyleSheet } from 'react-native';

const COLORS = {
  base: '#F8FAFC',
  logoGreen: '#10B981',
  textDark: '#0F172A',
  textMuted: '#64748B',
  borderLight: '#E2E8F0',
  whiteHighlight: '#FFFFFF',
  textPlaceholder: '#94A3B8',
  bgPill: '#F1F5F9'
};

export const getStyles = (theme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme?.background || COLORS.base 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16 
  },
  
  headerSection: { 
    marginBottom: 35, 
    alignItems: 'center', 
    width: '100%' 
  },
  stepIndicator: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: COLORS.logoGreen, 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  brandTitle: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    letterSpacing: -0.5, 
    marginTop: 6 
  },
  brandSubtitle: { 
    fontSize: 14, 
    color: theme?.textSecondary || COLORS.textMuted, 
    marginTop: 10, 
    textAlign: 'center', 
    lineHeight: 22, 
    fontWeight: '700' 
  },
  
  formCard: {
    backgroundColor: theme?.surface || COLORS.base,
    borderRadius: 28, 
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || COLORS.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  inputGroup: { 
    marginBottom: 22 
  },
  rowLabelWrapper: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8, 
    paddingHorizontal: 4 
  },
  inputLabel: { 
    color: theme?.textPrimary || '#64748B', 
    fontSize: 11, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2 
  },
  splitInputRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  
  togglePillContainer: {
    flexDirection: 'row',
    backgroundColor: theme?.cardBg || COLORS.bgPill,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: theme?.border || COLORS.borderLight
  },
  toggleBtn: { 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 9 
  },
  toggleBtnActive: { 
    backgroundColor: COLORS.logoGreen 
  },
  toggleBtnText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: theme?.textSecondary || COLORS.textMuted 
  },
  toggleBtnTextActive: { 
    color: COLORS.whiteHighlight 
  },

  flatInputField: {
    backgroundColor: theme?.inputBg || COLORS.base,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || COLORS.borderLight,
  },
  input: { 
    flex: 1, 
    color: theme?.textPrimary || COLORS.textDark, 
    paddingHorizontal: 18, 
    paddingVertical: 15, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  
  bmiPanelRecess: {
    backgroundColor: theme?.inputBg || COLORS.base,
    borderRadius: 16,
    padding: 20,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 110,
  },
  bmiContentCenter: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bmiLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: theme?.textSecondary || COLORS.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  bmiNumber: { 
    fontSize: 38, 
    fontWeight: '900', 
    color: theme?.textPrimary || COLORS.textDark, 
    marginVertical: 4 
  },
  bmiCategory: { 
    fontSize: 15, 
    fontWeight: '800' 
  },
  bmiPlaceholder: { 
    color: theme?.textSecondary || COLORS.textPlaceholder, 
    fontSize: 13, 
    fontWeight: '700', 
    textAlign: 'center', 
    lineHeight: 20 
  },
  
  buttonBase: { 
    paddingVertical: 16, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    marginTop: 16 
  },
  buttonUnpressed: {
    backgroundColor: COLORS.logoGreen,
    borderRadius: 20,
  },
  buttonPressed: { 
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  buttonText: { 
    color: COLORS.whiteHighlight, 
    fontSize: 16, 
    fontWeight: '800', 
    letterSpacing: 0.5, 
  },
  buttonTextPressed: { 
    color: '#E2E8F0' 
  },
});
