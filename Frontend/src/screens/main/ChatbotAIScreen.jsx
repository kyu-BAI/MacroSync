import React, { useState } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, Send, User } from 'lucide-react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function ChatbotAIScreen({ onTabChange }) {
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [inputText, setInputText] = useState('');
  
  // --- MOCK CONVERSATION HISTORY (Module 4 Profile-Aware Interaction) ---
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hi Kaizer! I'm your MacroSync AI assistant. Based on your onboarding profile, I'm tracking your goal to Gain Weight securely. Ask me anything about local recipes, adjustments to your meal plan, or your workout routine!",
      time: '10:00 AM'
    },
    {
      id: 2,
      sender: 'user',
      text: 'What should I eat if my calories are almost full but I still need more protein today?',
      time: '10:01 AM'
    },
    {
      id: 3,
      sender: 'ai',
      text: 'Since your remaining calorie margin is tight, you should avoid heavy carbs or fats. I suggest sourcing a pure lean protein option available in your local market—like boiled native egg whites or grilled chicken breast without oil. This fulfills your macro target safely without breaching your calorie ceiling!',
      time: '10:02 AM'
    }
  ]);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessages = [
      ...messages,
      {
        id: Date.now(),
        sender: 'user',
        text: inputText,
        time: '10:03 AM'
      }
    ];

    setMessages(newMessages);
    setInputText('');
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
        style={styles.keyboardContainer}
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
        </ScrollView>

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
            >
              <Send color="#FFFFFF" size={16} fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* --- BOTTOM NAVIGATION BAR (100% UNTOUCHED & STATIC AT BASELINE) --- */}
      <View style={styles.navBarOuterEdge}>
        <View style={styles.navBarContentRow}>
          
          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('DASHBOARD')}
          >
            <Home color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('DIET')}
          >
            <UtensilsCrossed color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Diet & Recipes</Text>
          </TouchableOpacity>

          {/* --- SCAN FOOD CENTER CAMERA PROTRUDING BUTTON --- */}
          <View style={styles.centerCameraContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => handlePressIn('camera')}
              onPressOut={handlePressOut}
              style={[
                styles.cameraCircleButton,
                isPressedBtn === 'camera' ? styles.cameraPressed : styles.cameraUnpressed
              ]}
            >
              <Camera color="#FFFFFF" size={28} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('WORKOUT')}
          >
            <SportShoe color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('SETTINGS')}
          >
            <Settings color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Settings</Text>
          </TouchableOpacity>

        </View>
      </View>

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
  chatInputFormCard: {
    backgroundColor: baseColor,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 12,
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