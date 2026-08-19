import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface AuthLogoProps {
  size?: number;
  style?: ViewStyle;
}

export const AuthLogo: React.FC<AuthLogoProps> = ({ size = 64, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('../../../assets/images/auth_logo.png')}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
