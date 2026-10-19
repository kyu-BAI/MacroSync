import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Clock } from 'lucide-react-native';

const logoGreen = '#10B981';
const baseColor = '#F8FAFC';

export default function RecipeModal({
  visible,
  recipe,
  onClose,
  theme,
  language,
  translateMealTitle,
}) {
  if (!recipe) return null;

  const displayTitle = translateMealTitle
    ? translateMealTitle(recipe.title, language)
    : recipe.title;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: theme?.background || baseColor, alignItems: 'center' }}>
        <View
          style={[
            styles.recipeModalContent,
            { backgroundColor: theme?.background || baseColor },
          ]}
        >
        <Text
          style={[
            styles.recipeModalTitle,
            { color: theme?.textPrimary || '#0F172A' },
          ]}
        >
          {displayTitle}
        </Text>

        {/* Macro Details Grid */}
        <View
          style={[
            styles.recipeModalMacrosGrid,
            {
              backgroundColor: theme?.surface || '#FFFFFF',
              borderColor: theme?.border || '#EBEBEB',
            },
          ]}
        >
          <View style={styles.recipeModalMacroBox}>
            <Text style={[styles.recipeModalMacroVal, { color: '#F97316' }]}>
              {recipe.calories}
            </Text>
            <Text style={styles.recipeModalMacroLabel}>Kcal</Text>
          </View>
          <View
            style={[
              styles.recipeModalMacroBox,
              {
                borderLeftWidth: 1,
                borderLeftColor: theme?.border || '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.recipeModalMacroVal, { color: '#10B981' }]}>
              {recipe.protein}
            </Text>
            <Text style={styles.recipeModalMacroLabel}>Protein</Text>
          </View>
          <View
            style={[
              styles.recipeModalMacroBox,
              {
                borderLeftWidth: 1,
                borderLeftColor: theme?.border || '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.recipeModalMacroVal, { color: '#F59E0B' }]}>
              {recipe.carbs}
            </Text>
            <Text style={styles.recipeModalMacroLabel}>Carbs</Text>
          </View>
          <View
            style={[
              styles.recipeModalMacroBox,
              {
                borderLeftWidth: 1,
                borderLeftColor: theme?.border || '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.recipeModalMacroVal, { color: '#EC4899' }]}>
              {recipe.fats}
            </Text>
            <Text style={styles.recipeModalMacroLabel}>Fats</Text>
          </View>
        </View>

        {/* Sugar & Salt/Sodium Level Health Assessment */}
        <View style={[styles.sugarSaltBadgeRow, { backgroundColor: theme?.inputBg || '#F1F5F9' }]}>
          <View style={styles.sugarSaltItem}>
            <Text style={[styles.sugarSaltLabel, { color: theme?.textSecondary || '#64748B' }]}>Sugar: </Text>
            <Text style={[styles.sugarSaltVal, { color: '#F59E0B' }]}>
              {recipe.sugar || '3g'}
            </Text>
            <Text style={[styles.sugarSaltSub, { color: '#10B981' }]}> (Low)</Text>
          </View>
          <View style={[styles.sugarSaltDivider, { backgroundColor: theme?.border || '#CBD5E1' }]} />
          <View style={styles.sugarSaltItem}>
            <Text style={[styles.sugarSaltLabel, { color: theme?.textSecondary || '#64748B' }]}>Salt/Sodium: </Text>
            <Text style={[styles.sugarSaltVal, { color: '#0EA5E9' }]}>
              {recipe.sodium || '280mg'}
            </Text>
            <Text style={[styles.sugarSaltSub, { color: '#F59E0B' }]}> (Moderate)</Text>
          </View>
        </View>

        {/* Ingredients & Instructions Scroll */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.recipeModalScroll}
        >
          <View
            style={[
              styles.recipeModalIngredientsBox,
              { backgroundColor: theme?.inputBg || '#F1F5F9' },
            ]}
          >
            <Text style={styles.recipeModalSecTitle}>Ingredients</Text>
            {(recipe.ingredients || []).map((ing, i) => (
              <Text
                key={i}
                style={[
                  styles.recipeModalListItem,
                  { color: theme?.textPrimary || '#0F172A' },
                ]}
              >
                • {ing}
              </Text>
            ))}
          </View>

          <View
            style={[
              styles.recipeModalInstructionsBox,
              {
                backgroundColor: theme?.surface || '#F8FAFC',
                borderColor: theme?.border || '#E2E8F0',
              },
            ]}
          >
            <View style={styles.instructionsHeaderRow}>
              <Text style={styles.recipeModalSecTitle}>Instructions</Text>
              <View
                style={[
                  styles.instructionTimerBadge,
                  {
                    backgroundColor: theme?.inputBg || '#F1F5F9',
                    borderColor: theme?.border || '#E2E8F0',
                  },
                ]}
              >
                <Clock color={logoGreen} size={12} style={{ marginRight: 5 }} />
                <Text
                  style={[
                    styles.instructionTimerText,
                    { color: theme?.textSecondary || '#64748B' },
                  ]}
                >
                  {recipe.time || '20-25 mins'}
                </Text>
              </View>
            </View>

            {(recipe.instructions || []).map((step, i) => (
              <View key={i} style={styles.recipeModalStepRow}>
                <Text style={styles.recipeModalStepNum}>{i + 1}</Text>
                <Text
                  style={[
                    styles.recipeModalStepText,
                    { color: theme?.textPrimary || '#0F172A' },
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Close Button */}
        <TouchableOpacity style={styles.recipeModalCloseBtn} onPress={onClose}>
          <Text style={styles.recipeModalCloseBtnText}>Dismiss Recipe</Text>
        </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  recipeModalContent: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  recipeModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeModalMacrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  recipeModalMacroBox: {
    flex: 1,
    alignItems: 'center',
  },
  recipeModalMacroVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  recipeModalMacroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  sugarSaltBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  sugarSaltItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sugarSaltDivider: {
    width: 1,
    height: 16,
  },
  sugarSaltLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  sugarSaltVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  sugarSaltSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  recipeModalScroll: {
    flex: 1,
    marginBottom: 16,
  },
  recipeModalIngredientsBox: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  recipeModalInstructionsBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  instructionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  instructionTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  instructionTimerText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recipeModalSecTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipeModalListItem: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  recipeModalStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recipeModalStepNum: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 8,
    marginTop: 2,
  },
  recipeModalStepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  recipeModalCloseBtn: {
    backgroundColor: logoGreen,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeModalCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
