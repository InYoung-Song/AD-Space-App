import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { Txt } from './text';

interface Props {
  label: string;
  color: string;
  /** Background uses the color at low opacity; text uses the color. */
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Adds alpha to a #rrggbb color. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export function Badge({ label, color, icon }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(color, 0.14) }]}>
      {icon ? <Ionicons name={icon} size={13} color={color} /> : null}
      <Txt variant="label" color={color}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
});
