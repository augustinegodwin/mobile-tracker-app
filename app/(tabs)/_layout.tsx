import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hides the bottom navigation bar completely
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="Analytics" />
      <Tabs.Screen name="Profile" />
    </Tabs>
  );
}