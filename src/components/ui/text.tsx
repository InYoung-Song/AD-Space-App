import { Text as RNText, type TextProps } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'display' | 'title' | 'heading' | 'subtitle' | 'body' | 'small' | 'label';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

const weights: Record<Weight, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

const variants: Record<Variant, { fontSize: number; lineHeight: number; weight: Weight }> = {
  display: { fontSize: FontSize.display, lineHeight: 38, weight: 'bold' },
  title: { fontSize: FontSize.xxl, lineHeight: 32, weight: 'bold' },
  heading: { fontSize: FontSize.xl, lineHeight: 26, weight: 'semibold' },
  subtitle: { fontSize: FontSize.lg, lineHeight: 24, weight: 'semibold' },
  body: { fontSize: FontSize.md, lineHeight: 22, weight: 'regular' },
  small: { fontSize: FontSize.sm, lineHeight: 18, weight: 'regular' },
  label: { fontSize: FontSize.xs, lineHeight: 16, weight: 'semibold' },
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  weight?: Weight;
  center?: boolean;
}

export function Txt({ variant = 'body', color, muted, weight, center, style, ...rest }: Props) {
  const t = useTheme();
  const v = variants[variant];
  const resolved = color ?? (muted ? t.textMuted : t.text);
  return (
    <RNText
      style={[
        { color: resolved, fontSize: v.fontSize, lineHeight: v.lineHeight, fontWeight: weights[weight ?? v.weight] },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}
