import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { WifiOff } from 'lucide-react-native';

export default function OfflineBanner({ isOnline }) {
  if (isOnline) return null;
  return (
    <SafeAreaView style={styles.offlineBannerContainer}>
      <View style={styles.offlineBannerPill}>
        <WifiOff size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.offlineBannerText}>
          Offline Mode — Showing cached data. Logs will sync when back online.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  offlineBannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 32,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#92400E',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    maxWidth: '90%',
  },
  offlineBannerText: {
    color: '#FEF3C7',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
