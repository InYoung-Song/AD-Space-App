import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const cardShadow = Platform.select({
  web: { boxShadow: '0 6px 20px rgba(15, 18, 40, 0.08)' } as object,
  default: {
    shadowColor: '#0B0C10',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});

interface Props extends ViewProps {
  flat?: boolean;
  padded?: boolean;
}

export function Card({ flat, padded, style, ...rest }: Props) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
        !flat && cardShadow,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: { padding: 16 },
});
