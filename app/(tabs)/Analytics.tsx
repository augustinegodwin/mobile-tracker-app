import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

// Placeholder — if the project already has a profile screen somewhere else,
// move it into app/(tabs)/profile.tsx instead of using this stub.
export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700' },
});