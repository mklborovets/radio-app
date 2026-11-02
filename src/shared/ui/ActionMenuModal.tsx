import React from 'react';
import {
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from './theme';

export interface ActionMenuOption {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  isDone?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface ActionMenuModalProps {
  visible: boolean;
  title?: string;
  options: ActionMenuOption[];
  onClose: () => void;
  closeLabel?: string;
  closeOnSelect?: boolean;
  cancelVariant?: 'outline' | 'ghost';
}

export function ActionMenuModal({
  visible,
  title,
  options,
  onClose,
  closeLabel = 'CLOSE',
  closeOnSelect = true,
  cancelVariant = 'ghost',
}: ActionMenuModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.card}>
          {Boolean(title) && (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          )}

          {options.map((option, index) => {
            const handlePress = () => {
              if (closeOnSelect) {
                onClose();
              }
              option.onPress();
            };

            return (
              <TouchableOpacity
                key={`${option.label}-${index}`}
                style={[
                  styles.option,
                  option.isDestructive && styles.optionDestructive,
                  option.style,
                ]}
                disabled={option.disabled}
                onPress={handlePress}>
                <Text
                  style={[
                    styles.optionText,
                    option.isActive && styles.optionTextActive,
                    option.isDestructive && styles.optionTextDestructive,
                    option.isDone && styles.optionTextDone,
                    option.textStyle,
                  ]}
                  numberOfLines={1}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.cancelOption,
              cancelVariant === 'outline' && styles.cancelOptionOutline,
            ]}
            onPress={onClose}>
            <Text
              style={[
                styles.cancelText,
                cancelVariant === 'outline' && styles.cancelTextOutline,
              ]}>
              {closeLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionDestructive: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  optionTextActive: {
    color: COLORS.primary,
  },
  optionTextDestructive: {
    color: COLORS.accent,
  },
  optionTextDone: {
    color: COLORS.accent,
  },
  cancelOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginTop: 4,
  },
  cancelOptionOutline: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  cancelTextOutline: {
    color: COLORS.textSecondary,
  },
});

