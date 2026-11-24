import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Calendar } from '@/components/Calendar';
import { Tap } from '@/components/Tap';
import { addDays, MAX_DAYS, MAX_HOURS, toKey, validate, type Details } from '@/planner';
import { column, GUTTER, makeStyles, useTheme, useType } from '@/theme';

const shift = LinearTransition.duration(160);

export default function NewExam() {
  const styles = useStyles();
  const type = useType();
  const { color, scheme } = useTheme();
  const [details, setDetails] = useState<Details>({ subject: '', hours: '6', examDate: '' });
  const [tried, setTried] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const today = toKey(new Date());
  const errors = tried ? validate(details, today) : {};

  const set = (change: Partial<Details>) => setDetails((d) => ({ ...d, ...change }));
  const stepHours = (by: number) =>
    set({ hours: String(Math.min(MAX_HOURS, Math.max(1, (parseInt(details.hours, 10) || 0) + by))) });

  function propose() {
    setTried(true);
    if (Object.keys(validate(details, today)).length === 0) router.navigate({ pathname: '/proposal', params: details });
    else scroll.current?.scrollTo({ y: 0 });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <ScrollView
        ref={scroll}
        style={column}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Text accessibilityRole="header" style={type.title}>
          Add an exam
        </Text>

        <View>
          <Text style={type.strong}>Subject</Text>
          <TextInput
            accessibilityLabel="Subject"
            value={details.subject}
            onChangeText={(subject) => set({ subject })}
            maxLength={60}
            returnKeyType="done"
            keyboardAppearance={scheme}
            selectionColor={color.ink}
            style={[type.heading, styles.input, !!errors.subject && styles.wrong]}
          />
          <Problem text={errors.subject} />
        </View>

        <Animated.View layout={shift}>
          <Text style={type.strong}>Hours you can study per week</Text>
          <View style={styles.stepper}>
            <Step label="One hour less" glyph="−" onPress={() => stepHours(-1)} />
            <TextInput
              accessibilityLabel="Hours you can study per week"
              value={details.hours}
              onChangeText={(hours) => set({ hours })}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              returnKeyType="done"
              keyboardAppearance={scheme}
              selectionColor={color.ink}
              style={[type.heading, styles.input, styles.hours, !!errors.hours && styles.wrong]}
            />
            <Step label="One hour more" glyph="+" onPress={() => stepHours(1)} />
          </View>
          <Problem text={errors.hours} />
        </Animated.View>

        <Animated.View layout={shift}>
          <Text style={type.strong}>Exam date</Text>
          <Problem text={errors.examDate} />
          <Calendar
            value={details.examDate}
            min={addDays(today, 1)}
            max={addDays(today, MAX_DAYS)}
            onChange={(examDate) => set({ examDate })}
          />
        </Animated.View>
      </ScrollView>
      <View style={[column, styles.bar]}>
        <Button label="Propose a plan" onPress={propose} />
      </View>
    </SafeAreaView>
  );
}

function Problem({ text }: { text?: string }) {
  const styles = useStyles();
  const type = useType();
  if (!text) return null;
  return (
    <Animated.Text entering={FadeIn.duration(160)} accessibilityRole="alert" style={[type.body, styles.red]}>
      {text}
    </Animated.Text>
  );
}

function Step({ label, glyph, onPress }: { label: string; glyph: string; onPress: () => void }) {
  const styles = useStyles();
  const type = useType();
  return (
    <Tap accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.step}>
      <Text style={type.heading}>{glyph}</Text>
    </Tap>
  );
}

const useStyles = makeStyles((color) => ({
  screen: { flex: 1, backgroundColor: color.paper },
  content: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 24, gap: 28 },
  input: { minHeight: 52, paddingHorizontal: 0, paddingVertical: 8, borderBottomWidth: 1.5, borderColor: color.ink },
  wrong: { borderColor: color.red },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  hours: { width: 72, textAlign: 'center' },
  step: { width: 52, height: 52, borderWidth: 1, borderColor: color.ink, alignItems: 'center', justifyContent: 'center' },
  red: { color: color.red },
  bar: { paddingHorizontal: GUTTER, paddingVertical: 12 },
}));
