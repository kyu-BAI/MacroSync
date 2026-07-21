import React, { useState, useRef, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, ZapOff, CheckCircle2, Scan, ChevronRight, Utensils, Upload, Sparkles, Lightbulb, AlertTriangle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// High-Contrast System Theme Setup Tokens
const logoGreen = '#4EA685';
const baseColor = '#F0F4F2';

export default function FoodScannerScreen({ onTabChange, onLogMeal, userId, userProfile }) {
  const { showAlert } = useCustomAlert();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState('off');
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  
  // Scan limits tracking state
  const [scanInfo, setScanInfo] = useState({ isPremium: false, remaining: 5 });
  const [showTipsCard, setShowTipsCard] = useState(true);

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
        .catch((err) => console.log("Scan status fetch error:", err));
    }
  }, [userId]);

  // Handle Permissions
  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4EA685" />
        <Text style={{ marginTop: 10, color: '#41544B' }}>Loading camera permissions...</Text>
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
        quality: 0.7,
        base64: true,
      });
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

    } catch (error) {
      setIsScanning(false);
      stopPulseAnimation();
      console.error("Scanning Error:", error);
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
        quality: 0.7,
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
      console.error("Gallery Upload Error:", error);
      showAlert("Upload Error", "Failed to choose image from gallery.");
      setCapturedImage(null);
    }
  };

  const handleLogFood = () => {
    if (onLogMeal && analysisResult) {
      const displayWeight = analysisResult.serving_weight_g ? ` (${analysisResult.serving_weight_g}g)` : '';
      onLogMeal({
        name: `${analysisResult.name}${displayWeight}`,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fats: analysisResult.fats
      });
    }
    onTabChange('DASHBOARD');
  };

  // If we have a result, show the split screen layout (Photo Top, Macros Bottom)
  if (analysisResult && capturedImage) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        
        {/* Full Photo on top half */}
        <View style={{ height: screenHeight * 0.55, width: '100%', backgroundColor: '#000' }}>
          <Image source={{ uri: capturedImage }} style={{ flex: 1 }} resizeMode="cover" />
        </View>

        {/* Results on bottom half */}
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, paddingHorizontal: 24, paddingTop: 32 }}>
            <View style={styles.resultTitleRow}>
              <View style={styles.aiBadge}>
                <Scan color={logoGreen} size={14} style={{ marginRight: 4 }} />
                <Text style={styles.aiBadgeText}>AI Vision Match</Text>
              </View>
              <Text style={styles.confidenceText}>{analysisResult.confidence}% match</Text>
            </View>
            
            <Text style={styles.foodName}>{analysisResult.name}</Text>
            {analysisResult.serving_weight_g && (
              <Text style={styles.portionText}>Estimated Portion: {analysisResult.serving_weight_g}g</Text>
            )}
            
            <View style={styles.macroCardGrid}>
              <View style={styles.macroCard}>
                <Text style={styles.macroValue}>{analysisResult.calories}</Text>
                <Text style={styles.macroLabel}>Kcal</Text>
              </View>
              <View style={[styles.macroCard, { borderLeftWidth: 1, borderColor: '#D4E2DC' }]}>
                <Text style={[styles.macroValue, { color: logoGreen }]}>{analysisResult.protein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={[styles.macroCard, { borderLeftWidth: 1, borderColor: '#D4E2DC' }]}>
                <Text style={[styles.macroValue, { color: '#3B82F6' }]}>{analysisResult.carbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={[styles.macroCard, { borderLeftWidth: 1, borderColor: '#D4E2DC' }]}>
                <Text style={[styles.macroValue, { color: '#EC4899' }]}>{analysisResult.fats}g</Text>
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.logButton} onPress={handleLogFood} activeOpacity={0.8}>
              <CheckCircle2 color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.logButtonText}>Log to Daily Tracker</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.retakeButton} 
              onPress={() => {
                setAnalysisResult(null);
                setCapturedImage(null);
                setIsScanning(false);
              }}
            >
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={false} barStyle="dark-content" />
      
      {/* Header Area */}
      <View style={styles.headerArea}>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => onTabChange('DASHBOARD')}
          activeOpacity={0.7}
        >
          <X color="#41544B" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>AI Food Scanner</Text>
          
          {/* REMAINING SCAN COUNT BADGE */}
          <View style={[
            styles.scanBadgePill, 
            scanInfo.isPremium ? styles.premiumBadgePill : (scanInfo.remaining <= 1 ? styles.warningBadgePill : styles.normalBadgePill)
          ]}>
            {scanInfo.isPremium ? (
              <Sparkles color="#92400E" size={11} style={{ marginRight: 4 }} />
            ) : (
              <Zap color={scanInfo.remaining <= 1 ? "#C53030" : "#2E7D32"} size={11} style={{ marginRight: 4 }} />
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
          {flashMode === 'on' ? <Zap color="#4EA685" size={24} /> : <ZapOff color="#41544B" size={24} />}
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
            style={[StyleSheet.absoluteFillObject, { zIndex: 3 }]} 
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
              <Lightbulb color="#4EA685" size={15} />
            </View>
            <Text style={styles.tipsCardTitle}>Scanning Tips & Limit Notice</Text>
            <TouchableOpacity 
              onPress={() => setShowTipsCard(false)} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeTipsBtn}
            >
              <X color="#7FA293" size={14} />
            </TouchableOpacity>
          </View>

          <Text style={styles.tipsBulletPoint}>
            • Align food in good lighting inside the frame for best accuracy.
          </Text>

          <View style={styles.warningAlertBox}>
            <AlertTriangle color="#C53030" size={14} style={{ marginRight: 6, marginTop: 1 }} />
            <Text style={styles.warningAlertText}>
              <Text style={{ fontWeight: '800', color: '#9B2C2C' }}>Important:</Text> Every scan attempt (including blurry or non-food photos) deducts 1 count from your 5 daily free scans.
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
          <Lightbulb color="#4EA685" size={13} style={{ marginRight: 5 }} />
          <Text style={styles.reopenTipsText}>Scan Tips & Limit Info</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Controls Area (outside camera) */}
      <View style={styles.bottomControlsArea}>
        <Text style={styles.instructionText}>
          {isScanning ? 'Analyzing macronutrients...' : 'Align food within the frame'}
        </Text>
        <View style={styles.shutterContainer}>
          <TouchableOpacity 
            style={styles.galleryButton} 
            onPress={handleUploadImage}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            <Upload color="#4EA685" size={22} />
          </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F2' },
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
    color: '#41544B'
  },
  scanBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
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
  scanBadgeText: {
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
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    shadowColor: '#4EA685',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 14,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  viewfinderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: logoGreen,
    shadowColor: logoGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  visualTipsCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#4EA685',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E1E9E5',
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
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tipsCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2E26',
    flex: 1,
  },
  closeTipsBtn: {
    padding: 4,
  },
  tipsBulletPoint: {
    fontSize: 12,
    color: '#556B60',
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  warningAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#9B2C2C',
    lineHeight: 15,
    fontWeight: '600',
  },
  reopenTipsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E1E9E5',
  },
  reopenTipsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4EA685',
  },
  bottomControlsArea: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  instructionText: {
    color: '#41544B',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    left: '10%',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#4EA685',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE'
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4EA685',
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
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    color: logoGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  confidenceText: {
    color: '#7FA293',
    fontSize: 12,
    fontWeight: '600',
  },
  foodName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A2E26',
    marginBottom: 20,
  },
  portionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7FA293',
    marginTop: -14,
    marginBottom: 20,
  },
  macroCardGrid: {
    flexDirection: 'row',
    backgroundColor: '#F7FAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F1EC',
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
    color: '#1A2E26',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#7FA293',
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
    color: '#7FA293',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A2E26',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: '#41544B',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  }
});
