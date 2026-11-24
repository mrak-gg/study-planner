import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PlanSheet } from '@/components/PlanSheet';
import { countdown, toKey } from '@/planner';
import { usePlans } from '@/plans';
import { GUTTER, makeStyles, useType } from '@/theme';

export default function PlanScreen() {
  const styles = useStyles();
  const type = useType();
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plans, updateSession, deletePlan } = usePlans();
  const [confirming, setConfirming] = useState(false);
  const plan = plans?.find((p) => p.id === id);

  const toggle = useCallback(
    (sessionId: string) => updateSession(id, sessionId, (s) => ({ done: !s.done })),
    [id, updateSession],
  );
  const setNote = useCallback(
    (sessionId: string, note: string) => updateSession(id, sessionId, () => ({ note })),
    [id, updateSession],
  );

  if (!plan) return <Redirect href="/" />;

  function remove() {
    router.dismissTo('/');
    deletePlan(id);
  }

  return (
    // iOS scrolls the note being written into view by itself; Android needs the room made for it.
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === 'android'}
      keyboardVerticalOffset={headerHeight}
      style={styles.screen}>
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <PlanSheet
          plan={plan}
          title={plan.subject}
          subtitle={countdown(plan.examDate, toKey(new Date()))}
          onToggle={toggle}
          onNote={setNote}
          footer={
            <View style={styles.footer}>
              {confirming ? (
                <Animated.View entering={FadeIn.duration(160)} style={styles.confirm}>
                  <Text style={type.body}>Delete {plan.subject} and everything you marked as complete?</Text>
                  <View style={styles.choice}>
                    <Button label="Delete plan" danger onPress={remove} />
                    <Button label="Keep plan" quiet onPress={() => setConfirming(false)} />
                  </View>
                </Animated.View>
              ) : (
                <Button label="Delete plan" quiet danger onPress={() => setConfirming(true)} />
              )}
            </View>
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((color) => ({
  screen: { flex: 1, backgroundColor: color.paper },
  footer: { padding: GUTTER, borderTopWidth: 1, borderColor: color.grid },
  confirm: { gap: 8 },
  choice: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
}));
