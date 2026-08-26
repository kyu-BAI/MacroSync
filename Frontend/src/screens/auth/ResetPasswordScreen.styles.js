import { StyleSheet } from 'react-native';

const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme?.background || baseColor 
  },
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: { 
    marginBottom: 32, 
    alignItems: "center",
    width: '100%',
  },
  brandTitle: { 
    fontSize: 38, 
    fontWeight: "900", 
    color: logoGreen,
    letterSpacing: -0.5,
    textAlign: 'center', 
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || '#64748B',
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || '#E2E8F0',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme?.textPrimary || '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  toggleIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 6,
  },
  warningText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  buttonUnpressed: {
    backgroundColor: logoGreen,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  buttonTextPressed: { 
    color: '#E2E8F0' 
  },
});
