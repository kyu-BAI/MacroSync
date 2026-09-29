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
  AlertTriangle
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const logoGreen = '#10B981';

export default function PrivacyModal({ visible, onClose, onAgree, initialTab = 'medical' }) {
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
                    <Text style={styles.alertNoticeTitle}>General Wellness Notice</Text>
                    <Text style={styles.alertNoticeText}>
                      MacroSync is a wellness and nutrition tracker, not a clinical diagnostic tool or medical device.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Educational & Wellness Scope
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  All macro targets, calorie estimations, and Vita AI recommendations are generated for educational and general wellness purposes. They do not constitute personalized medical advice, clinical nutrition therapy, or prescription diets.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Pre-Existing Medical Conditions
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  If you have diagnosed health conditions—such as <Text style={styles.boldSpan}>diabetes, chronic kidney or liver disease, heart conditions, eating disorders, or are pregnant/nursing</Text>—you should consult your physician or Registered Dietitian before adopting new diet plans, calorie deficits, or intense exercise.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. Allergen & Food Scanner Notice
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  AI food image scanning and recipe suggestions cannot guarantee 100% allergen detection. Hidden cooking fats, cross-contamination, and restaurant ingredients may not be visible. Always verify foods independently if you have severe allergies.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  4. Medical Emergencies
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  In case of acute symptoms (e.g., chest tightness, dizziness, severe allergic reactions, or diabetic hypoglycemia), stop using the app immediately and contact emergency medical services (911) or proceed to the nearest emergency clinic.
                </Text>
              </View>
            )}

            {activeTab === 'privacy' && (
              <View>
                <View style={[styles.alertNoticeBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                  <ShieldCheck size={18} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertNoticeTitle, { color: '#065F46' }]}>Philippine Data Privacy (RA 10173)</Text>
                    <Text style={[styles.alertNoticeText, { color: '#047857' }]}>
                      MacroSync strictly complies with RA 10173 to safeguard your personal health and nutrition metrics.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Information We Collect
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  We collect account identifiers (username, email), physical metrics (height, weight, fitness goals), declared food allergies, and your Philippine province/city to calibrate regional food availability and pricing.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Security & AI Privacy
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Data transmission is encrypted via HTTPS/TLS, and user records are protected by database row-level security. We do not sell, rent, or monetize your health data with third-party advertisers or insurance companies.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. Your Rights & Account Deletion
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Under RA 10173, you have the right to access, update, or permanently delete your account and all stored health history at any time through <Text style={styles.boldSpan}>Settings → Delete Account</Text>.
                </Text>
              </View>
            )}

            {activeTab === 'terms' && (
              <View>
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Acceptance & Age Requirement
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  By creating an account, you agree to these Terms. You confirm that you are at least 18 years of age or possess legal parental or guardian consent to use MacroSync.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Personal Responsibility & Risk
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Physical training and nutritional changes involve inherent health risks. You voluntarily assume full responsibility for your wellness decisions and workout routines undertaken while using this app.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. Estimation Variance
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Nutritional breakdowns and regional food prices are approximations based on standard nutritional databases and market averages. Actual values may vary depending on local food preparation and vendors.
                </Text>

                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  4. Acceptable Fair Use
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  MacroSync is for personal, lawful wellness tracking. Automated data scraping, reverse-engineering, or abusive activity on AI chatbot services is strictly prohibited.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.modalFooter, isDarkMode && styles.modalFooterDark]}>
            <Text style={[styles.footerNotice, isDarkMode && styles.textMutedDark]}>
              By continuing, you agree to MacroSync policies.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                if (typeof onAgree === 'function') {
                  onAgree();
                }
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Agree & Continue</Text>
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
  footerNotice: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
    lineHeight: 16,
    paddingHorizontal: 8,
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
