import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import { GUTTER, makeStyles } from '@/theme';

export const COLUMNS = 14;

/** Squared paper. Each fill is one square, and the last one is ringed in red for the exam. */
export function Squares({ fills, label }: { fills: (string | undefined)[]; label?: string }) {
  const styles = useStyles();
  const total = fills.length + 1;
  const rows = Math.ceil(total / COLUMNS);
  return (
    <View
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      style={styles.sheet}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: COLUMNS }, (_, col) => {
            const i = row * COLUMNS + col;
            return (
              <View key={col} style={[styles.cell, i === fills.length && styles.exam]}>
                {fills[i] && (
                  <Animated.View
                    entering={ZoomIn.duration(160).delay(col * 14)}
                    exiting={FadeOut.duration(120)}
                    style={[StyleSheet.absoluteFill, { backgroundColor: fills[i] }]}
                  />
                )}
                {i === fills.length && <View style={styles.ring} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((color) => ({
  sheet: { marginHorizontal: GUTTER, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.grid },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: color.grid },
  exam: { zIndex: 1 },
  ring: {
    position: 'absolute',
    top: -1,
    bottom: -2,
    left: -4,
    right: -4,
    borderWidth: 2.5,
    borderColor: color.red,
    borderRadius: 999,
    transform: [{ rotate: '-14deg' }],
  },
}));
