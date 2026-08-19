import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { AppColors } from '../../theme/colors';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  showArrow = false,
  style,
  textStyle,
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isOutline && styles.outlineButton,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : AppColors.primary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Text
            style={[
              styles.text,
              isPrimary ? styles.primaryText : styles.outlineText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {showArrow && (
            <ArrowRight
              size={18}
              color={isPrimary ? '#FFFFFF' : AppColors.primary}
              strokeWidth={2.5}
              style={styles.arrow}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 6,
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: AppColors.primary,
  },
  disabledButton: {
    opacity: 0.65,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: AppColors.primary,
  },
  arrow: {
    marginLeft: 2,
  },
});
