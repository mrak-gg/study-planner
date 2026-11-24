import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useType } from '@/theme';

import { Tap } from './Tap';

/** A new exercise book. Its cover label asks for what the form asks for. */
export function BlankBook({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const type = useType();
  const landed = useSharedValue(0);

  useEffect(() => {
    landed.set(withTiming(1, { duration: 360, easing: Easing.out(Easing.back(1.6)) }));
  }, [landed]);

  const drop = useAnimatedStyle(() => ({
    opacity: Math.min(1, landed.value * 2),
    transform: [{ translateY: (1 - landed.value) * 28 }, { rotate: `${-12 + landed.value * 8}deg` }],
  }));

  return (
    <Animated.View style={[styles.place, drop]}>
      <Tap accessibilityRole="button" accessibilityLabel="Add your first exam" onPress={onPress} style={styles.cover}>
        <View style={styles.spine} />
        <View style={styles.label}>
          {['Subject', 'Exam date', 'Hours per week'].map((line) => (
            <View key={line} style={styles.line}>
              <Text maxFontSizeMultiplier={1.2} style={[type.small, styles.ink]}>
                {line}
              </Text>
            </View>
          ))}
        </View>
      </Tap>
    </Animated.View>
  );
}

const useStyles = makeStyles((color) => ({
  place: { alignSelf: 'center', marginTop: 12 },
  cover: {
    width: 232,
    height: 306,
    paddingTop: 44,
    paddingLeft: 48,
    paddingRight: 24,
    backgroundColor: color.cover,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  spine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 24, backgroundColor: '#C81E38' },
  // The label is paper and ink in both themes.
  label: { backgroundColor: '#FBFCFF', paddingHorizontal: 14, paddingTop: 4, paddingBottom: 20, borderRadius: 3 },
  line: { paddingTop: 12, paddingBottom: 2, borderBottomWidth: 1, borderColor: '#BFD0F0' },
  ink: { color: '#1B2A7A' },
}));
