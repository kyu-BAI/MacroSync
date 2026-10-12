import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Animated } from "react-native";
import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../screens/config/api";

export default function useFoodScanner({
  userId,
  userProfile,
  dailyNutrition,
  onLogMeal,
  onTabChange,
  showAlert,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState("off");
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState("Lunch");
  const [portionScale, setPortionScale] = useState(1.0);
  const [customGramsInput, setCustomGramsInput] = useState("");
  const [customSugarInput, setCustomSugarInput] = useState("");
  const [customSodiumInput, setCustomSodiumInput] = useState("");
  const [isCustomSugarEdited, setIsCustomSugarEdited] = useState(false);
  const [isCustomSodiumEdited, setIsCustomSodiumEdited] = useState(false);

  // Scan limits tracking state
  const [scanInfo, setScanInfo] = useState({ isPremium: false, remaining: 5 });
  const [showTipsCard, setShowTipsCard] = useState(false);

  const cameraRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Check persistent scan tips dismissal preference on mount
  useEffect(() => {
    AsyncStorage.getItem("@has_dismissed_scan_tips")
      .then((val) => {
        if (val !== "true") {
          setShowTipsCard(true); // Open only for first-time users
        }
      })
      .catch(() => {});
  }, []);

  const handleDismissTipsCard = useCallback(async () => {
    setShowTipsCard(false);
    try {
      await AsyncStorage.setItem("@has_dismissed_scan_tips", "true");
    } catch (e) {}
  }, []);

  // Auto-detect meal type based on current time of day when scan completes
  useEffect(() => {
    if (analysisResult) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setSelectedMealType("Breakfast");
      else if (hour >= 11 && hour < 16) setSelectedMealType("Lunch");
      else if (hour >= 16 && hour < 18) setSelectedMealType("Snack");
      else setSelectedMealType("Dinner");
      setPortionScale(1.0);
      const baseGrams = analysisResult.serving_weight_g || 100;
      setCustomGramsInput(baseGrams.toString());

      const baseSugar =
        analysisResult.sugar_g !== undefined
          ? Number(analysisResult.sugar_g)
          : Math.max(0, Math.round((analysisResult.carbs || 0) * 0.2));
      const baseSodium =
        analysisResult.sodium_mg !== undefined
          ? Number(analysisResult.sodium_mg)
          : 250;
      setCustomSugarInput(baseSugar.toString());
      setCustomSodiumInput(baseSodium.toString());
      setIsCustomSugarEdited(false);
      setIsCustomSodiumEdited(false);
    }
  }, [analysisResult]);

  // Fetch initial scan count status on mount
  useEffect(() => {
    if (userId) {
      fetch(`${API_URL}/scan-status/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.remaining !== undefined) {
            setScanInfo({
              isPremium: !!data.is_premium,
              remaining: data.remaining,
            });
          }
        })
        .catch((err) => __DEV__ && console.log("Scan status fetch error:", err));
    }
  }, [userId]);

  // Scanning Animation
  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 278, // Height of the box minus the line thickness
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim, scanLineAnim]);

  const stopPulseAnimation = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    scanLineAnim.stopAnimation();
    scanLineAnim.setValue(0);
  }, [pulseAnim, scanLineAnim]);

  // Camera Capture Handler
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);
    startPulseAnimation();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        base64: true,
        exif: false,
        skipProcessing: true,
      });

      if (!photo || !photo.uri) {
        setIsScanning(false);
        stopPulseAnimation();
        setCapturedImage(null);
        showAlert?.("Camera Error", "Failed to capture photo. Please try again.");
        return;
      }

      const formattedUri =
        photo.uri.startsWith("file://") ||
        photo.uri.startsWith("content://") ||
        photo.uri.startsWith("data:")
          ? photo.uri
          : `file://${photo.uri}`;

      setCapturedImage(formattedUri);

      let base64Data = photo.base64 || "";
      if (!base64Data && photo.uri) {
        try {
          base64Data = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (fsErr) {
          if (__DEV__) console.log("FileSystem read error:", fsErr);
        }
      }

      if (!base64Data || base64Data.length < 100) {
        setIsScanning(false);
        stopPulseAnimation();
        setCapturedImage(null);
        showAlert?.(
          "Camera Not Ready",
          "The camera captured a blank image. Please wait a moment and try again."
        );
        return;
      }

      const response = await fetch(`${API_URL}/analyze-food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: base64Data,
          user_id: userId || "",
        }),
      });

      const data = await response.json();

      setIsScanning(false);
      stopPulseAnimation();

      if (
        response.status === 403 ||
        (data && data.detail && data.detail.includes("limit reached"))
      ) {
        setCapturedImage(null);
        setScanInfo((prev) => ({ ...prev, remaining: 0 }));
        showAlert?.(
          "Scan Limit Reached",
          "You've reached your daily limit of 5 scans on the Free Plan. You can continue using MacroSync without AI food scanning, or upgrade to Premium for unlimited scans and chatbot access.",
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
        if (data.remaining_scans !== undefined) {
          setScanInfo({
            isPremium: !!data.is_premium,
            remaining: data.remaining_scans,
          });
        } else if (!scanInfo.isPremium && typeof scanInfo.remaining === "number") {
          setScanInfo((prev) => ({
            ...prev,
            remaining: Math.max(0, prev.remaining - 1),
          }));
        }

        if (data.error) {
          const errStr = data.error.toLowerCase();
          const isNotFood =
            errStr.includes("no food") ||
            errStr.includes("not food") ||
            errStr.includes("edible") ||
            errStr.includes("inedible");
          const isBusy =
            errStr.includes("busy") ||
            errStr.includes("quota") ||
            errStr.includes("temporarily");

          let alertTitle = "Scan Error";
          if (isNotFood) alertTitle = "No Edible Food Detected";
          else if (isBusy) alertTitle = "AI Service Busy";

          showAlert?.(alertTitle, data.error);
          setCapturedImage(null);
        } else {
          setAnalysisResult(data);
        }
      } else {
        showAlert?.(
          "Analysis Error",
          data.detail || "Failed to analyze food. Please try again."
        );
        setCapturedImage(null);
      }
    } catch (error) {
      setIsScanning(false);
      stopPulseAnimation();
      if (__DEV__) console.error("Scanning Error:", error);
      showAlert?.("Analysis Error", "Cannot connect to server. Check your network.");
      setCapturedImage(null);
    }
  }, [
    isScanning,
    startPulseAnimation,
    stopPulseAnimation,
    userId,
    scanInfo.isPremium,
    scanInfo.remaining,
    showAlert,
    onTabChange,
  ]);

  // Gallery Upload Handler
  const handleUploadImage = useCallback(async () => {
    if (isScanning) return;

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert?.(
          "Permission Denied",
          "You need to allow gallery access to select an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const imageUri =
          selectedAsset.uri ||
          (selectedAsset.base64
            ? `data:image/jpeg;base64,${selectedAsset.base64}`
            : null);
        setCapturedImage(imageUri);
        setIsScanning(true);
        startPulseAnimation();

        let cleanBase64 = selectedAsset.base64 || "";
        if (!cleanBase64 && selectedAsset.uri) {
          try {
            cleanBase64 = await FileSystem.readAsStringAsync(selectedAsset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (fsErr) {
            __DEV__ && console.log("FileSystem read error:", fsErr);
          }
        }
        if (cleanBase64.includes(",")) {
          cleanBase64 = cleanBase64.split(",")[1];
        }

        if (!cleanBase64 || cleanBase64.length < 100) {
          setIsScanning(false);
          stopPulseAnimation();
          setCapturedImage(null);
          showAlert?.(
            "Image Error",
            "Could not read image file. Please choose another image or take a fresh photo."
          );
          return;
        }

        const response = await fetch(`${API_URL}/analyze-food`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_base64: cleanBase64,
            user_id: userId || "",
          }),
        });

        const data = await response.json();

        setIsScanning(false);
        stopPulseAnimation();

        if (
          response.status === 403 ||
          (data && data.detail && data.detail.includes("limit reached"))
        ) {
          setCapturedImage(null);
          setScanInfo((prev) => ({ ...prev, remaining: 0 }));
          showAlert?.(
            "Scan Limit Reached",
            "You've reached your daily limit of 5 scans on the Free Plan. You can continue using MacroSync without AI food scanning, or upgrade to Premium for unlimited scans and chatbot access.",
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
          if (data.remaining_scans !== undefined) {
            setScanInfo({
              isPremium: !!data.is_premium,
              remaining: data.remaining_scans,
            });
          } else if (!scanInfo.isPremium && typeof scanInfo.remaining === "number") {
            setScanInfo((prev) => ({
              ...prev,
              remaining: Math.max(0, prev.remaining - 1),
            }));
          }

          if (data.error) {
            const errStr = data.error.toLowerCase();
            const isNotFood =
              errStr.includes("no food") ||
              errStr.includes("not food") ||
              errStr.includes("edible") ||
              errStr.includes("inedible");
            const isBusy =
              errStr.includes("busy") ||
              errStr.includes("quota") ||
              errStr.includes("temporarily");

            let alertTitle = "Scan Error";
            if (isNotFood) alertTitle = "No Edible Food Detected";
            else if (isBusy) alertTitle = "AI Service Busy";

            showAlert?.(alertTitle, data.error);
            setCapturedImage(null);
          } else {
            setAnalysisResult(data);
          }
        } else {
          showAlert?.(
            "Analysis Error",
            data.detail || "Failed to analyze food. Please try again."
          );
          setCapturedImage(null);
        }
      }
    } catch (error) {
      setIsScanning(false);
      stopPulseAnimation();
      if (__DEV__) console.error("Gallery Upload Error:", error);
      showAlert?.("Upload Error", "Failed to choose image from gallery.");
      setCapturedImage(null);
    }
  }, [
    isScanning,
    startPulseAnimation,
    stopPulseAnimation,
    userId,
    scanInfo.isPremium,
    scanInfo.remaining,
    showAlert,
    onTabChange,
  ]);

  const resetScan = useCallback(() => {
    setAnalysisResult(null);
    setCapturedImage(null);
    setIsScanning(false);
    setPortionScale(1.0);
    setCustomGramsInput("");
    setCustomSugarInput("");
    setCustomSodiumInput("");
    setIsCustomSugarEdited(false);
    setIsCustomSodiumEdited(false);
  }, []);

  // Portion Scaling calculations
  const baseWeightGrams = analysisResult?.serving_weight_g || 100;
  const currentGrams =
    parseFloat(customGramsInput) || baseWeightGrams * portionScale;
  const effectiveScale =
    baseWeightGrams > 0 ? currentGrams / baseWeightGrams : portionScale;

  const scaledCalories = Math.round(
    (analysisResult?.calories || 0) * effectiveScale
  );
  const scaledProtein = Math.round(
    (analysisResult?.protein || 0) * effectiveScale
  );
  const scaledCarbs = Math.round((analysisResult?.carbs || 0) * effectiveScale);
  const scaledFats = Math.round((analysisResult?.fats || 0) * effectiveScale);
  const scaledWeight = Math.round(currentGrams);

  // Sugar and Salt (Sodium) metrics grounded to WHO & AHA benchmarks
  const rawSugar =
    analysisResult?.sugar_g !== undefined
      ? Number(analysisResult.sugar_g)
      : Math.max(0, Math.round((analysisResult?.carbs || 0) * 0.2));
  const rawSodium =
    analysisResult?.sodium_mg !== undefined
      ? Number(analysisResult.sodium_mg)
      : 250;

  // Default portion-scaled metrics
  const defaultScaledSugar = Math.round(rawSugar * effectiveScale * 10) / 10;
  const defaultScaledSodium = Math.round(rawSodium * effectiveScale);

  // Keep unedited inputs automatically aligned when portion scaling changes
  useEffect(() => {
    if (!isCustomSugarEdited && analysisResult) {
      setCustomSugarInput(defaultScaledSugar.toString());
    }
  }, [defaultScaledSugar, isCustomSugarEdited, analysisResult]);

  useEffect(() => {
    if (!isCustomSodiumEdited && analysisResult) {
      setCustomSodiumInput(defaultScaledSodium.toString());
    }
  }, [defaultScaledSodium, isCustomSodiumEdited, analysisResult]);

  // Active user-adjusted or portion-scaled values
  const scaledSugar = isCustomSugarEdited
    ? customSugarInput === ""
      ? 0
      : parseFloat(customSugarInput) || 0
    : defaultScaledSugar;

  const scaledSodium = isCustomSodiumEdited
    ? customSodiumInput === ""
      ? 0
      : parseInt(customSodiumInput, 10) || 0
    : defaultScaledSodium;

  // Real-time clinical benchmark levels (WHO & AHA standards)
  const sugarLevel =
    scaledSugar <= 5 ? "Low" : scaledSugar <= 15 ? "Moderate" : "High";
  const saltLevel =
    scaledSodium <= 140 ? "Low" : scaledSodium <= 400 ? "Moderate" : "High";

  // Dynamic clinical alerts based on real-time adjusted values (including excessive warnings)
  const healthAlerts = [];
  if (scaledSugar > 25) {
    healthAlerts.push(
      `Excessive Sugar Warning (${scaledSugar}g): Exceeds WHO 25g daily added sugar limit in a single dish! May cause extreme glycemic spike and fatigue.`
    );
  } else if (scaledSugar > 15) {
    healthAlerts.push(
      `Elevated Sugar (${scaledSugar}g): Exceeds single-meal 15g threshold. Pair with fiber or protein to stabilize blood glucose.`
    );
  }

  if (scaledSodium > 800) {
    healthAlerts.push(
      `Excessive Salt / Sodium Warning (${scaledSodium}mg): High cardiovascular risk (>40% of daily 2,000mg limit in one meal). May cause rapid blood pressure surge and fluid retention.`
    );
  } else if (scaledSodium > 400) {
    healthAlerts.push(
      `High Sodium (${scaledSodium}mg): Exceeds 400mg per-serving guideline. Drink extra water and balance with potassium-rich greens.`
    );
  }

  if (healthAlerts.length === 0) {
    // No warnings when sugar and salt are within normal/moderate thresholds
  }

  // Handlers for user editing sugar and sodium
  const handleUpdateSugar = useCallback((text) => {
    const sanitized = text.replace(/[^0-9.]/g, "");
    setCustomSugarInput(sanitized);
    setIsCustomSugarEdited(true);
  }, []);

  const handleUpdateSodium = useCallback((text) => {
    const sanitized = text.replace(/[^0-9]/g, "");
    setCustomSodiumInput(sanitized);
    setIsCustomSodiumEdited(true);
  }, []);

  const handleResetSugarSalt = useCallback(() => {
    setCustomSugarInput(defaultScaledSugar.toString());
    setCustomSodiumInput(defaultScaledSodium.toString());
    setIsCustomSugarEdited(false);
    setIsCustomSodiumEdited(false);
  }, [defaultScaledSugar, defaultScaledSodium]);

  const handleStepGrams = useCallback(
    (delta) => {
      const nextGrams = Math.max(10, Math.round(currentGrams + delta));
      setCustomGramsInput(nextGrams.toString());
    },
    [currentGrams]
  );

  const handleMultiplierPress = useCallback(
    (scale) => {
      setPortionScale(scale);
      const newGrams = Math.round(baseWeightGrams * scale);
      setCustomGramsInput(newGrams.toString());
    },
    [baseWeightGrams]
  );

  const handleLogFood = useCallback(() => {
    if (!analysisResult) return;

    const currentConsumed = dailyNutrition?.consumedCalories || 0;
    const targetCalories = dailyNutrition?.targetCalories || 2500;
    const newTotal = currentConsumed + scaledCalories;
    const excess = newTotal - targetCalories;

    const performLog = () => {
      if (onLogMeal && analysisResult) {
        const displayWeight = scaledWeight ? ` (${scaledWeight}g)` : "";
        const mealItem = {
          id: `scan-${Date.now()}`,
          name: `${analysisResult.name}${displayWeight}`,
          rawName: analysisResult.name,
          calories: scaledCalories,
          protein: scaledProtein,
          carbs: scaledCarbs,
          fats: scaledFats,
          sugar_g: scaledSugar,
          sodium_mg: scaledSodium,
          mealType: selectedMealType,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        onLogMeal(mealItem);
      }
      onTabChange?.("DASHBOARD");
    };

    if (excess > 0) {
      showAlert?.(
        "Calorie Target Exceeded",
        `Logging this meal (${scaledCalories} kcal) will put you ${excess} kcal over your daily target of ${targetCalories} kcal.\n\nDo you still want to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed & Log", style: "destructive", onPress: performLog },
        ]
      );
    } else {
      performLog();
    }
  }, [
    analysisResult,
    dailyNutrition?.consumedCalories,
    dailyNutrition?.targetCalories,
    scaledCalories,
    scaledProtein,
    scaledCarbs,
    scaledFats,
    scaledWeight,
    scaledSugar,
    scaledSodium,
    selectedMealType,
    onLogMeal,
    onTabChange,
    showAlert,
  ]);

  return {
    permission,
    requestPermission,
    flashMode,
    setFlashMode,
    isScanning,
    analysisResult,
    capturedImage,
    selectedMealType,
    setSelectedMealType,
    portionScale,
    customGramsInput,
    setCustomGramsInput,
    customSugarInput,
    customSodiumInput,
    isCustomSugarEdited,
    isCustomSodiumEdited,
    handleUpdateSugar,
    handleUpdateSodium,
    handleResetSugarSalt,
    scanInfo,
    showTipsCard,
    setShowTipsCard,
    handleDismissTipsCard,
    cameraRef,
    pulseAnim,
    scanLineAnim,
    handleCapture,
    handleUploadImage,
    resetScan,
    baseWeightGrams,
    currentGrams,
    effectiveScale,
    scaledCalories,
    scaledProtein,
    scaledCarbs,
    scaledFats,
    scaledWeight,
    scaledSugar,
    scaledSodium,
    sugarLevel,
    saltLevel,
    healthAlerts,
    handleStepGrams,
    handleMultiplierPress,
    handleLogFood,
  };
}
