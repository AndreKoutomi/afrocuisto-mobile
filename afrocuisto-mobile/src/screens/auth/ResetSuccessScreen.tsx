import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { AuthLogo } from '../../components/auth/AuthLogo';
import { AuthButton } from '../../components/auth/AuthButton';

export const ResetSuccessScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF' },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Logo */}
        <View style={styles.logoContainer}>
          <AuthLogo size={68} />
        </View>

        {/* Success Circle Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.checkBadge}>
            <Check size={28} color="#FFFFFF" strokeWidth={3} />
          </View>
        </View>

        {/* Main Text */}
        <Text
          style={[
            styles.title,
            { color: isDark ? '#FFFFFF' : '#111827' },
          ]}
        >
          Votre mot de passe a été{'\n'}réinitialisé avec succès
        </Text>

        <Text
          style={[
            styles.subtitle,
            { color: isDark ? '#9CA3AF' : '#6B7280' },
          ]}
        >
          Vous pouvez dès à présent vous connecter à votre compte Afrocuisto.
        </Text>

        {/* Primary CTA */}
        <View style={styles.actionContainer}>
          <AuthButton
            title="SE CONNECTER"
            onPress={handleGoToLogin}
            style={styles.ctaButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 36,
  },
  badgeContainer: {
    marginBottom: 24,
  },
  checkBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  actionContainer: {
    width: '100%',
  },
  ctaButton: {
    width: '100%',
  },
});
