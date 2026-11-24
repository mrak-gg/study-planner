import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PlanSheet } from '@/components/PlanSheet';
import { proposePlan, shortDate, toKey, validate, weekday } from '@/planner';
import { usePlans } from '@/plans';
import { column, GUTTER, makeStyles } from '@/theme';

export default function Proposal() {
  const styles = useStyles();
  const { savePlan } = usePlans();
  const { subject = '', hours = '', examDate = '' } = useLocalSearchParams<{
    subject: string;
    hours: string;
    examDate: string;
  }>();
  // Built once: the id stays the same if "Save plan" is pressed twice.
  const [plan] = useState(() => {
    const details = { subject: String(subject), hours: String(hours), examDate: String(examDate) };
    const now = new Date();
    const today = toKey(now);
    return Object.keys(validate(details, today)).length ? null : proposePlan(String(now.getTime()), details, today);
  });

  if (!plan) return <Redirect href="/new" />;

  function save() {
    if (!plan) return;
    savePlan(plan);
    router.dismissTo('/');
    router.push({ pathname: '/plan/[id]', params: { id: plan.id } });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <PlanSheet
        plan={plan}
        title={`Proposed plan for ${plan.subject}`}
        subtitle={`${plan.sessions.length} ${plan.sessions.length === 1 ? 'activity' : 'activities'} before ${weekday(plan.examDate)} ${shortDate(plan.examDate)}`}
      />
      <View style={[column, styles.bar]}>
        <Button label="Save plan" onPress={save} />
        <Button label="Change details" quiet onPress={() => router.dismissTo('/new')} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((color) => ({
  screen: { flex: 1, backgroundColor: color.paper },
  bar: { paddingHorizontal: GUTTER, paddingTop: 12, borderTopWidth: 1, borderColor: color.grid },
}));
