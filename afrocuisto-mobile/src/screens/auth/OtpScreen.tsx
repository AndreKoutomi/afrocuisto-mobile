import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { AuthButton } from '../../components/auth/AuthButton';

export const OtpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const { isDark } = useTheme();

  const userEmail = route.params?.email || 'andre@afrocuisto.app';
  const fromReset = route.params?.fromReset ?? true;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    setError(null);
    // Handle paste of multiple characters
    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      chars.forEach((c, i) => {
        newOtp[i] = c;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(chars.length, 5);
      inputsRef.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError(null);
    inputsRef.current[0]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Veuillez saisir les 6 chiffres du code OTP');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      if (fromReset) {
        navigation.navigate('ResetPassword', { email: userEmail });
      } else {
        await login();
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (e) {
      setError('Code incorrect. Veuillez réessayer.');
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
            sectionTitle={fromReset ? 'Réinitialisation de mot de passe' : undefined}
            title="Vérification OTP"
            subtitle="Entrer le code OTP de 6 chiffres reçu par email :"
            logoSize={68}
          />

          {/* OTP boxes row */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => {
              const isFilled = digit.length > 0;
              return (
                <TextInput
                  key={index}
                  ref={el => {
                    inputsRef.current[index] = el;
                  }}
                  value={digit}
                  onChangeText={val => handleOtpChange(val, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: isDark ? '#1C1A18' : '#FFFFFF',
                      borderColor: isFilled
                        ? AppColors.primary
                        : isDark
                        ? '#2E2C29'
                        : '#E5E7EB',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Error message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Resend row */}
          <View style={styles.resendRow}>
            <Text
              style={[
                styles.resendPrompt,
                { color: isDark ? '#9CA3AF' : '#6B7280' },
              ]}
            >
              Vous n'avez pas reçu le code ?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.resendLink,
                  !canResend && { color: isDark ? '#4B5563' : '#9CA3AF' },
                ]}
              >
                {canResend ? 'Renvoyer' : `Renvoyer (${timer}s)`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA Button */}
          <AuthButton
            title="ENVOYER"
            onPress={handleSubmit}
            loading={loading}
            style={styles.ctaButton}
          />
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 18,
  },
  otpBox: {
    flex: 1,
    height: 54,
    maxWidth: 50,
    borderWidth: 1.5,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    padding: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 28,
  },
  resendPrompt: {
    fontSize: 13.5,
  },
  resendLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: AppColors.primary,
  },
  ctaButton: {
    marginTop: 6,
  },
});
