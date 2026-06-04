import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Txt } from './text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional accent color used when selected (defaults to theme accent). */
  tint?: string;
}

export function Chip({ label, selected, onPress, icon, tint }: Props) {
  const t = useTheme();
  const accent = tint ?? t.accent;
  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered;
        return [
          styles.chip,
          {
            backgroundColor: selected ? accent : hovered ? t.surfaceSelected : t.surface,
            borderColor: selected ? accent : hovered ? accent : t.border,
            opacity: state.pressed ? 0.85 : 1,
            transform: [{ scale: hovered && !state.pressed ? 1.03 : 1 }],
          },
        ];
      }}>
      {icon ? (
        <Ionicons name={icon} size={15} color={selected ? t.accentText : t.textSecondary} />
      ) : null}
      <Txt variant="small" weight="semibold" color={selected ? t.accentText : t.textSecondary}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
