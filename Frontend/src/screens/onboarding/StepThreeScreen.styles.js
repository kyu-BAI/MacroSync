import { StyleSheet, Platform } from 'react-native';

export const ITEM_HEIGHT = 54;

// Global Core Flat Design Tokens
export const baseColor = '#F8FAFC';

// Logo Corporate Branding Elements
export const logoGreen = '#10B981';

export const getStyles = (theme, isDarkMode = false) => StyleSheet.create({
  // --- BASE CONTAINER ARCHITECTURE ---
  container: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 35 : 25,
  },

  // --- TYPOGRAPHY HEADER SYSTEM ---
  headerSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 20 : 15,
    marginBottom: 20,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '900',
    color: logoGreen,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '700',
    paddingHorizontal: 10,
  },

  // --- SURFACE PANEL MATRIX ---
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 10,
  },
  sectionInputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },

  // --- FORMS & SELECTION MATRIX ---
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || '#E2E8F0',
    height: 48,
    justifyContent: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  selectorValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
  },
  placeholderText: {
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '600',
  },
  disabledSelector: {
    backgroundColor: theme?.cardBg || '#F1F5F9',
    borderColor: theme?.border || '#E2E8F0',
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: theme?.textPrimary || '#0F172A',
    paddingHorizontal: 16,
    height: '100%',
    fontSize: 14,
    fontWeight: '700',
  },

  // --- ALLERGENS SELECTION CHIPS ---
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    marginLeft: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  chipInactive: {
    backgroundColor: theme?.surface || baseColor,
    borderColor: theme?.border || '#E2E8F0',
  },
  chipActive: {
    backgroundColor: logoGreen,
    borderColor: logoGreen,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme?.textSecondary || '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // --- FIXED NAVIGATION BOTTOM HOOD ---
  fixedFooter: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
    backgroundColor: theme?.background || baseColor,
    borderTopWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  buttonBase: {
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
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
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: '#E2E8F0',
  },

  // --- POPUP SELECTOR INTERFACES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerModalCard: {
    backgroundColor: theme?.surface || baseColor,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    height: '75%',
    width: '100%',
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    paddingBottom: 12,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    letterSpacing: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.inputBg || '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme?.inputBorder || '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme?.textPrimary || '#0F172A',
    fontWeight: '600',
    height: '100%',
  },
  pickerContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  optionsList: {
    flex: 1,
  },
  optionsListContent: {
    paddingBottom: 60,
  },
  pickerItemRow: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
  },

  // --- PREMIUM OVERLAY DIALOGUE (CONFIRMATION SHEET STYLE) ---
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 32, 44, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme?.cardBg || '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  confirmDataBlock: {
    width: '100%',
    backgroundColor: theme?.inputBg || '#F1F5F9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme?.inputBorder || '#E2E8F0',
    marginBottom: 24,
  },
  confirmDataLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme?.textSecondary || '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  confirmDataValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
    lineHeight: 20,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: theme?.border || '#E2E8F0',
    marginVertical: 12,
  },
  confirmActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButtonBase: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonSecondary: {
    backgroundColor: theme?.surface || baseColor,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  confirmButtonPrimary: {
    backgroundColor: logoGreen,
  },
  confirmButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: theme?.textSecondary || '#64748B',
  },
  confirmButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
