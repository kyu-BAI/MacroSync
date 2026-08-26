import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
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
  ShieldCheck,
  Mic,
  MicOff,
  BotMessageSquare
} from 'lucide-react-native';

import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';
import { getStyles } from './ChatbotAIScreen.styles';
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const logoGreen = '#10B981';

export default function ChatbotAIScreen({ onTabChange, userId, userProfile, messages = [], setMessages }) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleToggleVoiceDictation = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    // Web Speech API — works on Chrome / Expo Web
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart  = () => setIsListening(true);
        recognition.onresult = (evt) => {
          let t = '';
          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            t += evt.results[i][0].transcript;
          }
          if (t) setInputText(t);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend   = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (e) {/* fall through */}
    }

    // Mobile Expo Go fallback — guide user to use keyboard mic
    showAlert(
      '🎙️ Use Your Keyboard Mic',
      'Tap the microphone icon on your phone keyboard (🎤) to speak. Your spoken words will appear in the text box automatically.',
      [{ text: 'Got it!', style: 'cancel' }]
    );
  };

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
      const userName = userProfile?.name || userProfile?.full_name || 'there';
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: `Hi ${userName}! I'm Vita AI, your personal Health, Diet & Fitness Assistant. How can I help you reach your goals today?`,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        }
      ]);
    }
  }, [messages.length, userProfile?.name, userProfile?.full_name]);

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
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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
          message: messageToSend,
          user_profile: userProfile || {}
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
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Error: ${data.detail || "Failed to get response from Vita AI."}`,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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

        {/* CHAT INPUT BAR HUB */}
        <View style={styles.chatInputFormCard}>
          {isListening && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 }} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444', flex: 1 }}>
                🎙️ Listening to your voice... Speak now!
              </Text>
              <TouchableOpacity onPress={() => setIsListening(false)}>
                <X color="#EF4444" size={14} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.chatInputInnerLayoutRow}>
            <TextInput
              style={styles.chatTextInputField}
              placeholder={isListening ? "Listening... speak now..." : "Ask Vita AI about diet, macros, or workouts..."}
              placeholderTextColor={isListening ? "#EF4444" : (isDarkMode ? "#64748B" : "#94A3B8")}
              value={inputText}
              onChangeText={setInputText}
              multiline={true}
            />

            {/* VOICE DICTATION MICROPHONE BUTTON */}
            <TouchableOpacity
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: isListening ? '#EF4444' : (isDarkMode ? '#334155' : '#F1F5F9'),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                borderWidth: 1,
                borderColor: isListening ? '#DC2626' : (isDarkMode ? '#475569' : '#E2E8F0')
              }}
              activeOpacity={0.7}
              onPress={handleToggleVoiceDictation}
            >
              {isListening ? (
                <MicOff color="#FFFFFF" size={17} />
              ) : (
                <Mic color={isDarkMode ? '#F8FAFC' : '#0F172A'} size={17} />
              )}
            </TouchableOpacity>

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
