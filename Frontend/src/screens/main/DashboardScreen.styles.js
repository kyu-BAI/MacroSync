import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

export const getStyles = (theme) => StyleSheet.create({
  fullscreenOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    width: screenWidth, height: screenHeight, backgroundColor: theme?.background || baseColor,
  },
  container:    { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 48, paddingBottom: 85 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingHorizontal: 4, width: '100%',
  },
  headerTextGroup: { flex: 1, paddingRight: 12 },
  appName:     { fontSize: 12, fontWeight: '900', color: logoGreen, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
  greeting:    { fontSize: 22, fontWeight: '900', color: theme?.textPrimary || '#0F172A', letterSpacing: -0.5 },
  subGreeting: { fontSize: 13, fontWeight: '700', color: theme?.textSecondary || '#94A3B8', marginTop: 2 },

  avatarContainer: { borderRadius: 24, borderWidth: 1, borderColor: theme?.border || '#E2E8F0' },
  avatarGlass:     { width: 44, height: 44, borderRadius: 22, backgroundColor: logoGreen, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText:      { fontWeight: '900', color: logoGreen, fontSize: 16 },
  avatarImage:     { width: 44, height: 44, borderRadius: 22 },

  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
  },
  cardTitle: { fontSize: 11, color: theme?.textPrimary || '#0F172A', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, fontWeight: '800', marginLeft: 2 },

  weightSplitLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsGrid:     { flex: 1, flexDirection: 'row', flexWrap: 'wrap', marginLeft: 20 },
  statGridItem:  { width: '50%', marginBottom: 10 },
  statLabel:     { fontSize: 10, color: theme?.textSecondary || '#94A3B8', textTransform: 'uppercase', fontWeight: '800', marginBottom: 2 },
  statValue:     { fontSize: 15, fontWeight: '900', color: theme?.textPrimary || '#0F172A' },

  nutritionRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  calorieColumn:      { marginRight: 18, alignItems: 'center' },
  calorieBigText:     { fontSize: 18, fontWeight: '900', color: theme?.textPrimary || '#0F172A', letterSpacing: -0.5 },
  calorieSubText:     { fontSize: 9, color: theme?.textSecondary || '#94A3B8', fontWeight: '800' },
  macroColumn:        { flex: 1, justifyContent: 'center' },
  macroRow:           { marginBottom: 10 },
  macroInfo:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroLabel:         { fontSize: 12, fontWeight: '800', color: theme?.textPrimary || '#0F172A' },
  macroValue:         { fontSize: 11, color: theme?.textSecondary || '#94A3B8', fontWeight: '700' },

  analyticsHubHeader: { marginBottom: 12 },
  glassDivider:       { height: 1, backgroundColor: theme?.border || '#E2E8F0', marginVertical: 14 },
  chartContainer:     { alignItems: 'center', justifyContent: 'center', marginLeft: -15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: theme?.surface || theme?.background || baseColor, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: theme?.border || '#E2E8F0' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: theme?.textPrimary || '#0F172A', marginBottom: 6, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: theme?.textSecondary || '#94A3B8', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  modalInput: { width: '100%', backgroundColor: theme?.inputBg || '#FFFFFF', borderRadius: 14, padding: 14, fontSize: 16, fontWeight: '700', color: theme?.textPrimary || '#0F172A', marginBottom: 18, borderWidth: 1.2, borderColor: theme?.inputBorder || theme?.border || '#E2E8F0' },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 4 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: theme?.inputBg || '#F1F5F9', alignItems: 'center', marginRight: 8, borderWidth: 1.2, borderColor: theme?.border || '#E2E8F0' },
  modalCancelText: { color: theme?.textSecondary || '#94A3B8', fontWeight: '800', fontSize: 14 },
  modalSave: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: logoGreen, alignItems: 'center', marginLeft: 8 },
  modalSaveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  newGoalOptionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme?.inputBg || '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  newGoalOptionLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 2,
  },
  newGoalOptionDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: theme?.textSecondary || '#94A3B8',
  },

  chatbotFab: {
    position: 'absolute', bottom: 104, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: logoGreen,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  warningBannerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
    lineHeight: 15,
  },
});
