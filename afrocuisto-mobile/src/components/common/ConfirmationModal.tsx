import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Trash2, AlertTriangle, HelpCircle, Info, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

export type ConfirmationType = 'destructive' | 'warning' | 'info';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  type = 'destructive',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
}) => {
  const { isDark } = useTheme();

  if (!visible) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'destructive':
        return {
          icon: Trash2,
          color: '#EF4444',
          bg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
          btnBg: '#EF4444',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
          btnBg: '#F59E0B',
        };
      case 'info':
      default:
        return {
          icon: Info,
          color: AppColors.primary,
          bg: isDark ? 'rgba(255, 83, 42, 0.16)' : '#FFEFEA',
          btnBg: AppColors.primary,
        };
    }
  };

  const config = getIconConfig();
  const IconComponent = config.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? '#1F1C1A' : '#FFFFFF',
                  borderColor: isDark ? '#332E2A' : '#EFECE6',
                },
              ]}
            >
              {/* Icône d'alerte stylisée */}
              <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
                <IconComponent size={24} color={config.color} strokeWidth={2.2} />
              </View>

              {/* Titre & Message */}
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.message,
                  { color: isDark ? '#A8A29E' : '#78716C' },
                ]}
              >
                {message}
              </Text>

              {/* Boutons d'Action (Annuler & Confirmer) */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.cancelBtn,
                    {
                      backgroundColor: isDark ? '#2B2623' : '#F5F3EF',
                      borderColor: isDark ? '#3D3834' : '#E5E2DA',
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={onCancel}
                >
                  <Text
                    style={[
                      styles.cancelBtnText,
                      { color: isDark ? '#D6D3CD' : '#57534E' },
                    ]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.confirmBtn,
                    { backgroundColor: config.btnBg },
                  ]}
                  activeOpacity={0.85}
                  onPress={onConfirm}
                >
                  <Text style={styles.confirmBtnText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

