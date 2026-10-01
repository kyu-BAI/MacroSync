import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  HeartPulse,
  Lock,
  Scale,
  AlertTriangle,
  PhoneCall,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const logoGreen = '#10B981';

export default function PrivacyModal({ visible, onClose, onAgree, initialTab = 'medical' }) {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Synchronize active tab when modal opens
  useEffect(() => {
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
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconBadge}>
              <ShieldAlert color={logoGreen} size={20} strokeWidth={2.4} />
            </View>
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>
                Legal & Health Disclaimers
              </Text>
              <Text style={styles.headerSubtitle}>
                MacroSync Policies & Medical Disclaimers
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, isDarkMode && styles.closeButtonDark]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={isDarkMode ? '#CBD5E1' : '#64748B'} size={18} />
            </TouchableOpacity>
          </View>

          {/* Segmented Navigation Tab Bar (Equally spaced, no overlap) */}
          <View style={[styles.tabBar, isDarkMode && styles.tabBarDark]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'medical' && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab('medical')}
              activeOpacity={0.8}
            >
              <HeartPulse
                size={14}
                color={activeTab === 'medical' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                style={styles.tabIconMargin}
              />
              <Text
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
              ]}
              onPress={() => setActiveTab('privacy')}
              activeOpacity={0.8}
            >
              <Lock
                size={14}
                color={activeTab === 'privacy' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                style={styles.tabIconMargin}
              />
              <Text
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
              ]}
              onPress={() => setActiveTab('terms')}
              activeOpacity={0.8}
            >
              <Scale
                size={14}
                color={activeTab === 'terms' ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                style={styles.tabIconMargin}
              />
              <Text
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

          {/* Scrollable Content Body (Pure Editorial Clean Layout, No Inner Box Containers) */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ============================================================ */}
            {/* --- MEDICAL TAB CONTENT --- */}
            {/* ============================================================ */}
            {activeTab === 'medical' && (
              <View>
                {/* Clinical Notice Banner */}
                <View style={styles.alertNoticeBox}>
                  <AlertTriangle size={18} color="#D97706" style={styles.alertIconMargin} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertNoticeTitle}>Non-Diagnostic Wellness Tool</Text>
                    <Text style={styles.alertNoticeText}>
                      MacroSync is an educational wellness and nutrition tracker. It is not a licensed medical device and does not provide clinical diagnoses, medical therapy, or prescription diets.
                    </Text>
                  </View>
                </View>

                {/* Section 1 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Educational & Wellness Scope
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  All caloric estimates, macronutrient targets, and Vita AI recommendations are generated strictly for general wellness and educational purposes using standard scientific formulas (such as Mifflin-St Jeor and WHO Dietary Guidelines). They do not constitute personalized medical advice or prescription clinical nutrition plans.
                </Text>

                {/* Section 2 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Pre-Existing Conditions & Screening
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  If you have diagnosed health conditions—including <Text style={[styles.boldSpan, isDarkMode && styles.textWhite]}>diabetes, kidney or liver disease, cardiac issues, eating disorders, or are pregnant or nursing</Text>—you must consult your physician or a Registered Nutritionist-Dietitian (RND) before undertaking calorie deficits, fasting, or intense fitness regimens.
                </Text>

                {/* Section 3 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. AI Food Scanner & Allergen Notice
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  AI camera scanning and recipe suggestions cannot guarantee 100% allergen detection. Hidden restaurant oils, shared preparation fryers, and microscopic trace ingredients cannot be visually detected. Always independently verify foods if you have severe or life-threatening food allergies (anaphylaxis).
                </Text>

                {/* Section 4 */}
                <Text style={[styles.sectionHeading, { color: '#DC2626' }]}>
                  4. Emergency Medical Protocol
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  If you experience acute distress—such as chest tightness, severe dizziness, hypoglycemia, or allergic reactions—stop using the app immediately and contact emergency medical services via the Philippine Emergency Hotline (<Text style={styles.boldRedSpan}>911</Text>) or the Philippine Red Cross (<Text style={styles.boldRedSpan}>143</Text>).
                </Text>
              </View>
            )}

            {/* ============================================================ */}
            {/* --- PRIVACY TAB CONTENT (RA 10173) --- */}
            {/* ============================================================ */}
            {activeTab === 'privacy' && (
              <View>
                {/* Philippine Data Privacy Banner */}
                <View style={[styles.alertNoticeBox, styles.privacyNoticeBox]}>
                  <ShieldCheck size={18} color="#10B981" style={styles.alertIconMargin} />
                  <View style={styles.alertContent}>
                    <Text style={[styles.alertNoticeTitle, { color: '#065F46' }]}>
                      Philippine Data Privacy Act (RA 10173)
                    </Text>
                    <Text style={[styles.alertNoticeText, { color: '#047857' }]}>
                      MacroSync complies with RA 10173 and National Privacy Commission (NPC) circulars to safeguard your personal health and nutrition biometrics.
                    </Text>
                  </View>
                </View>

                {/* Section 1 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Information We Collect
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  We collect account identifiers (username, email), physical biometrics (height, weight, activity profile, targets), declared food allergies, and your Philippine province/city to calibrate regional food availability and pricing.
                </Text>

                {/* Section 2 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Security & Zero-Monetization Policy
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  All network communication is encrypted via HTTPS / TLS 1.3 in transit. Stored data is protected by Database Row-Level Security (RLS). <Text style={[styles.boldSpan, isDarkMode && styles.textWhite]}>MacroSync never sells, rents, or licenses your personal health data to insurance firms, third-party advertisers, or data brokers.</Text>
                </Text>

                {/* Section 3 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. Your Rights as a Data Subject
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Under RA 10173 Section 16, you hold the:
                </Text>
                <Text style={[styles.bulletItem, isDarkMode && styles.textMutedDark]}>
                  • <Text style={[styles.boldSpan, isDarkMode && styles.textWhite]}>Right to Access & Rectify:</Text> View and update your profile anytime.
                </Text>
                <Text style={[styles.bulletItem, isDarkMode && styles.textMutedDark]}>
                  • <Text style={[styles.boldSpan, isDarkMode && styles.textWhite]}>Right to Erasure / Deletion:</Text> Permanently purge your account and all associated metrics instantly via <Text style={[styles.boldSpan, isDarkMode && styles.textWhite]}>Settings → Delete Account</Text>.
                </Text>
                <Text style={[styles.bulletItem, isDarkMode && styles.textMutedDark]}>
                  • <Text style={[styles.boldSpan, isDarkMode && styles.textWhite]}>Right to Object:</Text> Withdraw consent and export your nutrition data.
                </Text>
              </View>
            )}

            {/* ============================================================ */}
            {/* --- TERMS TAB CONTENT --- */}
            {/* ============================================================ */}
            {activeTab === 'terms' && (
              <View>
                {/* Section 1 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  1. Acceptance & Age Eligibility
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  By creating an account or continuing to use MacroSync, you agree to be bound by these Terms of Service. You affirm that you are at least 18 years of age or possess legal parental/guardian consent to use this wellness platform.
                </Text>

                {/* Section 2 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  2. Voluntary Assumption of Physical Risk
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Dietary adjustments, caloric deficits, and workout programs carry inherent physiological risks. You voluntarily assume full responsibility for your wellness decisions, exercise execution, and dietary choices made while using MacroSync.
                </Text>

                {/* Section 3 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  3. Estimation & Regional Pricing Variance
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  Nutritional values and regional wet market (palengke) food prices are estimates based on standard databases and municipal market averages. Actual prices, portion weights, and nutritional content may fluctuate across local vendors and seasonal harvest cycles.
                </Text>

                {/* Section 4 */}
                <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
                  4. Acceptable Fair Use & IP Protection
                </Text>
                <Text style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
                  MacroSync is granted for personal, non-commercial health tracking. Automated data scraping, reverse-engineering of calculation algorithms, or abusive requests targeting our AI services are strictly prohibited.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer with Explicit Acceptance Action */}
          <View style={[styles.modalFooter, isDarkMode && styles.modalFooterDark]}>
            <Text style={[styles.footerNotice, isDarkMode && styles.textMutedDark]}>
              By continuing, you accept MacroSync's terms and disclaimers.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                if (typeof onAgree === 'function') {
                  onAgree();
                }
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>Agree & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// --- COMPONENT STYLES ---
// ============================================================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 20,
    paddingBottom: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  modalCardDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#1E293B',
  },

  // Segmented Tab Bar: 3 equal tabs, zero overlap
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBarDark: {
    backgroundColor: '#1E293B',
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
  },
  tabIconMargin: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Scroll Content Area
  scrollBody: {
    flexGrow: 1,
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Alert Notice Banner
  alertNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  alertIconMargin: {
    marginTop: 2,
    marginRight: 8,
  },
  alertContent: {
    flex: 1,
  },
  alertNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 2,
  },
  alertNoticeText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 16.5,
  },
  privacyNoticeBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },

  // Pure Editorial Clean Typography (No Box Containers)
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 5,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#475569',
    marginBottom: 10,
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    marginBottom: 6,
    paddingLeft: 4,
  },
  boldSpan: {
    fontWeight: '700',
    color: '#0F172A',
  },
  boldRedSpan: {
    fontWeight: '800',
    color: '#DC2626',
  },

  // Modal Footer
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  modalFooterDark: {
    borderTopColor: '#1E293B',
  },
  footerNotice: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    lineHeight: 15,
    paddingHorizontal: 4,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    height: 48,
    borderRadius: 14,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
