import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const validate = () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse e-mail');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Adresse e-mail invalide');
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 600));
      navigation.navigate('Otp', {
        email: email.trim(),
        fromReset: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF' },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark ? '#1C1A18' : '#F3F4F6',
                  borderColor: isDark ? '#2E2C29' : '#E5E7EB',
                },
              ]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={isDark ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <AuthHeader
            title="Réinitialisation de mot de passe"
            subtitle="Entrez votre adresse e-mail pour recevoir un code OTP de réinitialisation."
            logoSize={68}
          />

          {/* Form */}
          <View style={styles.formContainer}>
            <AuthInput
              label="Email"
              placeholder="Entrez votre email de connexion"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (error) setError(undefined);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
            />

            <AuthButton
              title="ENVOYER LE CODE"
              showArrow
              onPress={handleSendOtp}
              loading={loading}
              style={styles.ctaButton}
            />

            <TouchableOpacity
              style={styles.backToLoginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.backToLoginText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topRow: {
    height: 44,
    justifyContent: 'center',
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    marginTop: 8,
  },
  ctaButton: {
    marginTop: 12,
    marginBottom: 20,
  },
  backToLoginBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
