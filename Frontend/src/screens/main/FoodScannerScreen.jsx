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
import { X, Zap, ZapOff, CheckCircle2, Scan, ChevronRight, Utensils, Upload, Sparkles, Lightbulb, AlertTriangle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
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

  // Actions
  const handleCapture = async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);
    startPulseAnimation();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        exif: false,
      });



      if (!photo || !photo.uri) {
        setIsScanning(false);
        stopPulseAnimation();
        setCapturedImage(null);
        showAlert("Camera Error 📷", "Failed to capture photo. Please try again.");
        return;
      }

      const formattedUri =
        photo.uri.startsWith("file://") ||
        photo.uri.startsWith("content://") ||
        photo.uri.startsWith("data:")
          ? photo.uri
          : `file://${photo.uri}`;

      setCapturedImage(formattedUri);

      const base64Data = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Data || base64Data.length < 4000) {
        setIsScanning(false);
        stopPulseAnimation();
        setCapturedImage(null);
        showAlert(
          "Camera Not Ready 📷",
          "The camera captured a blank image. Please wait a moment and try again."
        );
        return;
      }

      const response = await fetch(`${API_URL}/analyze-food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_base64: base64Data,
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
          const errStr = data.error.toLowerCase();
          const isNotFood = errStr.includes("no food") || errStr.includes("not food") || errStr.includes("edible") || errStr.includes("inedible");
          const isBusy = errStr.includes("busy") || errStr.includes("quota") || errStr.includes("temporarily");
          
          let alertTitle = "Scan Error 📸";
          if (isNotFood) alertTitle = "No Edible Food Detected 🍽️";
          else if (isBusy) alertTitle = "AI Service Busy ⌛";

          showAlert(alertTitle, data.error);
          setCapturedImage(null);
        } else {
          setAnalysisResult(data);
        }
      } else {
        showAlert("Analysis Error", data.detail || "Failed to analyze food. Please try again.");
        setCapturedImage(null);
      }

    } catch (error) {
      setIsScanning(false);
      stopPulseAnimation();
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
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const imageUri = selectedAsset.uri || (selectedAsset.base64 ? `data:image/jpeg;base64,${selectedAsset.base64}` : null);
        setCapturedImage(imageUri);
        setIsScanning(true);
        startPulseAnimation();

        let cleanBase64 = selectedAsset.base64 || '';
        if (!cleanBase64 && selectedAsset.uri) {
          try {
            cleanBase64 = await FileSystem.readAsStringAsync(selectedAsset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (fsErr) {
            __DEV__ && console.log("FileSystem read error:", fsErr);
          }
        }
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }

        if (!cleanBase64 || cleanBase64.length < 100) {
          setIsScanning(false);
          stopPulseAnimation();
          setCapturedImage(null);
          showAlert(
            "Image Error 📸",
            "Could not read image file. Please choose another image or take a fresh photo."
          );
          return;
        }

        const response = await fetch(`${API_URL}/analyze-food`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image_base64: cleanBase64,
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
            const errStr = data.error.toLowerCase();
            const isNotFood = errStr.includes("no food") || errStr.includes("not food") || errStr.includes("edible") || errStr.includes("inedible");
            const isBusy = errStr.includes("busy") || errStr.includes("quota") || errStr.includes("temporarily");
            
            let alertTitle = "Scan Error 📸";
            if (isNotFood) alertTitle = "No Edible Food Detected 🍽️";
            else if (isBusy) alertTitle = "AI Service Busy ⌛";

            showAlert(alertTitle, data.error);
            setCapturedImage(null);
          } else {
            setAnalysisResult(data);
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
        {!capturedImage && (
          <CameraView 
            style={styles.camera} 
            facing="back"
            enableTorch={flashMode === 'on'}
            ref={cameraRef}
          />
        )}
        {capturedImage && (
          <Image 
            source={{ uri: capturedImage }} 
            style={styles.capturedOverlayImage} 
            resizeMode="cover"
            fadeDuration={0}
          />
        )}

        {/* Viewfinder Guide Overlay & Minimalist Scanning Line */}
        <View style={[styles.viewfinderContainer, { zIndex: 20 }]} pointerEvents="none">
          <View style={styles.viewfinderBox}>
            <View style={[styles.corner, styles.topLeft, capturedImage && { borderColor: '#10B981' }]} />
            <View style={[styles.corner, styles.topRight, capturedImage && { borderColor: '#10B981' }]} />
            <View style={[styles.corner, styles.bottomLeft, capturedImage && { borderColor: '#10B981' }]} />
            <View style={[styles.corner, styles.bottomRight, capturedImage && { borderColor: '#10B981' }]} />
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
        </View>
      </View>
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
  capturedOverlayImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  viewfinderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  viewfinderBox: {
    width: 280,
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#FFFFFF',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: 14 },
  topRight: { top: 0, right: 0, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: 14 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: 14 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: 14 },
  scanningLine: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 2.5,
    backgroundColor: '#10B981',
    borderRadius: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
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
    left: '20%',
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
});
