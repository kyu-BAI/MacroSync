import { StyleSheet, Platform } from 'react-native';

// ==========================================
// SYSTEM COLOR SCHEME ENVIRONMENT DESIGN SYSTEM
// ==========================================
export const CONFIG = {
  baseColor: '#F8FAFC',
  logoGreen: '#10B981',
  textDark: '#0F172A',
  textGrey: '#64748B',
  textMuted: '#94A3B8',
  borderLight: '#E2E8F0',
  borderItem: '#E2E8F0',
  bgPill: '#F1F5F9'
};

export const getStyles = (theme, isDarkMode = false) => StyleSheet.create({
  // --- Structural Architecture Framework Bases ---
  container: { 
    flex: 1, 
    backgroundColor: theme?.background || CONFIG.baseColor 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 30, 
    paddingTop: Platform.OS === 'ios' ? 30 : 20 
  },
  headerSection: { 
    marginBottom: 28, 
    alignItems: 'center', 
    width: '100%' 
  },
  stepIndicator: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: CONFIG.logoGreen, 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  brandTitle: { 
    fontSize: 38, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    letterSpacing: -0.5, 
    marginTop: 4 
  },
  brandSubtitle: { 
    fontSize: 13, 
    color: theme?.textSecondary || CONFIG.textGrey, 
    marginTop: 8, 
    textAlign: 'center', 
    lineHeight: 20, 
    fontWeight: '700', 
    paddingHorizontal: 10 
  },
  
  // --- Main Panel Surfacings Cards UI Architecture Layers ---
  formCard: {
    backgroundColor: theme?.surface || CONFIG.baseColor,
    borderRadius: 28, 
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || CONFIG.borderItem,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionInputLabel: { 
    color: theme?.textPrimary || '#64748B', 
    fontSize: 11, 
    fontWeight: '800', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    marginLeft: 4 
  },
  
  // --- Grids Matrix Layout Systems & Badging Parameters Nodes ---
  segmentedGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  gridCard: { 
    width: '31.5%', 
    borderRadius: 20, 
    paddingVertical: 14, 
    paddingHorizontal: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5 
  },
  gridCardInactive: { 
    backgroundColor: theme?.surface || CONFIG.baseColor, 
    borderColor: theme?.border || CONFIG.borderItem, 
    shadowOpacity: 0,
    elevation: 0,
  },
  gridCardActive: { 
    backgroundColor: theme?.cardBg || '#EBEBEB', 
    borderColor: CONFIG.logoGreen, 
    shadowOpacity: 0,
    elevation: 0,
  },
  iconWrapper: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8 
  },
  iconWrapperInactive: { 
    backgroundColor: theme?.cardBg || '#F1F5F9' 
  },
  iconWrapperActive: { 
    backgroundColor: CONFIG.logoGreen 
  },
  gridTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: 2 
  },
  gridTitleInactive: { 
    color: theme?.textPrimary || '#0F172A' 
  },
  gridTitleActive: { 
    color: CONFIG.logoGreen 
  },
  gridSubTitle: { 
    fontSize: 10, 
    color: theme?.textSecondary || CONFIG.textMuted, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
  tagBadge: { 
    paddingVertical: 2, 
    paddingHorizontal: 6, 
    borderRadius: 8, 
    marginTop: 2 
  },
  tagBadgeInactive: { 
    backgroundColor: theme?.cardBg || '#F1F5F9' 
  },
  tagBadgeActive: { 
    backgroundColor: CONFIG.logoGreen 
  },
  tagText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: theme?.textSecondary || '#64748B' 
  },
  tagTextActive: { 
    color: '#FFFFFF' 
  },
  
  // --- Form Controls Inputs & Segmented Buttons Switch Panels Row Items ---
  targetSection: { 
    marginTop: 12, 
    borderTopWidth: 1.5, 
    borderColor: CONFIG.borderLight, 
    paddingTop: 16 
  },
  inputGroup: { 
    marginBottom: 18 
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
  togglePillContainer: { 
    flexDirection: 'row', 
    backgroundColor: theme?.cardBg || CONFIG.bgPill, 
    borderRadius: 12, 
    padding: 3, 
    borderWidth: 1, 
    borderColor: theme?.border || CONFIG.borderLight 
  },
  toggleBtn: { 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 9 
  },
  toggleBtnActive: { 
    backgroundColor: CONFIG.logoGreen 
  },
  toggleBtnText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: theme?.textSecondary || CONFIG.textGrey 
  },
  toggleBtnTextActive: { 
    color: '#FFFFFF' 
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || CONFIG.baseColor,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || CONFIG.borderLight,
    height: 50,
    justifyContent: 'center',
  },
  flatInputFieldDisabled: {
    backgroundColor: theme?.cardBg || '#F1F5F9',
    borderColor: theme?.border || '#E2E8F0',
  },
  fieldRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  input: { 
    flex: 1, 
    color: theme?.textPrimary || CONFIG.textDark, 
    paddingHorizontal: 16, 
    height: '100%', 
    fontSize: 15, 
    fontWeight: '700' 
  },
  inputDisabled: {
    color: theme?.textSecondary || CONFIG.textMuted,
  },
  calendarIconBtn: { 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingRight: 16 
  },
  
  // --- Overlay Overrides Custom Modal Sheets Systems ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalFormCard: {
    width: '100%',
    backgroundColor: theme?.surface || CONFIG.baseColor,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || CONFIG.borderItem,
  },
  calendarHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 20 
  },
  calendarMonthTitle: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A' 
  },
  arrowButton: { 
    padding: 8, 
    backgroundColor: theme?.surface || CONFIG.baseColor, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: theme?.border || CONFIG.borderLight, 
  },
  weekHeaderRow: { 
    flexDirection: 'row', 
    width: '100%', 
    marginBottom: 12 
  },
  weekDayLabel: { 
    flex: 1, 
    textAlign: 'center', 
    color: theme?.textSecondary || CONFIG.textMuted, 
    fontWeight: '800', 
    fontSize: 11, 
    textTransform: 'uppercase' 
  },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    width: '100%', 
    justifyContent: 'flex-start' 
  },
  calendarDayButton: { 
    width: '14.28%', 
    aspectRatio: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: 2, 
    borderRadius: 12 
  },
  calendarDayEmpty: { 
    width: '14.28%', 
    aspectRatio: 1, 
    marginVertical: 2 
  },
  calendarDayText: { 
    color: theme?.textPrimary || CONFIG.textDark, 
    fontWeight: '700', 
    fontSize: 13 
  },
  calendarDaySelected: { 
    backgroundColor: CONFIG.logoGreen, 
    borderRadius: 12 
  },
  calendarDayTextSelected: { 
    color: '#FFFFFF', 
    fontWeight: '900' 
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: CONFIG.logoGreen,
  },
  calendarDayTextPast: {
    color: '#CBD5E1',
  },
  
  // --- Operational Lower Buttons Triggers Elements Base Setup ---
  buttonBase: { 
    paddingVertical: 14, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    height: 52, 
    marginTop: 10 
  },
  buttonUnpressed: {
    backgroundColor: CONFIG.logoGreen,
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
    color: '#E2E8F0' 
  },

  // --- Dynamic Suggestions & Validation Styles ---
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme?.textSecondary || CONFIG.textGrey,
    marginLeft: 5,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.cardBg || '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: CONFIG.logoGreen,
  },
  suggestedChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: CONFIG.logoGreen,
    marginLeft: 6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  warningBoxText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 5,
  },
});
