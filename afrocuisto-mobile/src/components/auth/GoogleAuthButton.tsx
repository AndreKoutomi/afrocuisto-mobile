import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface GoogleAuthButtonProps {
  text?: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

const GoogleIcon: React.FC = () => (
  <Svg width={19} height={19} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </Svg>
);

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  text = 'Se connecter avec Google',
  onPress,
  loading = false,
  style,
}) => {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isDark ? '#1C1A18' : '#FFFFFF',
          borderColor: isDark ? '#2E2C29' : '#E5E7EB',
        },
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#1F2937'} />
      ) : (
        <>
          <GoogleIcon />
          <Text
            style={[
              styles.text,
              { color: isDark ? '#F3F4F6' : '#1F2937' },
            ]}
          >
            {text}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
