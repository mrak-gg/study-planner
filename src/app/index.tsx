import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlankBook } from '@/components/BlankBook';
import { Button } from '@/components/Button';
import { COLUMNS, Squares } from '@/components/Squares';
import { Tap } from '@/components/Tap';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { countdown, slices, toKey } from '@/planner';
import { usePlans } from '@/plans';
import { column, GUTTER, makeStyles, useTheme, useType } from '@/theme';

export default function Home() {
  const styles = useStyles();
  const type = useType();
  const { color } = useTheme();
  const plans = usePlans().plans ?? [];
  const today = toKey(new Date());
  const add = () => router.navigate('/new');

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={column} contentContainerStyle={styles.content}>
        <View style={[styles.inset, styles.top]}>
          <Text accessibilityRole="header" style={[type.title, styles.title]}>
            {plans.length ? 'Your exams' : 'When is your next exam?'}
          </Text>
          <ThemeSwitch />
        </View>

        {!plans.length && (
          <>
            <Text style={[type.body, styles.inset]}>
              Fill in three things and get a study plan that runs up to exam day.
            </Text>
            <BlankBook onPress={add} />
          </>
        )}

        {plans.map((plan, i) => {
          const done = plan.sessions.filter((s) => s.done).length;
          return (
            <Animated.View
              key={plan.id}
              entering={FadeIn.duration(200).delay(Math.min(i, 5) * 40)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}>
              <Tap
                accessibilityRole="button"
                accessibilityLabel={`${plan.subject}, ${countdown(plan.examDate, today)}, ${done} of ${plan.sessions.length} activities done`}
                onPress={() => router.navigate({ pathname: '/plan/[id]', params: { id: plan.id } })}
                style={styles.exam}>
                <View style={styles.inset}>
                  <Text style={type.heading}>{plan.subject}</Text>
                  <Text style={[type.strong, styles.red]}>{countdown(plan.examDate, today)}</Text>
                </View>
                <Squares
                  fills={slices(plan.sessions, COLUMNS - 1).map((s) => (s.done ? color[s.phase] : undefined))}
                />
                <Text style={[type.small, styles.inset]}>
                  {done} of {plan.sessions.length} activities done
                </Text>
              </Tap>
            </Animated.View>
          );
        })}
      </ScrollView>
      <View style={[column, styles.bar]}>
        <Button label="Add an exam" onPress={add} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((color) => ({
  screen: { flex: 1, backgroundColor: color.paper },
  content: { paddingTop: 28, paddingBottom: 24, gap: 24 },
  inset: { paddingHorizontal: GUTTER },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  title: { flex: 1 },
  exam: { gap: 8, paddingVertical: 8 },
  red: { color: color.red },
  bar: { paddingHorizontal: GUTTER, paddingVertical: 12 },
}));
