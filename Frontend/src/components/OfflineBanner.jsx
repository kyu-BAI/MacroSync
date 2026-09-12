import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { styles } from '../../App.styles';

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
