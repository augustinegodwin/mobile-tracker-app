import { discord } from '@/assets/images/svg';
import React from 'react';
import { View, StyleSheet, Image, ViewStyle } from 'react-native';
discord
interface Props {
  name: string;
  size?: any;
  src: any;
}

export function SubscriptionIcon({ size = "100%", src }: Props) {
  const borderRadius = size * 0.28;
  const containerStyle: ViewStyle[] = [
    styles.container, 
    { width: "100%", height: "100%", zIndex: 1, 
     }
  ];

  return (
    <View style={containerStyle}>
      {src && (
        <Image
          source={src}
          style={styles.iconImage}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
}); 