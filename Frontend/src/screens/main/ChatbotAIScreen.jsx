import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  Alert
} from 'react-native';
import { 
  Camera, 
  UtensilsCrossed, 
  BotMessageSquare, 
  Home, 
  SportShoe, 
  Settings, 
  Send, 
  User, 
  Sparkles, 
  Zap, 
  Lightbulb, 
  AlertTriangle, 
  X, 
  Info,
  Flame,
  ChefHat,
  ShieldCheck
} from 'lucide-react-native';

import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const CATEGORIZED_SUGGESTIONS = [
  "High-protein meal suggestions",
  "How to hit my daily protein target",
  "Cheap budget recipes under ₱100",
  "15-min zero-equipment home workout",
  "Quick healthy snacks to stop cravings",
];

export default function ChatbotAIScreen({ onTabChange, userId, userProfile, messages = [], setMessages }) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Chat remaining limits tracking state
  const [chatInfo, setChatInfo] = useState({ isPremium: false, remaining: 10 });
  const [showTipsCard, setShowTipsCard] = useState(true);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Fetch initial chat count status on mount
  useEffect(() => {
    if (userId) {
      fetch(`${API_URL}/chat-status/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.remaining !== undefined) {
            setChatInfo({
              isPremium: !!data.is_premium,
              remaining: data.remaining,
            });
          }
        })
        .catch((err) => __DEV__ && console.log("Chat status fetch error:", err));
    }
  }, [userId]);

  // --- DYNAMIC VITA AI GREETING ---
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: `Hi ${userProfile?.name || 'there'}! I'm Vita AI, your personal health & zero-equipment fitness guide. How can I help you reach your target goal weight today?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [messages.length, userProfile?.name]);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  const flatListRef = useRef(null);

  // --- AUTO SCROLL TO LATEST CHAT MESSAGE ON MOUNT & UPDATES ---
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === '' || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          message: messageToSend
        })
      });

      const data = await response.json();

      if (response.status === 403 || (data && data.detail && data.detail.includes("limit reached"))) {
        setIsLoading(false);
        setChatInfo(prev => ({ ...prev, remaining: 0 }));
        showAlert(
          "Chat Limit Reached",
          "You've reached your daily limit of 10 chatbot messages on the Free Plan. You can continue using MacroSync without the AI chatbot, or upgrade to Premium for unlimited chatbot usage and scans.",
          [
            { text: "Continue on Free Plan", style: "cancel" },
            { text: "Upgrade to Premium ✨", onPress: () => onTabChange('SETTINGS') }
          ]
        );
        return;
      }

      if (response.ok) {
        if (data.remaining_chats !== undefined) {
          setChatInfo({
            isPremium: !!data.is_premium,
            remaining: data.remaining_chats
          });
        } else if (!chatInfo.isPremium && typeof chatInfo.remaining === 'number') {
          setChatInfo(prev => ({ ...prev, remaining: Math.max(0, prev.remaining - 1) }));
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: data.response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Error: ${data.detail || "Failed to get response from Vita AI."}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      if (__DEV__) console.log("CHAT ERROR:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: "Sorry, Vita AI is having trouble connecting right now. Please check your connection and try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, userId, chatInfo]);

  // Helper to parse markdown-like bold (**text**) and bullet points
  const renderMessageText = (text, isAI = false) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let isBullet = false;
      let cleanLine = line.replace(/#{1,6}\s*/g, '').trim();

      if (cleanLine.trim().startsWith('*') || cleanLine.trim().startsWith('- ')) {
        isBullet = true;
        cleanLine = cleanLine.replace(/^\s*[\*\-]\s*/, '');
      }

      const parts = cleanLine.split('**');
      const textElements = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return (
            <Text key={partIdx} style={{ fontWeight: '800' }}>
              {part}
            </Text>
          );
        }
        const cleanPart = part.replace(/\*/g, '');
        return <Text key={partIdx}>{cleanPart}</Text>;
      });

      return (
        <Text key={lineIdx} style={{ lineHeight: 22, textAlign: 'left' }}>
          {isBullet && <Text style={{ color: logoGreen, fontWeight: '900' }}>• </Text>}
          {textElements}
          {lineIdx < lines.length - 1 ? '\n' : ''}
        </Text>
      );
    });
  };

  const handleShowTipsModal = () => {
    showAlert(
      "Vita AI Guidance & Limits 💡",
      "• Ask tailored questions about your target macros, local Filipino recipes, or zero-equipment home workouts.\n\n⚠️ Note: On the Free Plan, every message sent deducts 1 count from your 10 daily free messages.",
      [{ text: "Got it!", style: "cancel" }]
    );
  };

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />

      {/* HEADER BRANDING SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <View style={styles.appNameRow}>
            <Text style={styles.appName}>MacroSync</Text>

            {/* REMAINING CHAT COUNT BADGE WITH INFO TRIGGER */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShowTipsModal}
              style={[
                styles.chatBadgePill, 
                chatInfo.isPremium ? styles.premiumBadgePill : (chatInfo.remaining <= 2 ? styles.warningBadgePill : styles.normalBadgePill)
              ]}
            >
              {chatInfo.isPremium ? (
                <Sparkles color="#8B5CF6" size={11} style={{ marginRight: 4 }} />
              ) : (
                <Zap color={chatInfo.remaining <= 2 ? "#EF4444" : "#10B981"} size={11} style={{ marginRight: 4 }} />
              )}
              <Text style={[
                styles.chatBadgeText, 
                chatInfo.isPremium ? styles.premiumBadgeText : (chatInfo.remaining <= 2 ? styles.warningBadgeText : styles.normalBadgeText)
              ]}>
                {chatInfo.isPremium ? "Unlimited Messages ✨" : `${chatInfo.remaining} / 10 Messages Left`}
              </Text>
              <Info color={chatInfo.isPremium ? "#8B5CF6" : (chatInfo.remaining <= 2 ? "#EF4444" : "#10B981")} size={11} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <Text style={styles.greeting}>Vita AI Assistant</Text>
          <Text style={styles.subGreeting}>Real-time nutrition & zero-equipment fitness guidance</Text>
        </View>
      </View>

      {/* KEYBOARD WRAPPER JUST FOR THE CONTENT REGION */}
      <KeyboardAvoidingView
        style={[
          styles.keyboardContainer,
          { marginBottom: keyboardVisible ? 0 : (Platform.OS === 'ios' ? 125 : 115) }
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {/* CHAT MESSAGES — VIRTUALIZED FLATLIST FOR PERFORMANCE */}
        <FlatList
          ref={flatListRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatScrollContent}
          showsVerticalScrollIndicator={false}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: msg }) => {
            const isAI = msg.sender === 'ai';
            return (
              <View
                style={[
                  styles.messageRowFlex,
                  isAI ? styles.messageRowLeft : styles.messageRowRight
                ]}
              >
                {isAI && (
                  <View style={styles.aiIconAvatarNeuBox}>
                    <BotMessageSquare color={logoGreen} size={16} strokeWidth={2.5} />
                  </View>
                )}

                <View
                  style={[
                    styles.chatBubble,
                    isAI ? styles.aiMessageFormCard : styles.userMessageFormCard
                  ]}
                >
                  <Text style={[styles.messageBubbleText, isAI ? styles.aiBubbleText : styles.userBubbleText]}>
                    {renderMessageText(msg.text, isAI)}
                  </Text>
                  <Text style={styles.messageTimeStampText}>
                    {msg.time}
                  </Text>
                </View>

                {!isAI && (
                  <View style={styles.userIconAvatarNeuBox}>
                    <User color="#FFFFFF" size={15} strokeWidth={2.5} />
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            isLoading ? (
              <View style={[styles.messageRowFlex, styles.messageRowLeft]}>
                <View style={styles.aiIconAvatarNeuBox}>
                  <BotMessageSquare color={logoGreen} size={16} strokeWidth={2.5} />
                </View>
                <View style={[styles.chatBubble, styles.aiMessageFormCard, styles.typingIndicatorBubble]}>
                  <ActivityIndicator size="small" color={logoGreen} style={{ marginRight: 8 }} />
                  <Text style={styles.typingIndicatorText}>Vita AI is thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* CATEGORIZED QUICK REPLY SUGGESTION CHIPS */}
        {!isLoading && (
          <View style={styles.suggestionsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {CATEGORIZED_SUGGESTIONS.map((textItem, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => setInputText(textItem)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText}>{textItem}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* CHAT INPUT BAR HUB */}
        <View style={styles.chatInputFormCard}>
          <View style={styles.chatInputInnerLayoutRow}>
            <TextInput
              style={styles.chatTextInputField}
              placeholder="Ask Vita AI about diet, macros, or workouts..."
              placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
              value={inputText}
              onChangeText={setInputText}
              multiline={true}
            />
            <TouchableOpacity
              style={[
                styles.sendActionButton,
                { opacity: inputText.trim() ? 1 : 0.6 }
              ]}
              activeOpacity={0.8}
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send color="#FFFFFF" size={15} fill="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  fullscreenOverlay: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: theme?.background || baseColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 54 : 48,
    marginBottom: 10,
    paddingHorizontal: 24,
    width: '100%',
  },
  headerTextGroup: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  appName: {
    fontSize: 12,
    fontWeight: '900',
    color: logoGreen,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  chatBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  normalBadgePill: {
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
  },
  warningBadgePill: {
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : 'rgba(254, 242, 242, 1)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.35)' : 'rgba(252, 165, 165, 0.8)',
  },
  premiumBadgePill: {
    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : 'rgba(245, 243, 255, 1)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.35)' : 'rgba(221, 214, 254, 0.8)',
  },
  chatBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  normalBadgeText: {
    color: '#10B981',
  },
  warningBadgeText: {
    color: '#EF4444',
  },
  premiumBadgeText: {
    color: '#8B5CF6',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '700',
    color: theme?.textSecondary || '#64748B',
    marginTop: 2,
  },
  keyboardContainer: {
    flex: 1,
    marginBottom: 84,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  chatScrollContent: {
    paddingBottom: 16,
  },
  messageRowFlex: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    width: '100%',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  aiIconAvatarNeuBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  userIconAvatarNeuBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  chatBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '78%',
  },
  aiMessageFormCard: {
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  userMessageFormCard: {
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#E6F4EA',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
  },
  typingIndicatorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  typingIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: logoGreen
  },
  messageBubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiBubbleText: {
    color: theme?.textPrimary || '#0F172A',
    fontWeight: '600',
    textAlign: 'left',
  },
  userBubbleText: {
    color: theme?.textPrimary || '#0F172A',
    fontWeight: '700',
  },
  messageTimeStampText: {
    fontSize: 9,
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '700',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  suggestionsWrapper: {
    paddingVertical: 6,
    backgroundColor: theme?.background || baseColor,
    overflow: 'visible'
  },
  suggestionsScroll: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
    overflow: 'visible',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderWidth: 1.2,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
  },
  suggestionChipText: {
    color: isDarkMode ? '#34D399' : '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  chatInputFormCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 6 : 0,
    marginTop: 5,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  chatInputInnerLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTextInputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
    maxHeight: 60,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});