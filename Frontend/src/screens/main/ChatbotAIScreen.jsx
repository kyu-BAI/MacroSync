import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
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
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, Send, User, Sparkles, Zap, Lightbulb, AlertTriangle, X, Info } from 'lucide-react-native';

import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function ChatbotAIScreen({ onTabChange, userId, userProfile, messages = [], setMessages }) {
  const { showAlert } = useCustomAlert();
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
        .catch((err) => console.log("Chat status fetch error:", err));
    }
  }, [userId]);

  // --- DYNAMIC AI GREETING ---
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: `Hi ${userProfile?.name || 'there'}! I'm your MacroSync AI assistant. Ask me anything about local recipes, adjustments to your meal plan, or your workout routine!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  const handleSendMessage = async () => {
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
            text: `Error: ${data.detail || "Failed to get response from AI."}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.log("CHAT ERROR:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: "Sorry, I am having trouble connecting to the server. Please check your connection and try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse markdown-like bold (**text**) and bullet points (* item)
  const renderMessageText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let isBullet = false;
      let cleanLine = line;

      // Check if the line starts with a bullet point '*'
      if (line.trim().startsWith('*')) {
        isBullet = true;
        // Strip the leading '*' and any spaces following it
        cleanLine = line.replace(/^\s*\*\s*/, '');
      }

      // Split by '**' to find bold text
      const parts = cleanLine.split('**');
      const textElements = parts.map((part, partIdx) => {
        // Odd indices represent text inside '**'
        if (partIdx % 2 === 1) {
          return (
            <Text key={partIdx} style={{ fontWeight: '800' }}>
              {part}
            </Text>
          );
        }
        return <Text key={partIdx}>{part}</Text>;
      });

      return (
        <Text key={lineIdx} style={{ lineHeight: 22 }}>
          {isBullet && <Text style={{ color: logoGreen, fontWeight: '900' }}>• </Text>}
          {textElements}
          {lineIdx < lines.length - 1 ? '\n' : ''}
        </Text>
      );
    });
  };

  const handleShowTipsModal = () => {
    showAlert(
      "AI Chatbot Guidance & Limits 💡",
      "• Ask tailored questions about your macros, local Filipino recipes, or workout routine.\n\n⚠️ Note: On the Free Plan, every message sent deducts 1 count from your 10 daily free messages.",
      [{ text: "Got it!", style: "cancel" }]
    );
  };

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

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
                <Sparkles color="#92400E" size={11} style={{ marginRight: 4 }} />
              ) : (
                <Zap color={chatInfo.remaining <= 2 ? "#C53030" : "#2E7D32"} size={11} style={{ marginRight: 4 }} />
              )}
              <Text style={[
                styles.chatBadgeText, 
                chatInfo.isPremium ? styles.premiumBadgeText : (chatInfo.remaining <= 2 ? styles.warningBadgeText : styles.normalBadgeText)
              ]}>
                {chatInfo.isPremium ? "Unlimited Messages ✨" : `${chatInfo.remaining} / 10 Messages Left`}
              </Text>
              <Info color={chatInfo.isPremium ? "#92400E" : (chatInfo.remaining <= 2 ? "#C53030" : "#2E7D32")} size={11} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <Text style={styles.greeting}>AI Guidance Hub</Text>
          <Text style={styles.subGreeting}>Real-time health assistance synced to your user profile</Text>
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
        {/* CHAT MESSAGES SCROLL AREA */}
        <ScrollView
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatScrollContent}
        >
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <View
                key={msg.id}
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
                    styles.chatMessageFormCard,
                    isAI ? styles.aiMessageFormCard : styles.userMessageFormCard
                  ]}
                >
                  <Text style={[styles.messageBubbleText, isAI ? styles.aiBubbleText : styles.userBubbleText]}>
                    {renderMessageText(msg.text)}
                  </Text>
                  <Text style={styles.messageTimeStampText}>
                    {msg.time}
                  </Text>
                </View>

                {!isAI && (
                  <View style={styles.userIconAvatarNeuBox}>
                    <User color="#FFFFFF" size={16} strokeWidth={2.5} />
                  </View>
                )}
              </View>
            );
          })}

          {/* MOCK TYPING INDICATOR BUBBLE */}
          {isLoading && (
            <View style={[styles.messageRowFlex, styles.messageRowLeft]}>
              <View style={styles.aiIconAvatarNeuBox}>
                <BotMessageSquare color={logoGreen} size={16} strokeWidth={2.5} />
              </View>
              <View style={[styles.chatMessageFormCard, styles.aiMessageFormCard, { paddingVertical: 14, width: 60, alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={logoGreen} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* QUICK REPLY SUGGESTION CHIPS */}
        {!isLoading && (
          <View style={styles.suggestionsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {["What should I eat?", "Am I hitting my protein target?", "Cheap high-protein recipes", "Can I eat fast food today?"].map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => setInputText(chip)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* CHAT INPUT BAR HUB (Slides fluidly when keyboard fires up) */}
        <View style={styles.chatInputFormCard}>
          <View style={styles.chatInputInnerLayoutRow}>
            <TextInput
              style={styles.chatTextInputField}
              placeholder="Ask about diet, meals, or workout..."
              placeholderTextColor="#7FA293"
              value={inputText}
              onChangeText={setInputText}
              multiline={true}
            />
            <TouchableOpacity
              style={styles.sendActionButton}
              activeOpacity={0.8}
              onPress={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send color="#FFFFFF" size={16} fill="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const baseColor = '#F0F4F2';
const clearWhiteHighlight = '#FFFFFF';
const softGreenShadow = '#AEC2B7';
const logoGreen = '#4EA685';
const logoDarkShadow = '#37745D';
const logoLightHighlight = '#65D8AD';

const styles = StyleSheet.create({
  fullscreenOverlay: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: baseColor,
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
    paddingVertical: 3,
    borderRadius: 12,
  },
  normalBadgePill: {
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#C6E6D6',
  },
  warningBadgePill: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  premiumBadgePill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  chatBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  normalBadgeText: {
    color: '#2E7D32',
  },
  warningBadgeText: {
    color: '#C53030',
  },
  premiumBadgeText: {
    color: '#92400E',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#21332A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '700',
    color: '#556B60',
    marginTop: 2,
  },
  keyboardContainer: {
    flex: 1,
    marginBottom: 84, // Explicitly avoids overlapping the static nav bar bounds
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
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  userIconAvatarNeuBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  chatMessageFormCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '75%',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  aiMessageFormCard: {
    backgroundColor: baseColor,
    borderTopLeftRadius: 4,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  userMessageFormCard: {
    backgroundColor: '#E2ECE7',
    borderTopRightRadius: 4,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  messageBubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiBubbleText: {
    color: '#21332A',
    fontWeight: '600',
  },
  userBubbleText: {
    color: '#1A2B23',
    fontWeight: '700',
  },
  messageTimeStampText: {
    fontSize: 9,
    color: '#7FA293',
    fontWeight: '700',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  visualTipsCard: {
    marginHorizontal: 20,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#4EA685',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E1E9E5',
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipsIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  tipsCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2E26',
    flex: 1,
  },
  closeTipsBtn: {
    padding: 4,
  },
  tipsBulletPoint: {
    fontSize: 11,
    color: '#556B60',
    lineHeight: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  warningAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#9B2C2C',
    lineHeight: 14,
    fontWeight: '600',
  },
  suggestionsWrapper: {
    paddingVertical: 6,
    backgroundColor: baseColor,
    overflow: 'visible'
  },
  suggestionsScroll: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
    overflow: 'visible',
  },
  suggestionChip: {
    backgroundColor: baseColor,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  suggestionChipText: {
    color: '#41544B',
    fontSize: 13,
    fontWeight: '600',
  },
  chatInputFormCard: {
    backgroundColor: baseColor,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 6 : 0,
    marginTop: 5,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
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
    color: '#21332A',
    maxHeight: 60,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
});