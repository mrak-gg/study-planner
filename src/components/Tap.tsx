import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & { style?: StyleProp<ViewStyle> };

/** A Pressable that gives a little under the finger. */
export function Tap({ style, ...props }: Props) {
  const scale = useSharedValue(1);
  const give = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      onPressIn={() => scale.set(withTiming(0.96, { duration: 80 }))}
      onPressOut={() => scale.set(withTiming(1, { duration: 140 }))}
      style={[style, give]}
    />
  );
}
