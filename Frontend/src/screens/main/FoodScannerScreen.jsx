import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  ActivityIndicator,
  Animated,
  StatusBar,
  Image,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, ZapOff, CheckCircle2, Scan, ChevronRight, Utensils, Upload, Sparkles, Lightbulb, AlertTriangle, History, PlusCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// High-Contrast System Theme Setup Tokens
const logoGreen = '#10B981';
const baseColor = '#F8FAFC';

export default function FoodScannerScreen({ onTabChange, onLogMeal, userId, userProfile, dailyNutrition }) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState('off');
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('Lunch');
  const [portionScale, setPortionScale] = useState(1.0);
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load persistent scan history from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('ms_scan_history')
      .then((data) => {
        if (data) {
          try { setScanHistory(JSON.parse(data)); } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  const saveToHistory = async (mealItem) => {
    try {
      const updated = [mealItem, ...scanHistory.filter(h => h.name !== mealItem.name)].slice(0, 10);
      setScanHistory(updated);
      await AsyncStorage.setItem('ms_scan_history', JSON.stringify(updated));
    } catch (err) {
      if (__DEV__) console.warn("Failed to save scan history:", err);
    }
  };

  const handleRelogHistoryItem = (item) => {
    const currentConsumed = dailyNutrition?.consumedCalories || 0;
    const targetCalories = dailyNutrition?.targetCalories || 2500;
    const mealCalories = item.calories || 0;
    const newTotal = currentConsumed + mealCalories;
    const excess = newTotal - targetCalories;

    const performRelog = () => {
      if (onLogMeal) {
        onLogMeal({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fats: item.fats,
          mealType: item.mealType || 'Lunch'
        });
        showAlert('⚡ Meal Logged!', `Successfully re-logged "${item.rawName || item.name}" without consuming scan quota.`);
      }
    };

    if (excess > 0) {
      showAlert(
        "Calorie Target Exceeded ⚠️",
        `Logging this meal (${mealCalories} kcal) will put you ${excess} kcal over your daily target of ${targetCalories} kcal.\n\nDo you still want to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed & Log", style: "destructive", onPress: performRelog }
        ]
      );
    } else {
      performRelog();
    }
  };
  
  // Scan limits tracking state
  const [scanInfo, setScanInfo] = useState({ isPremium: false, remaining: 5 });
  const [showTipsCard, setShowTipsCard] = useState(false);

  // Check persistent scan tips dismissal preference on mount
  useEffect(() => {
    AsyncStorage.getItem('@has_dismissed_scan_tips')
      .then((val) => {
        if (val !== 'true') {
          setShowTipsCard(true); // Open only for first-time users
        }
      })
      .catch(() => {});
  }, []);

  const handleDismissTipsCard = async () => {
    setShowTipsCard(false);
    try {
      await AsyncStorage.setItem('@has_dismissed_scan_tips', 'true');
    } catch (e) {}
  };

  // Auto-detect meal type based on current time of day when scan completes
  useEffect(() => {
    if (analysisResult) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setSelectedMealType('Breakfast');
      else if (hour >= 11 && hour < 16) setSelectedMealType('Lunch');
      else if (hour >= 16 && hour < 18) setSelectedMealType('Snack');
      else setSelectedMealType('Dinner');
      setPortionScale(1.0);
    }
  }, [analysisResult]);

  const cameraRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

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

  // Handle Permissions
  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Loading camera permissions...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Utensils color={logoGreen} size={48} style={{ marginBottom: 20 }} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>We need access to your camera to scan food and analyze macronutrients.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButtonAbsolute} onPress={() => onTabChange('DASHBOARD')}>
          <X color="#333" size={24} />
        </TouchableOpacity>
      </View>
    );
  }

  // Scanning Animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 278, // Height of the box minus the line thickness
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    scanLineAnim.stopAnimation();
    scanLineAnim.setValue(0);
  };

  // Bottom Sheet Animation
  const openBottomSheet = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Actions
  const handleCapture = async () => {
    if (!cameraRef.current || isScanning) return;
    
    setIsScanning(true);
    startPulseAnimation();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: true,
      });

      // Freeze the camera preview AFTER the photo is taken (not before — would break capture)
      if (cameraRef.current && cameraRef.current.pausePreview) {
        try { cameraRef.current.pausePreview(); } catch (e) {}
      }

      setCapturedImage(photo.uri);

      const response = await fetch(`${API_URL}/analyze-food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_base64: photo.base64,
          user_id: userId
        })
      });

      const data = await response.json();

      setIsScanning(false);
      stopPulseAnimation();

      if (response.status === 403 || (data && data.detail && data.detail.includes("limit reached"))) {
        setCapturedImage(null);
        if (cameraRef.current && cameraRef.current.resumePreview) {
          try { cameraRef.current.resumePreview(); } catch (e) {}
        }
        setScanInfo(prev => ({ ...prev, remaining: 0 }));
        showAlert(
          "Scan Limit Reached",
          "You've reached your daily limit of 5 scans on the Free Plan. You can continue using MacroSync without AI food scanning, or upgrade to Premium for unlimited scans and chatbot access.",
          [
            { text: "Continue on Free Plan", style: "cancel" },
            { text: "Upgrade to Premium ✨", onPress: () => onTabChange('SETTINGS') }
          ]
        );
        return;
      }

      if (response.ok) {
        if (data.remaining_scans !== undefined) {
          setScanInfo({
            isPremium: !!data.is_premium,
            remaining: data.remaining_scans
          });
        } else if (!scanInfo.isPremium && typeof scanInfo.remaining === 'number') {
          setScanInfo(prev => ({ ...prev, remaining: Math.max(0, prev.remaining - 1) }));
        }

        if (data.error) {
          const isNotFood = data.error.toLowerCase().includes("no food") || data.error.toLowerCase().includes("not food");
          showAlert(isNotFood ? "No Food Detected 🍽️" : "Scan Unclear 📸", data.error);
          setCapturedImage(null);
          if (cameraRef.current && cameraRef.current.resumePreview) {
            try { cameraRef.current.resumePreview(); } catch (e) {}
          }
        } else {
          setAnalysisResult(data);
          openBottomSheet();
        }
      } else {
        showAlert("Analysis Error", data.detail || "Failed to analyze food. Please try again.");
        setCapturedImage(null);
        if (cameraRef.current && cameraRef.current.resumePreview) {
          try { cameraRef.current.resumePreview(); } catch (e) {}
        }
      }

    } catch (error) {
      setIsScanning(false);
      stopPulseAnimation();
      if (cameraRef.current && cameraRef.current.resumePreview) {
        try { cameraRef.current.resumePreview(); } catch (e) {}
      }
      if (__DEV__) console.error("Scanning Error:", error);
      showAlert("Analysis Error", "Cannot connect to server. Check your network.");
      setCapturedImage(null);
    }
  };

  const handleUploadImage = async () => {
    if (isScanning) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(
          "Permission Denied",
          "You need to allow gallery access to select an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setCapturedImage(selectedAsset.uri);
        setIsScanning(true);
        startPulseAnimation();

        const response = await fetch(`${API_URL}/analyze-food`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image_base64: selectedAsset.base64,
            user_id: userId
          })
        });

        const data = await response.json();

        setIsScanning(false);
        stopPulseAnimation();

        if (response.status === 403 || (data && data.detail && data.detail.includes("limit reached"))) {
          setCapturedImage(null);
          setScanInfo(prev => ({ ...prev, remaining: 0 }));
          showAlert(
            "Scan Limit Reached",
            "You've reached your daily limit of 5 scans on the Free Plan. You can continue using MacroSync without AI food scanning, or upgrade to Premium for unlimited scans and chatbot access.",
            [
              { text: "Continue on Free Plan", style: "cancel" },
              { text: "Upgrade to Premium ✨", onPress: () => onTabChange('SETTINGS') }
            ]
          );
          return;
        }

        if (response.ok) {
          if (data.remaining_scans !== undefined) {
            setScanInfo({
              isPremium: !!data.is_premium,
              remaining: data.remaining_scans
            });
          } else if (!scanInfo.isPremium && typeof scanInfo.remaining === 'number') {
            setScanInfo(prev => ({ ...prev, remaining: Math.max(0, prev.remaining - 1) }));
          }

          if (data.error) {
            const isNotFood = data.error.toLowerCase().includes("no food") || data.error.toLowerCase().includes("not food");
            showAlert(isNotFood ? "No Food Detected 🍽️" : "Scan Unclear 📸", data.error);
            setCapturedImage(null);
          } else {
            setAnalysisResult(data);
            openBottomSheet();
          }
        } else {
          showAlert("Analysis Error", data.detail || "Failed to analyze food. Please try again.");
          setCapturedImage(null);
        }
      }
    } catch (error) {
      setIsScanning(false);
      stopPulseAnimation();
      if (__DEV__) console.error("Gallery Upload Error:", error);
      showAlert("Upload Error", "Failed to choose image from gallery.");
      setCapturedImage(null);
    }
  };

  const resetScan = () => {
    if (cameraRef.current && cameraRef.current.resumePreview) {
      try {
        cameraRef.current.resumePreview();
      } catch (err) {
        if (__DEV__) console.log("Error resuming camera preview:", err);
      }
    }
    setAnalysisResult(null);
    setCapturedImage(null);
    setIsScanning(false);
    setPortionScale(1.0);
  };

  const scaledCalories = Math.round((analysisResult?.calories || 0) * portionScale);
  const scaledProtein = Math.round((analysisResult?.protein || 0) * portionScale);
  const scaledCarbs = Math.round((analysisResult?.carbs || 0) * portionScale);
  const scaledFats = Math.round((analysisResult?.fats || 0) * portionScale);
  const scaledWeight = analysisResult?.serving_weight_g ? Math.round(analysisResult.serving_weight_g * portionScale) : null;

  const handleLogFood = () => {
    if (!analysisResult) return;

    const currentConsumed = dailyNutrition?.consumedCalories || 0;
    const targetCalories = dailyNutrition?.targetCalories || 2500;
    const newTotal = currentConsumed + scaledCalories;
    const excess = newTotal - targetCalories;

    const performLog = () => {
      if (onLogMeal && analysisResult) {
        const displayWeight = scaledWeight ? ` (${scaledWeight}g)` : '';
        const mealItem = {
          id: `scan-${Date.now()}`,
          name: `${analysisResult.name}${displayWeight}`,
          rawName: analysisResult.name,
          calories: scaledCalories,
          protein: scaledProtein,
          carbs: scaledCarbs,
          fats: scaledFats,
          mealType: selectedMealType,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        saveToHistory(mealItem);
        onLogMeal(mealItem);
      }
      onTabChange('DASHBOARD');
    };

    if (excess > 0) {
      showAlert(
        "Calorie Target Exceeded ⚠️",
        `Logging this meal (${scaledCalories} kcal) will put you ${excess} kcal over your daily target of ${targetCalories} kcal.\n\nDo you still want to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed & Log", style: "destructive", onPress: performLog }
        ]
      );
    } else {
      performLog();
    }
  };

  // If we have a result, show the split screen layout (Photo Top, Macros Bottom)
  if (analysisResult && capturedImage) {
    const mealTypeColors = {
      Breakfast: '#F59E0B',
      Lunch: '#10B981',
      Snack: '#0EA5E9',
      Dinner: '#8B5CF6'
    };

    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        
        {/* Full Photo on top half with floating translucent close button */}
        <View style={{ height: screenHeight * 0.40, width: '100%', backgroundColor: '#000', position: 'relative' }}>
          <Image source={{ uri: capturedImage }} style={{ flex: 1 }} resizeMode="cover" />
          <TouchableOpacity 
            style={styles.floatingCloseBtn}
            onPress={resetScan}
            activeOpacity={0.8}
          >
            <X color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Results on bottom half */}
        <ScrollView 
          style={{ flex: 1, backgroundColor: theme?.surface || '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -28 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        >
          <View style={styles.resultTitleRow}>
            <View style={styles.aiBadge}>
              <Scan color={logoGreen} size={14} style={{ marginRight: 4 }} />
              <Text style={styles.aiBadgeText}>AI Vision Match</Text>
            </View>
            <Text style={styles.confidenceText}>{analysisResult.confidence}% match</Text>
          </View>
          
          <Text style={styles.foodName}>{analysisResult.name}</Text>
          {scaledWeight ? (
            <Text style={styles.portionText}>Estimated Portion: {scaledWeight}g ({portionScale}x serving)</Text>
          ) : null}

          {/* ── PORTION SCALE CHIPS ── */}
          <Text style={styles.subTitleLabel}>Adjust Portion Scale</Text>
          <View style={styles.portionScaleRow}>
            {[0.5, 1.0, 1.5, 2.0].map((scale) => (
              <TouchableOpacity
                key={scale}
                style={[
                  styles.scaleChip,
                  portionScale === scale && styles.scaleChipActive
                ]}
                onPress={() => setPortionScale(scale)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.scaleChipText,
                  portionScale === scale && styles.scaleChipTextActive
                ]}>
                  {scale}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── MEAL TYPE SELECTOR ── */}
          <Text style={styles.subTitleLabel}>Log to Meal Category</Text>
          <View style={styles.mealTypeRow}>
            {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((type) => {
              const activeColor = mealTypeColors[type];
              const isActive = selectedMealType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeChip,
                    isActive ? { backgroundColor: `${activeColor}20`, borderColor: activeColor, borderWidth: 1.5 } : { backgroundColor: theme?.cardBg || '#F1F5F9' }
                  ]}
                  onPress={() => setSelectedMealType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.mealTypeChipText,
                    isActive ? { color: activeColor, fontWeight: '900' } : { color: theme?.textSecondary || '#64748B' }
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── MACRO BREAKDOWN GRID ── */}
          <View style={styles.macroCardGrid}>
            <View style={styles.macroCard}>
              <Text style={[styles.macroValue, { color: '#F97316' }]}>{scaledCalories}</Text>
              <Text style={styles.macroLabel}>Kcal</Text>
            </View>
            <View style={[styles.macroCard, { borderLeftWidth: 1, borderColor: theme?.border || '#E2E8F0' }]}>
              <Text style={[styles.macroValue, { color: '#10B981' }]}>{scaledProtein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={[styles.macroCard, { borderLeftWidth: 1, borderColor: theme?.border || '#E2E8F0' }]}>
              <Text style={[styles.macroValue, { color: '#F59E0B' }]}>{scaledCarbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={[styles.macroCard, { borderLeftWidth: 1, borderColor: theme?.border || '#E2E8F0' }]}>
              <Text style={[styles.macroValue, { color: '#EC4899' }]}>{scaledFats}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logButton} onPress={handleLogFood} activeOpacity={0.8}>
            <CheckCircle2 color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.logButtonText}>Log {selectedMealType} ({scaledCalories} kcal)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={resetScan}
          >
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={false} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header Area */}
      <View style={styles.headerArea}>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => onTabChange('DASHBOARD')}
          activeOpacity={0.7}
        >
          <X color="#64748B" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>AI Food Scanner</Text>
          
          {/* REMAINING SCAN COUNT BADGE */}
          <View style={[
            styles.scanBadgePill, 
            scanInfo.isPremium ? styles.premiumBadgePill : (scanInfo.remaining <= 1 ? styles.warningBadgePill : styles.normalBadgePill)
          ]}>
            {scanInfo.isPremium ? (
              <Sparkles color="#8B5CF6" size={11} style={{ marginRight: 4 }} />
            ) : (
              <Zap color={scanInfo.remaining <= 1 ? "#EF4444" : "#10B981"} size={11} style={{ marginRight: 4 }} />
            )}
            <Text style={[
              styles.scanBadgeText, 
              scanInfo.isPremium ? styles.premiumBadgeText : (scanInfo.remaining <= 1 ? styles.warningBadgeText : styles.normalBadgeText)
            ]}>
              {scanInfo.isPremium ? "Unlimited Scans ✨" : `${scanInfo.remaining} / 5 Scans Left Today`}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
          activeOpacity={0.7}
        >
          {flashMode === 'on' ? <Zap color="#10B981" size={24} /> : <ZapOff color="#64748B" size={24} />}
        </TouchableOpacity>
      </View>

      {/* Bounded Camera Area */}
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing="back"
          enableTorch={flashMode === 'on'}
          ref={cameraRef}
        />

        {/* Captured Image Freeze Frame Overlay */}
        {capturedImage && (
          <Image 
            source={{ uri: capturedImage }} 
            style={[StyleSheet.absoluteFillObject, { zIndex: 5 }]} 
          />
        )}

        {/* Viewfinder Guide Overlay */}
        <View style={styles.viewfinderContainer} pointerEvents="none">
          <View style={styles.viewfinderBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {isScanning && (
              <Animated.View style={[styles.scanningLine, { transform: [{ translateY: scanLineAnim }] }]} />
            )}
          </View>
        </View>
      </View>

      {/* VISUAL TIPS CARD & DAILY LIMIT WARNING */}
      {showTipsCard && !isScanning && (
        <View style={styles.visualTipsCard}>
          <View style={styles.tipsHeaderRow}>
            <View style={styles.tipsIconBg}>
              <Lightbulb color="#F59E0B" size={15} />
            </View>
            <Text style={styles.tipsCardTitle}>Scanning Tips & Limit Notice</Text>
            <TouchableOpacity 
              onPress={handleDismissTipsCard} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeTipsBtn}
            >
              <X color="#94A3B8" size={14} />
            </TouchableOpacity>
          </View>

          <Text style={styles.tipsBulletPoint}>
            • Align food in good lighting inside the frame for best accuracy.
          </Text>

          <View style={styles.warningAlertBox}>
            <AlertTriangle color="#F59E0B" size={14} style={{ marginRight: 6, marginTop: 1 }} />
            <Text style={styles.warningAlertText}>
              <Text style={{ fontWeight: '900', color: '#D97706' }}>Important:</Text> Every scan attempt (including blurry or non-food photos) deducts 1 count from your 5 daily free scans.
            </Text>
          </View>
        </View>
      )}

      {!showTipsCard && !isScanning && (
        <TouchableOpacity 
          style={styles.reopenTipsBtn} 
          onPress={() => setShowTipsCard(true)}
          activeOpacity={0.7}
        >
          <Lightbulb color="#10B981" size={13} style={{ marginRight: 5 }} />
          <Text style={styles.reopenTipsText}>Scan Tips & Limit Info</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Controls Area (outside camera) */}
      <View style={styles.bottomControlsArea}>
        <Text style={styles.instructionText}>
          {isScanning ? 'Analyzing macronutrients...' : 'Align food within the frame'}
        </Text>
        <View style={styles.shutterContainer}>
          {/* Left: Gallery Upload Button */}
          <TouchableOpacity 
            style={styles.galleryButton} 
            onPress={handleUploadImage}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            <Upload color="#10B981" size={22} />
          </TouchableOpacity>

          {/* Center: Main Shutter Button */}
          <TouchableOpacity 
            style={styles.shutterOuter}
            onPress={handleCapture}
            disabled={isScanning}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.shutterInner, isScanning && { transform: [{ scale: pulseAnim }] }]}>
              {isScanning && <ActivityIndicator color="#FFFFFF" size="small" />}
            </Animated.View>
          </TouchableOpacity>

          {/* Right: Recent Scans History Button */}
          <TouchableOpacity 
            style={styles.historyButton} 
            onPress={() => setShowHistoryModal(true)}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            <History color="#10B981" size={22} />
            {scanHistory.length > 0 && (
              <View style={styles.historyBadgeDot}>
                <Text style={styles.historyBadgeDotText}>{scanHistory.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── RECENT AI SCANS HISTORY MODAL ── */}
      <Modal
        visible={showHistoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContent}>
            <View style={styles.historyModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <History color={logoGreen} size={18} style={{ marginRight: 8 }} />
                <Text style={styles.historyModalTitle}>Recent Scans</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <X color={isDarkMode ? "#94A3B8" : "#64748B"} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.historyModalSubText}>Re-log past scanned meals instantly without spending scan quota</Text>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {scanHistory.length === 0 ? (
                <Text style={styles.emptyHistoryText}>No recent scans logged yet.</Text>
              ) : (
                scanHistory.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.historyModalRowCard}
                    onPress={() => {
                      setShowHistoryModal(false);
                      handleRelogHistoryItem(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyModalItemName}>{item.rawName || item.name}</Text>
                      <Text style={styles.historyModalItemMacros}>{item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fats}g F</Text>
                    </View>
                    <View style={styles.relogModalBtn}>
                      <PlusCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                      <Text style={styles.relogModalBtnText}>Re-log</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme?.background || '#F8FAFC' },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme?.textPrimary || '#64748B'
  },
  scanBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
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
  scanBadgeText: {
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
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme?.surface || '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 14,
  },
  camera: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  viewfinderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  viewfinderBox: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  scanningLine: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  scanningHudBadge: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scanningHudText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  visualTipsCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: theme?.surface || '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tipsCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    flex: 1,
  },
  closeTipsBtn: {
    padding: 4,
  },
  tipsBulletPoint: {
    fontSize: 12,
    color: theme?.textSecondary || '#64748B',
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(254, 243, 199, 0.4)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(253, 230, 138, 0.7)',
  },
  warningAlertText: {
    flex: 1,
    fontSize: 11,
    color: theme?.textSecondary || '#475569',
    lineHeight: 15,
    fontWeight: '600',
  },
  reopenTipsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme?.surface || '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  reopenTipsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  bottomControlsArea: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  instructionText: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
  },
  shutterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    height: 76,
  },
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme?.surface || '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
    position: 'absolute',
    left: '10%',
  },
  historyButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme?.surface || '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
    position: 'absolute',
    right: '10%',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9'
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
  },
  aiBadgeText: {
    color: logoGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  confidenceText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  historySection: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historySubText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme?.textSecondary || '#94A3B8',
  },
  historyScroll: {
    gap: 8,
  },
  historyChipCard: {
    backgroundColor: theme?.surface || '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    minWidth: 150,
  },
  historyChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyChipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    maxWidth: 90,
  },
  relogPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: logoGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  relogPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  historyChipMacros: {
    fontSize: 10,
    fontWeight: '700',
    color: theme?.textSecondary || '#64748B',
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  subTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme?.textSecondary || '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  portionScaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scaleChip: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme?.cardBg || '#F1F5F9',
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  scaleChipActive: {
    backgroundColor: logoGreen,
    borderColor: logoGreen,
  },
  scaleChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme?.textSecondary || '#64748B',
  },
  scaleChipTextActive: {
    color: '#FFFFFF',
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  mealTypeChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  foodName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 12,
  },
  portionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme?.textSecondary || '#94A3B8',
    marginTop: -14,
    marginBottom: 20,
  },
  macroCardGrid: {
    flexDirection: 'row',
    backgroundColor: theme?.cardBg || '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme?.border || '#F1F5F9',
    paddingVertical: 16,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '600',
  },
  logButton: {
    flexDirection: 'row',
    backgroundColor: logoGreen,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  retakeButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: theme?.textSecondary || '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: theme?.textSecondary || '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: logoGreen,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButtonAbsolute: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme?.surface || '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyBadgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: logoGreen,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  historyModalContent: {
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: 450,
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme?.textPrimary || (isDarkMode ? '#F8FAFC' : '#0F172A'),
  },
  historyModalSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme?.textSecondary || '#64748B',
    marginBottom: 16,
  },
  historyModalRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  historyModalItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme?.textPrimary || (isDarkMode ? '#F8FAFC' : '#0F172A'),
  },
  historyModalItemMacros: {
    fontSize: 11,
    fontWeight: '600',
    color: theme?.textSecondary || '#64748B',
    marginTop: 2,
  },
  relogModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: logoGreen,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  relogModalBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyHistoryText: {
    textAlign: 'center',
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    paddingVertical: 30,
    fontWeight: '600',
  },
});
