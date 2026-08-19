import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AuthLogo } from './AuthLogo';
import { useTheme } from '../../context/ThemeContext';

interface AuthHeaderProps {
  sectionTitle?: string;
  title: string;
  subtitle?: string;
  logoSize?: number;
  containerStyle?: ViewStyle;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  sectionTitle,
  title,
  subtitle,
  logoSize = 64,
  containerStyle,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Top Afrocuisto Logo */}
      <AuthLogo size={logoSize} style={styles.logo} />

      {/* Optional Section Tag / Pre-title */}
      {sectionTitle && (
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#D1D5DB' : '#374151' },
          ]}
        >
          {sectionTitle}
        </Text>
      )}

      {/* Main Title */}
      <Text
        style={[
          styles.title,
          { color: isDark ? '#FFFFFF' : '#111827' },
        ]}
      >
        {title}
      </Text>

      {/* Subtitle / Description */}
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? '#9CA3AF' : '#6B7280' },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 10,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});
