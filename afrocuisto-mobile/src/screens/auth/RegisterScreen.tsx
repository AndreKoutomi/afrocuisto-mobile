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
import { ChevronLeft, Check } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { updateUser, login } = useAuth();
  const { isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreed?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Veuillez saisir votre nom';
    }

    if (!email.trim()) {
      newErrors.email = 'Veuillez saisir votre adresse e-mail';
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Adresse e-mail invalide';
    }

    if (!password) {
      newErrors.password = 'Veuillez créer un mot de passe';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit comporter au moins 6 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!agreed) {
      newErrors.agreed = "Veuillez accepter les conditions d'utilisation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateUser({
        name: name.trim(),
        email: email.trim(),
      });
      // Navigate to OTP verification for new account
      navigation.navigate('Otp', {
        email: email.trim(),
        fromReset: false,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await login();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
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
            {navigation.canGoBack() && (
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
            )}
          </View>

          {/* Figma Header */}
          <AuthHeader
            title="Créer un compte"
            subtitle="Pour créer votre compte dans l'application, saisissez vos informations personnelles."
            logoSize={68}
          />

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <AuthInput
              label="Votre nom"
              placeholder="Entrez votre nom complet"
              value={name}
              onChangeText={text => {
                setName(text);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
            />

            <AuthInput
              label="Email"
              placeholder="Entrez votre adresse email"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <AuthInput
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              isPassword
              error={errors.password}
            />

            <AuthInput
              label="Confirmer le mot de passe"
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              isPassword
              error={errors.confirmPassword}
            />

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                setAgreed(!agreed);
                if (errors.agreed) setErrors(prev => ({ ...prev, agreed: undefined }));
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  agreed && styles.checkboxActive,
                  {
                    borderColor: agreed
                      ? AppColors.primary
                      : isDark
                      ? '#4B5563'
                      : '#D1D5DB',
                    backgroundColor: agreed
                      ? AppColors.primary
                      : isDark
                      ? '#1C1A18'
                      : '#FFFFFF',
                  },
                ]}
              >
                {agreed && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text
                style={[
                  styles.checkboxLabel,
                  { color: isDark ? '#9CA3AF' : '#6B7280' },
                ]}
              >
                J'accepte les{' '}
                <Text style={[styles.checkboxLink, { color: AppColors.primary }]}>
                  Conditions d'utilisation
                </Text>{' '}
                et la{' '}
                <Text style={[styles.checkboxLink, { color: AppColors.primary }]}>
                  Politique de confidentialité
                </Text>
              </Text>
            </TouchableOpacity>

            {errors.agreed && <Text style={styles.errorAgreed}>{errors.agreed}</Text>}

            {/* Register CTA */}
            <AuthButton
              title="S'INSCRIRE"
              showArrow
              onPress={handleRegister}
              loading={loading}
              style={styles.ctaButton}
            />

            {/* "ou" Divider */}
            <View style={styles.dividerContainer}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: isDark ? '#2E2C29' : '#E5E7EB' },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  {
                    backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF',
                    color: isDark ? '#9CA3AF' : '#6B7280',
                  },
                ]}
              >
                ou
              </Text>
            </View>

            {/* Google Authentication */}
            <GoogleAuthButton
              text="S'inscrire avec Google"
              onPress={handleGoogleRegister}
              loading={loading}
            />

            {/* Bottom Login Switch */}
            <View style={styles.footerRow}>
              <Text
                style={[
                  styles.footerPrompt,
                  { color: isDark ? '#9CA3AF' : '#6B7280' },
                ]}
              >
                Vous avez déjà un compte ?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
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
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  checkboxLink: {
    fontWeight: '600',
  },
  errorAgreed: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  ctaButton: {
    marginTop: 4,
    marginBottom: 16,
  },
  dividerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
  },
  footerPrompt: {
    fontSize: 13.5,
  },
  footerLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
