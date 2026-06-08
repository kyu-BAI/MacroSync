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
  Keyboard
} from 'react-native';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, Send, User } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function ChatbotAIScreen({ onTabChange, userId, userProfile }) {
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
  
  // --- DYNAMIC AI GREETING ---
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hi ${userProfile?.name || 'there'}! I'm your MacroSync AI assistant. Ask me anything about local recipes, adjustments to your meal plan, or your workout routine!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

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

      if (response.ok) {
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

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* HEADER BRANDING SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.appName}>MacroSync</Text>
          <Text style={styles.greeting}>AI Guidance Hub</Text>
          <Text style={styles.subGreeting}>Real-time health assistance synced to your user profile</Text>
        </View>
      </View>

      {/* KEYBOARD WRAPPER JUST FOR THE CONTENT REGION */}
      <KeyboardAvoidingView 
        style={[
          styles.keyboardContainer,
          { marginBottom: keyboardVisible ? 0 : (Platform.OS === 'ios' ? 90 : 80) }
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
                    {msg.text}
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

      {/* --- BOTTOM NAVIGATION BAR --- */}

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
  appName: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: logoGreen, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 2,
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
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  suggestionsWrapper: {
    paddingVertical: 10,
    backgroundColor: baseColor,
  },
  suggestionsScroll: {
    paddingHorizontal: 24,
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: Platform.OS === 'ios' ? 16 : 10,
    marginTop: 6,
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
  navBarOuterEdge: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 84, 
    backgroundColor: baseColor, 
    borderTopWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 0, height: -6 }, 
    shadowOpacity: 0.7, 
    shadowRadius: 10, 
    elevation: 16, 
    paddingHorizontal: 6, 
    paddingBottom: Platform.OS === 'ios' ? 18 : 2,
  },
  navBarContentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: '100%', 
    position: 'relative',
  },
  navTabItem: { 
    flex: 1.1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 6,
  },
  navTabText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#7FA293', 
    marginTop: 4, 
    textAlign: 'center',
  },
  centerCameraContainer: { 
    position: 'relative', 
    width: 68, 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  cameraCircleButton: { 
    width: 62, 
    height: 62, 
    borderRadius: 31, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'absolute', 
    top: -20,
  },
  cameraUnpressed: { 
    backgroundColor: '#4EA685', 
    borderTopWidth: 2, 
    borderLeftWidth: 2, 
    borderTopColor: logoLightHighlight, 
    borderLeftColor: logoLightHighlight, 
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.9, 
    shadowRadius: 8, 
    elevation: 8,
  },
  cameraPressed: { 
    backgroundColor: '#3E836A', 
    borderWidth: 1.5, 
    borderColor: logoDarkShadow, 
    top: -18,
  },
});