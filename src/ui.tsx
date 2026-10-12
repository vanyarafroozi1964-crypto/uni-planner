import React from 'react';
import {
  I18nManager, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleProp, StyleSheet,
  Text, TextInput, TextInputProps, TextStyle, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from './store';

/** چیدمان ردیفی راست‌به‌چپ مستقل از وضعیت I18nManager */
export const ROW = (I18nManager.isRTL ? 'row' : 'row-reverse') as 'row' | 'row-reverse';

export function Txt({ size = 15, bold, sub, color, style, children, numberOfLines }: {
  size?: number; bold?: boolean; sub?: boolean; color?: string; style?: StyleProp<TextStyle>;
  children?: React.ReactNode; numberOfLines?: number;
}) {
  const { theme } = useApp();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontSize: size, fontWeight: bold ? '700' : '400', color: color ?? (sub ? theme.sub : theme.text), textAlign: 'right', writingDirection: 'rtl' }, style]}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<any> }) {
  const { theme } = useApp();
  return (
    <View style={[{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 14, marginBottom: 12 }, style]}>
      {children}
    </View>
  );
}

export function Btn({ label, onPress, kind = 'primary', small, style }: {
  label: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; small?: boolean; style?: StyleProp<any>;
}) {
  const { theme } = useApp();
  const bg = kind === 'primary' ? theme.primary : kind === 'danger' ? theme.danger + '22' : theme.chip;
  const fg = kind === 'primary' ? theme.onPrimary : kind === 'danger' ? theme.danger : theme.text;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: '#00000020' }}
      style={[{ backgroundColor: bg, paddingVertical: small ? 8 : 12, paddingHorizontal: small ? 12 : 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Txt bold color={fg} size={small ? 13 : 15} style={{ textAlign: 'center' }}>{label}</Txt>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected?: boolean; onPress: () => void; color?: string }) {
  const { theme } = useApp();
  const on = color ?? theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: selected ? on : theme.chip, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginEnd: 8, marginBottom: 8 }}
    >
      <Txt size={14} bold={selected} color={selected ? '#FFFFFF' : theme.text} style={{ textAlign: 'center' }}>{label}</Txt>
    </Pressable>
  );
}

export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string }) {
  const { theme } = useApp();
  return (
    <View style={{ marginBottom: 12 }}>
      <Txt size={13} sub style={{ marginBottom: 6 }}>{label}</Txt>
      <TextInput
        placeholderTextColor={theme.sub}
        {...props}
        style={[{ backgroundColor: theme.card, borderWidth: 1, borderColor: error ? theme.danger : theme.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: theme.text, fontSize: 15, textAlign: 'right', writingDirection: 'rtl' }, style]}
      />
      {error ? <Txt size={12} color={theme.danger} style={{ marginTop: 4 }}>{error}</Txt> : null}
    </View>
  );
}

export function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  const { theme } = useApp();
  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.chip, overflow: 'hidden', flexDirection: ROW }}>
      <View style={{ width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color ?? theme.success, borderRadius: 5 }} />
    </View>
  );
}

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0009' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', paddingBottom: insets.bottom + 8 }}>
            <View style={{ flexDirection: ROW, alignItems: 'center', padding: 16, paddingBottom: 8 }}>
              <Txt size={18} bold style={{ flex: 1 }}>{title}</Txt>
              <Pressable onPress={onClose} hitSlop={12}><Txt size={20} sub>✕</Txt></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
