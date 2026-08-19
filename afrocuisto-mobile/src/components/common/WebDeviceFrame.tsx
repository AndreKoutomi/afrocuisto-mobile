import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

interface WebDeviceFrameProps {
  children: React.ReactNode;
}

export const WebDeviceFrame: React.FC<WebDeviceFrameProps> = ({ children }) => {
  const { isDark } = useTheme();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View
      style={[
        styles.webOuterContainer,
        { backgroundColor: isDark ? '#0F0E0D' : '#E8E5DF' },
      ]}
    >
      {/* Frame Rectangulaire Google Pixel 8 (1080x2400 - 412px largeur standard) */}
      <View
        style={[
          styles.deviceFrame,
          {
            backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
            borderColor: isDark ? '#2E2C29' : '#D1CECA',
          },
        ]}
      >
        <View style={styles.screenViewport}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webOuterContainer: {
    flex: 1,
    width: '100vw' as any,
    height: '100vh' as any,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  deviceFrame: {
    width: '100%',
    maxWidth: 412, // Largeur viewport Google Pixel 8
    height: '100%',
    maxHeight: '100vh' as any,
    borderRadius: 0, // Rectangulaire sans aucun arrondi
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    display: 'flex' as any,
    flexDirection: 'column',
  },
  screenViewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex' as any,
    flexDirection: 'column',
    overflow: 'hidden',
  },
});
