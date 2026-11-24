import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { GUTTER, makeStyles, useTheme, useType } from '@/theme';

type Props = { title: string; note: string; open: boolean; onChange: (note: string) => void };

/** A quiet line under a finished activity that turns into a small editor when tapped. */
export function Note({ title, note, open, onChange }: Props) {
  const styles = useStyles();
  const type = useType();
  const { color, scheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const height = useSharedValue(0);
  const shown = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    shown.set(withTiming(open ? 1 : 0, { duration: 180 }));
  }, [open, shown]);

  const reveal = useAnimatedStyle(() => ({ height: height.value * shown.value, opacity: shown.value }));

  function measure(next: number) {
    // The first measurement only sizes the line; later ones grow or shrink it.
    height.set(height.get() ? withTiming(next, { duration: 140 }) : next);
  }

  function close() {
    setEditing(false);
    if (note !== note.trim()) onChange(note.trim());
  }

  return (
    <View style={styles.row}>
      <View style={styles.margin} />
      <Animated.View style={[styles.clip, reveal]}>
        {open && (
          <View style={styles.content} onLayout={(e) => measure(e.nativeEvent.layout.height)}>
            {editing ? (
              <TextInput
                accessibilityLabel={`Note for ${title}`}
                autoFocus
                multiline
                scrollEnabled={false}
                submitBehavior="blurAndSubmit"
                returnKeyType="done"
                maxLength={300}
                keyboardAppearance={scheme}
                selectionColor={color.ink}
                value={note}
                onChangeText={onChange}
                onBlur={close}
                style={[type.note, styles.input]}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={note ? `Edit note for ${title}: ${note}` : `Add note for ${title}`}
                hitSlop={8}
                onPress={() => setEditing(true)}
                style={({ pressed }) => [styles.closed, pressed && styles.pressed]}>
                <Text style={note ? type.note : type.small}>{note || 'Add note'}</Text>
              </Pressable>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((color) => ({
  row: { flexDirection: 'row' },
  margin: { width: 84, borderRightWidth: 1.5, borderColor: color.red },
  clip: { flex: 1, overflow: 'hidden', marginTop: -7 },
  content: { position: 'absolute', top: 0, left: 14, right: GUTTER, paddingBottom: 12 },
  closed: { alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
  input: { padding: 0, paddingBottom: 3, borderBottomWidth: 1, borderColor: color.ink, outlineStyle: 'solid', outlineWidth: 0 },
}));
