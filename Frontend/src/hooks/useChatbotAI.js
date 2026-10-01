import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, Keyboard, Animated, Easing, Text } from "react-native";
import API_URL from "../screens/config/api";

const logoGreen = "#10B981";

export default function useChatbotAI({
  userId,
  userProfile,
  messages = [],
  setMessages,
  onRefreshDashboard,
  onTabChange,
  showAlert,
  language = "English",
}) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showKeyboardMicHint, setShowKeyboardMicHint] = useState(false);
  const hintTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Chat quota tracking state
  const [chatInfo, setChatInfo] = useState({ isPremium: false, remaining: 10 });

  const flatListRef = useRef(null);

  // Screen entrance animations: snappy native slide-up with subtle depth scale
  const containerFade = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.96)).current;
  const containerTranslateY = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerFade, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(containerScale, {
        toValue: 1,
        duration: 250,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }),
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 270,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [containerFade, containerScale, containerTranslateY]);

  // Keyboard show/hide subscriptions
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Fetch initial chat quota status
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
        .catch(
          (err) => __DEV__ && console.log("Chat status fetch error:", err)
        );
    }
  }, [userId]);

  // Dynamic Vita AI Greeting on initial open
  useEffect(() => {
    if (messages.length === 0 && setMessages) {
      const userName = userProfile?.name || userProfile?.full_name || "there";
      let greetingText = `Hi ${userName}! I'm Vita AI, your personal Health, Diet & Fitness Assistant. How can I help you reach your goals today?`;
      if (language === "Tagalog") {
        greetingText = `Kamusta ${userName}! Ako si Vita AI, ang iyong personal na Health, Diet & Fitness Assistant. Paano kita matutulungan na maabot ang iyong mga layunin ngayon?`;
      } else if (language === "Cebuano") {
        greetingText = `Kumusta ${userName}! Ako si Vita AI, ang imong personal nga Health, Diet & Fitness Assistant. Unsaon man tika pagtabang sa pagkab-ot sa imong mga tumong karong adlawa?`;
      }

      setMessages([
        {
          id: 1,
          sender: "ai",
          text: greetingText,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        },
      ]);
    }
  }, [
    messages.length,
    userProfile?.name,
    userProfile?.full_name,
    language,
    setMessages,
  ]);

  // Auto scroll to latest chat message
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [messages]);

  // Trigger keyboard focus to rely on the user's native keyboard mic dictation
  const handleToggleVoiceDictation = useCallback(() => {
    // Focus the text input so the device's native keyboard immediately opens
    inputRef.current?.focus();
    setShowKeyboardMicHint(true);

    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = setTimeout(() => {
      setShowKeyboardMicHint(false);
    }, 4500);
  }, []);

  // Cleanup hint timer on unmount
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  // Send Message Handler
  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === "" || isLoading || !setMessages) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: inputText,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputText;
    setInputText("");
    setShowKeyboardMicHint(false);
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          message: messageToSend,
          user_profile: userProfile || {},
          language: language || "English",
        }),
      });

      const data = await response.json();

      if (
        response.status === 403 ||
        (data && data.detail && data.detail.includes("limit reached"))
      ) {
        setIsLoading(false);
        setChatInfo((prev) => ({ ...prev, remaining: 0 }));
        showAlert?.(
          "Chat Limit Reached",
          "You've reached your daily limit of 10 chatbot messages on the Free Plan. You can continue using MacroSync without the AI chatbot, or upgrade to Premium for unlimited chatbot usage and scans.",
          [
            { text: "Continue on Free Plan", style: "cancel" },
            {
              text: "Upgrade to Premium",
              onPress: () => onTabChange?.("SETTINGS"),
            },
          ]
        );
        return;
      }

      if (response.ok) {
        if (data.remaining_chats !== undefined) {
          setChatInfo({
            isPremium: !!data.is_premium,
            remaining: data.remaining_chats,
          });
        } else if (
          !chatInfo.isPremium &&
          typeof chatInfo.remaining === "number"
        ) {
          setChatInfo((prev) => ({
            ...prev,
            remaining: Math.max(0, prev.remaining - 1),
          }));
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "ai",
            text: data.response,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          },
        ]);

        if (
          data.action_logged ||
          (data.response &&
            (data.response.includes("Auto-Logged") ||
              data.response.includes("Na-log")))
        ) {
          if (onRefreshDashboard) {
            onRefreshDashboard();
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "ai",
            text: `Error: ${data.detail || "Failed to get response from Vita AI."}`,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          },
        ]);
      }
    } catch (error) {
      if (__DEV__) console.log("CHAT ERROR:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: "Sorry, Vita AI is having trouble connecting right now. Please check your connection and try again.",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [
    inputText,
    isLoading,
    setMessages,
    userId,
    userProfile,
    language,
    chatInfo,
    showAlert,
    onTabChange,
    onRefreshDashboard,
  ]);

  // Markdown Bold and Bullet point formatting helper
  const renderMessageText = useCallback((text, isAI = false) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      let isBullet = false;
      let cleanLine = line.replace(/#{1,6}\s*/g, "").trim();

      if (
        cleanLine.trim().startsWith("*") ||
        cleanLine.trim().startsWith("- ")
      ) {
        isBullet = true;
        cleanLine = cleanLine.replace(/^\s*[\*\-]\s*/, "");
      }

      const parts = cleanLine.split("**");
      const textElements = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return (
            <Text key={partIdx} style={{ fontWeight: "800" }}>
              {part}
            </Text>
          );
        }
        const cleanPart = part.replace(/\*/g, "");
        return <Text key={partIdx}>{cleanPart}</Text>;
      });

      return (
        <Text key={lineIdx} style={{ lineHeight: 22, textAlign: "left" }}>
          {isBullet && (
            <Text style={{ color: logoGreen, fontWeight: "900" }}>• </Text>
          )}
          {textElements}
          {lineIdx < lines.length - 1 ? "\n" : ""}
        </Text>
      );
    });
  }, []);

  const handleShowTipsModal = useCallback(() => {
    showAlert?.(
      "Vita AI Guidance & Limits",
      "• Ask tailored questions about your target macros, local Filipino recipes, or zero-equipment home workouts.\n\nNote: On the Free Plan, every message sent deducts 1 count from your 10 daily free messages.",
      [{ text: "Got it!", style: "default" }]
    );
  }, [showAlert]);

  return {
    inputText,
    setInputText,
    isLoading,
    keyboardVisible,
    showKeyboardMicHint,
    setShowKeyboardMicHint,
    isListening: showKeyboardMicHint,
    setIsListening: setShowKeyboardMicHint,
    inputRef,
    chatInfo,
    flatListRef,
    containerFade,
    containerScale,
    containerTranslateY,
    handleToggleVoiceDictation,
    handleSendMessage,
    renderMessageText,
    handleShowTipsModal,
  };
}
