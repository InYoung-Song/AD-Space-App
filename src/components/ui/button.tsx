import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Txt } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const heights: Record<Size, number> = { sm: 38, md: 46, lg: 54 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  fullWidth,
}: Props) {
  const t = useTheme();

  const bg =
    variant === 'primary' ? t.accent : variant === 'danger' ? t.danger : variant === 'secondary' ? t.surfaceSelected : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? variant === 'primary'
        ? t.accentText
        : '#fff'
      : variant === 'secondary'
        ? t.text
        : t.accent;
  const borderColor = variant === 'ghost' ? t.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && { alignSelf: 'stretch' },
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Txt weight="semibold" color={fg} style={{ fontSize: size === 'sm' ? 14 : 15 }}>
            {title}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
