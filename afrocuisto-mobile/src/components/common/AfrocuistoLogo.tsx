import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { AppColors } from '../../theme/colors';

interface AfrocuistoLogoProps {
  size?: number;
  color?: string;
}

export const AfrocuistoLogo: React.FC<AfrocuistoLogoProps> = ({
  size = 64,
  color = AppColors.primary,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {/* House / Cloche Roof Silhouette */}
        <Path
          d="M32 6L6 26H14V56C14 57.1046 14.8954 58 16 58H48C49.1046 58 50 57.1046 50 56V26H58L32 6Z"
          fill={color}
        />

        {/* Fork Cutout (Left) */}
        <Path
          d="M24 30V39C24 40.1046 24.8954 41 26 41H27V52H29V41H30C31.1046 41 32 40.1046 32 39V30H30V36H29V30H27V36H26V30H24Z"
          fill="#FFFFFF"
        />

        {/* Knife Cutout (Right) */}
        <Path
          d="M35 30V52H37V41C39.5 41 41 39 41 35V30H35Z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
