import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userEmail = route.params?.email || 'andre@afrocuisto.app';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Veuillez saisir votre nouveau mot de passe';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit comporter au moins 6 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Simulate password update
      await new Promise(resolve => setTimeout(resolve, 700));
      navigation.navigate('ResetSuccess', { email: userEmail });
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

          {/* Figma Header */}
          <AuthHeader
            title="Réinitialisation de mot de passe"
            subtitle="Choisissez un mot de passe sécurisé pour votre compte."
            logoSize={68}
          />

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <AuthInput
              label="Entrez votre nouveau mot de passe"
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
              label="Entrez à nouveau le mot de passe"
              placeholder="Entrez votre mot de passe"
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

            {/* Confirm CTA */}
            <AuthButton
              title="CONFIRMER"
              onPress={handleConfirm}
              loading={loading}
              style={styles.ctaButton}
            />
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
    marginTop: 18,
  },
});
