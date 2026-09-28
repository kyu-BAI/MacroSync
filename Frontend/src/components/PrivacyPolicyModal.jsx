import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  X,
  HeartPulse,
  Lock,
  Scale,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const logoGreen = '#10B981';

export default function PrivacyPolicyModal({ visible, onClose, initialTab = 'medical' }) {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync initial tab if passed
  React.useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconBadge}>
              <ShieldAlert color={logoGreen} size={22} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>
                Legal & Health Disclaimers
              </Text>
              <Text style={styles.headerSubtitle}>
                MacroSync Clinical Scope & Policies
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, isDarkMode && styles.closeButtonDark]}
              activeOpacity={0.7}
            >
              <X color={isDarkMode ? '#CBD5E1' : '#64748B'} size={20} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Bar */}
          <View style={[styles.tabBar, isDarkMode && styles.tabBarDark]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'medical' && styles.tabItemActive,
                activeTab === 'medical' && isDarkMode && styles.tabItemActiveDark,
              ]}
              onPress={() => setActiveTab('medical')}
              activeOpacity={0.8}
            >
              <HeartPulse
                size={14}
                color={activeTab === 'medical' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                style={{ marginRight: 5 }}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabText,
                  activeTab === 'medical' && styles.tabTextActive,
                  isDarkMode && activeTab !== 'medical' && styles.textMutedDark,
                ]}
              >
                Medical
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'privacy' && styles.tabItemActive,
                activeTab === 'privacy' && isDarkMode && styles.tabItemActiveDark,
              ]}
              onPress={() => setActiveTab('privacy')}
              activeOpacity={0.8}
            >
              <Lock
                size={14}
                color={activeTab === 'privacy' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                style={{ marginRight: 5 }}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabText,
                  activeTab === 'privacy' && styles.tabTextActive,
                  isDarkMode && activeTab !== 'privacy' && styles.textMutedDark,
                ]}
              >
                Privacy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'terms' && styles.tabItemActive,
                activeTab === 'terms' && isDarkMode && styles.tabItemActiveDark,
              ]}
              onPress={() => setActiveTab('terms')}
              activeOpacity={0.8}
            >
              <Scale
                size={14}
                color={activeTab === 'terms' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                style={{ marginRight: 5 }}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabText,
                  activeTab === 'terms' && styles.tabTextActive,
                  isDarkMode && activeTab !== 'terms' && styles.textMutedDark,
                ]}
              >
                Terms
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'medical' && (
              <View>
                <View style={styles.alertNoticeBox}>
                  <AlertTriangle size={18} color="#D97706" style={{ marginTop: 2, marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertNoticeTitle}>Important Clinical Notice</Text>
                    <Text style={styles.alertNoticeText}>
                      MacroSync is a wellness and nutritional tracking platform, NOT a certified medical device or clinical diagnostic tool.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Non-Medical Purpose & Educational Scope
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  All macro calculations, calorie targets, workout routines, and conversational responses provided by Vita AI are generated for general wellness and educational purposes only. They do not constitute personalized medical diagnosis, clinical nutrition prescriptions, or treatment advice.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. High-Risk Medical Conditions & Screening
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  If you have been diagnosed with, suspect, or are undergoing treatment for:
                  {'\n'}• <Text style={styles.boldSpan}>Diabetes (Type 1 or Type 2)</Text> or pre-diabetes
                  {'\n'}• <Text style={styles.boldSpan}>Eating Disorders</Text> (e.g., Anorexia, Bulimia, Binge Eating)
                  {'\n'}• <Text style={styles.boldSpan}>Chronic Kidney / Renal Disease</Text> or liver impairment
                  {'\n'}• <Text style={styles.boldSpan}>Cardiovascular Disease</Text> or severe hypertension
                  {'\n'}• <Text style={styles.boldSpan}>Pregnancy or Lactation</Text>
                  {'\n\n'}You MUST consult your primary physician, licensed endocrinologist, or Registered Dietitian Nutritionist (RDN) before implementing diet changes, calorie deficits, or intense physical training.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. Chatbot (Vita AI) Limitations
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Vita AI uses Google Gemini artificial intelligence to assist with recipe discovery and macro tracking. While safety guardrails are active, AI models can produce imperfect recommendations. Never substitute AI output for the judgment of a licensed healthcare professional.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  4. Acute Medical Emergencies
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  If you experience chest pain, severe shortness of breath, dizziness, sudden allergic reactions, or acute hypoglycemic distress, cease using the app immediately and call emergency services (911 in the Philippines) or proceed to the nearest hospital.
                </Text>
              </View>
            )}

            {activeTab === 'privacy' && (
              <View>
                <View style={[styles.alertNoticeBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                  <ShieldCheck size={18} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertNoticeTitle, { color: '#065F46' }]}>Philippine Data Privacy Act (RA 10173)</Text>
                    <Text style={[styles.alertNoticeText, { color: '#047857' }]}>
                      MacroSync complies strictly with Republic Act No. 10173 to safeguard your personal health and dietary information.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Information We Collect
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  To personalize your nutritional targets and local food recommendations, MacroSync collects:
                  {'\n'}• <Text style={styles.boldSpan}>Account Identifiers:</Text> Username, email address.
                  {'\n'}• <Text style={styles.boldSpan}>Physical Metrics:</Text> Age, height, current weight, target goal weight.
                  {'\n'}• <Text style={styles.boldSpan}>Dietary & Health Profile:</Text> Known food allergens, dietary preferences, and optional self-declared medical conditions (e.g., Diabetes, Hypertension).
                  {'\n'}• <Text style={styles.boldSpan}>Geographic Location:</Text> Selected Philippine province & municipality to calibrate regional food pricing and recipe availability.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Data Security & Storage
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  All communication between the MacroSync mobile application and our backend server is encrypted using Transport Layer Security (TLS/HTTPS). User profiles and meal logs are stored in a secure Supabase PostgreSQL database protected by Row Level Security (RLS) policies.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. AI Processing Guardrails
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Chat messages and recipe queries processed through Google Gemini AI are utilized solely to answer your immediate prompt. We do NOT sell, rent, or trade your personal health data to third-party advertisers or insurance providers.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  4. Your Privacy Rights
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Under RA 10173, you have the right to access your stored data, rectify inaccurate records, or request complete account and data deletion at any time via App Settings or by contacting our team.
                </Text>
              </View>
            )}

            {activeTab === 'terms' && (
              <View>
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Acceptance & Eligibility
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  By creating an account, accessing, or continuing to use MacroSync, you agree to abide by these Terms of Service. You affirm that you are at least 18 years of age or possess legal parental/guardian consent.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Voluntary Assumption of Risk
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Nutrition, dieting, and physical workouts carry inherent physical risks. You voluntarily assume full responsibility for any physical activities or dietary alterations undertaken based on app metrics or suggestions.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. Limitation of Liability
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  To the maximum extent permitted by applicable law, MacroSync, its founders, and contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of or inability to use the platform.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  4. Acceptable Conduct & Fair Use
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  You agree to use MacroSync solely for lawful, personal wellness tracking. Automated scraping, reverse-engineering, or abusive misuse of AI chatbot services is strictly prohibited.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.modalFooter, isDarkMode && styles.modalFooterDark]}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <CheckCircle2 color="#FFFFFF" size={18} style={{ marginRight: 6 }} />
              <Text style={styles.doneButtonText}>I Understand & Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 20,
    paddingBottom: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: height * 0.82,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  modalCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#334155',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBarDark: {
    backgroundColor: '#0F172A',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: logoGreen,
    shadowColor: logoGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabItemActiveDark: {
    backgroundColor: logoGreen,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollBody: {
    flexGrow: 1,
    marginBottom: 14,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  alertNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  alertNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 3,
  },
  alertNoticeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#475569',
    marginBottom: 10,
  },
  boldSpan: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  modalFooterDark: {
    borderTopColor: '#334155',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: logoGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
