import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Txt } from './ui/text';

const TEXT =
  'Illustrative estimate based on public OOH industry averages. Not a quote or offer — contact media owners for actual rates and availability.';

export function Disclaimer({ text = TEXT }: { text?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: t.surfaceSelected, borderColor: t.border }]}>
      <Ionicons name="information-circle-outline" size={16} color={t.textMuted} style={{ marginTop: 1 }} />
      <Txt variant="small" muted style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
