import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

interface AuthInputProps extends TextInputProps {
  label?: string;
  isPassword?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
  pill?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  isPassword = false,
  error,
  containerStyle,
  pill = false,
  ...inputProps
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: isDark ? '#E5E7EB' : '#1F2937' },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          pill ? styles.pillRadius : styles.roundedRadius,
          {
            backgroundColor: isDark ? '#1C1A18' : '#FFFFFF',
            borderColor: error
              ? '#EF4444'
              : isFocused
              ? AppColors.primary
              : isDark
              ? '#2E2C29'
              : '#E5E7EB',
          },
        ]}
      >
        <TextInput
          {...inputProps}
          style={[
            styles.textInput,
            { color: isDark ? '#FFFFFF' : '#111827' },
            inputProps.style,
          ]}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          secureTextEntry={isPassword && !showPassword}
          onFocus={e => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowPassword(prev => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={19} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
            ) : (
              <Eye size={19} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  roundedRadius: {
    borderRadius: 14,
  },
  pillRadius: {
    borderRadius: 26,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  iconButton: {
    marginLeft: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});
