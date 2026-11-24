import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, FadeOut, ZoomIn } from 'react-native-reanimated';

import { MONTHS, shortDate, toKey, weekday } from '@/planner';
import { makeStyles, useType } from '@/theme';

import { Tap } from './Tap';

type Props = { value: string; min: string; max: string; onChange: (key: string) => void };

const monthKey = (key: string) => key.slice(0, 7);

export function Calendar({ value, min, max, onChange }: Props) {
  const styles = useStyles();
  const type = useType();
  const [{ month, by }, setMonth] = useState({ month: monthKey(value || min), by: 0 });
  const [year, index] = [+month.slice(0, 4), +month.slice(5) - 1];
  const blanks = (new Date(year, index, 1).getDay() + 6) % 7; // weeks start on Monday
  const length = new Date(year, index + 1, 0).getDate();
  const rows = Math.ceil((blanks + length) / 7);

  function step(by: number) {
    setMonth({ month: monthKey(toKey(new Date(year, index + by, 1))), by });
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={type.strong} accessibilityLiveRegion="polite">
          {MONTHS[index]} {year}
        </Text>
        <View style={styles.arrows}>
          <Arrow label="Previous month" glyph="‹" disabled={month <= monthKey(min)} onPress={() => step(-1)} />
          <Arrow label="Next month" glyph="›" disabled={month >= monthKey(max)} onPress={() => step(1)} />
        </View>
      </View>
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <Text key={d} style={[type.small, styles.weekday]}>
            {d}
          </Text>
        ))}
      </View>
      <Animated.View
        key={month}
        entering={by === 0 ? undefined : (by > 0 ? FadeInRight : FadeInLeft).duration(160)}
        style={styles.sheet}>
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: 7 }, (_, col) => {
              const n = row * 7 + col - blanks + 1;
              if (n < 1 || n > length) return <View key={col} style={styles.cell} />;
              const key = toKey(new Date(year, index, n));
              const disabled = key < min || key > max;
              const selected = key === value;
              return (
                <Pressable
                  key={col}
                  accessibilityRole="button"
                  accessibilityLabel={`${weekday(key)} ${shortDate(key)} ${year}`}
                  aria-selected={selected}
                  disabled={disabled}
                  onPress={() => onChange(key)}
                  style={({ pressed }) => [styles.cell, pressed && styles.pressed, selected && styles.selected]}>
                  <Text style={[type.body, disabled && styles.faint, selected && type.strong, selected && styles.red]}>
                    {n}
                  </Text>
                  {selected && (
                    <Animated.View
                      entering={ZoomIn.duration(160)}
                      exiting={FadeOut.duration(100)}
                      style={[StyleSheet.absoluteFill, styles.untouchable]}>
                      <View style={styles.ring} />
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function Arrow({ label, glyph, ...props }: { label: string; glyph: string; disabled: boolean; onPress: () => void }) {
  const styles = useStyles();
  const type = useType();
  return (
    <Tap accessibilityRole="button" accessibilityLabel={label} style={styles.arrow} {...props}>
      <Text style={[type.heading, props.disabled && styles.faint]}>{glyph}</Text>
    </Tap>
  );
}

const useStyles = makeStyles((color) => ({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrows: { flexDirection: 'row', marginRight: -12 },
  arrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', paddingBottom: 4 },
  sheet: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.grid },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.grid,
  },
  pressed: { backgroundColor: color.pressed },
  selected: { zIndex: 1 },
  faint: { color: color.grid },
  red: { color: color.red },
  untouchable: { pointerEvents: 'none' },
  ring: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    left: -3,
    right: -3,
    borderWidth: 2.5,
    borderColor: color.red,
    borderRadius: 999,
    transform: [{ rotate: '-14deg' }],
  },
}));
