import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useTheme } from '@/theme';

/** A sun that slides across and becomes a crescent moon. */
export function ThemeSwitch() {
  const styles = useStyles();
  const { dark, next, toggle } = useTheme();
  const slide = useSharedValue(dark ? 1 : 0);

  useEffect(() => {
    slide.set(withTiming(next === 'dark' ? 1 : 0, { duration: 280 }));
  }, [next, slide]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: slide.value * 26 }] }));
  const bite = useAnimatedStyle(() => ({ transform: [{ translateX: 22 - slide.value * 14 }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      aria-checked={dark}
      hitSlop={8}
      onPress={toggle}
      style={styles.track}>
      <Animated.View style={[styles.thumb, thumb]}>
        <Animated.View style={[styles.bite, bite]} />
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((color) => ({
  track: { width: 58, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: color.ink, padding: 3.5 },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.learn, overflow: 'hidden' },
  bite: { position: 'absolute', top: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: color.paper },
}));
