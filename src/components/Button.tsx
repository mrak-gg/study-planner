import { StyleSheet, Text } from 'react-native';

import { useTheme, useType } from '@/theme';

import { Tap } from './Tap';

type Props = { label: string; onPress: () => void; quiet?: boolean; danger?: boolean };

export function Button({ label, onPress, quiet, danger }: Props) {
  const { color } = useTheme();
  const type = useType();
  const tint = danger ? color.red : color.ink;
  return (
    <Tap accessibilityRole="button" onPress={onPress} style={[styles.button, !quiet && { backgroundColor: tint }]}>
      <Text style={[type.strong, { color: quiet ? tint : color.paper }]}>{label}</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
