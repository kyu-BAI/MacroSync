import {
  Text,
  View,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Sparkles, UtensilsCrossed, Cpu, SportShoe } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from './AILoadingModal.styles';

const MEAL_STAGES = [
  "Analyzing your target calories & macros...",
  "Checking local ingredient availability...",
  "Balancing protein, carb & fat ratios...",
  "Crafting chef-curated recipe instructions...",
  "Finalizing your personalized meal plan..."
];

const WORKOUT_STAGES = [
  "Analyzing your fitness intensity preference...",
  "Selecting zero-equipment home exercises...",
  "Calculating optimal set reps & calorie burn...",
  "Structuring step-by-step tutorial guides...",
  "Finalizing your AI workout routine..."
];

const RECIPE_STAGES = [
  "Fetching local food market prices...",
  "Calculating ingredient measurements...",
  "Generating step-by-step cooking guide...",
  "Estimating nutritional breakdown...",
  "Finalizing AI recipe card..."
];

export default function AILoadingModal({
  visible,
  type = 'meal', // 'meal' | 'workout' | 'recipe'
  title,
  subtitle
}) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeTextAnim = useRef(new Animated.Value(1)).current;

  const [stageIndex, setStageIndex] = useState(0);

  const stages = type === 'workout' 
    ? WORKOUT_STAGES 
    : type === 'recipe' 
      ? RECIPE_STAGES 
      : MEAL_STAGES;

  const defaultTitle = type === 'workout' 
    ? "Generating Workout Routine" 
    : type === 'recipe' 
      ? "Crafting Custom Recipe" 
      : "Customizing AI Meal Plan";

  // Cycle animation and stages
  useEffect(() => {
    if (!visible) {
      setStageIndex(0);
      progressAnim.setValue(0);
      return;
    }

    // 1. Rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    // 2. Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    // 3. Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 12000,
      easing: Easing.linear,
      useNativeDriver: false
    }).start();

    rotateLoop.start();
    pulseLoop.start();

    // 4. Cycle stage text every 2.4s
    const stageTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeTextAnim, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(fadeTextAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      setStageIndex(prev => (prev + 1) % stages.length);
    }, 2400);

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      clearInterval(stageTimer);
    };
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '98%']
  });

  const IconComponent = type === 'workout' 
    ? SportShoe 
    : type === 'recipe' 
      ? UtensilsCrossed 
      : UtensilsCrossed;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          
          {/* UIverse Inspired Glowing Spinner Orbital */}
          <View style={styles.spinnerContainer}>
            {/* Outer Rotating Neon Dashed Ring */}
            <Animated.View 
              style={[
                styles.outerRing, 
                { transform: [{ rotate: spin }] }
              ]} 
            >
              <View style={styles.ringDot1} />
              <View style={styles.ringDot2} />
            </Animated.View>

            {/* Inner Pulsing Glowing Orb */}
            <Animated.View 
              style={[
                styles.innerOrb,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <IconComponent size={28} color="#10B981" strokeWidth={2.2} />
            </Animated.View>

            {/* Sparkle Badge Accent */}
            <View style={styles.sparkleBadge}>
              <Sparkles size={12} color="#FFFFFF" />
            </View>
          </View>

          {/* Title & Header */}
          <Text style={styles.modalTitle}>{title || defaultTitle}</Text>
          <Text style={styles.modalSubtitle}>
            {subtitle || "MacroSync AI Engine is processing your request"}
          </Text>

          {/* Animated Stage Message Box */}
          <View style={styles.stageBox}>
            <Cpu size={14} color="#10B981" style={{ marginRight: 8 }} />
            <Animated.Text style={[styles.stageText, { opacity: fadeTextAnim }]}>
              {stages[stageIndex]}
            </Animated.Text>
          </View>

          {/* UIverse Style Shimmer Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
          </View>

          {/* Footer Badge */}
          <View style={styles.footerRow}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.footerText}>POWERED BY VITA AI</Text>
          </View>

        </View>
      </View>
    </Modal>
  );
}


