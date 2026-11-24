import { memo, useEffect, type ReactElement } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, interpolateColor, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';

import { addDays, duration, shortDate, slices, totalBlocks, weekday, type Plan, type Session } from '@/planner';
import { column, GUTTER, makeStyles, phaseName, useTheme, useType } from '@/theme';

import { Note } from './Note';
import { COLUMNS, Squares } from './Squares';

type Props = {
  plan: Plan;
  title: string;
  subtitle: string;
  footer?: ReactElement;
  /** Both left out for a proposal, which cannot be ticked off yet. */
  onToggle?: (sessionId: string) => void;
  onNote?: (sessionId: string, note: string) => void;
};

const UNITS = [1, 2, 4, 10, 20, 40, 80]; // half hours per square

export function PlanSheet({ plan, title, subtitle, footer, onToggle, onNote }: Props) {
  const styles = useStyles();
  const type = useType();
  const { color } = useTheme();
  const total = totalBlocks(plan.sessions);
  const done = totalBlocks(plan.sessions.filter((s) => s.done));
  const unit = UNITS.find((u) => total / u < COLUMNS * 6) ?? UNITS[UNITS.length - 1];
  const fills = slices(plan.sessions, Math.ceil(total / unit)).map((s) =>
    s.done || !onToggle ? color[s.phase] : undefined,
  );
  const progress = onToggle ? `${duration(done)} of ${duration(total)} done` : `${duration(total)} of study`;

  const weeks: { week: number; data: Session[] }[] = [];
  for (const s of plan.sessions) (weeks[s.week] ??= { week: s.week, data: [] }).data.push(s);

  return (
    <SectionList
      sections={weeks}
      keyExtractor={(s) => s.id}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={column}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View>
          <View style={styles.intro}>
            <Text accessibilityRole="header" style={type.title}>
              {title}
            </Text>
            <Text style={[type.strong, styles.red]}>{subtitle}</Text>
          </View>
          <Squares fills={fills} label={progress} />
          <View style={styles.caption}>
            <Text style={type.strong}>{progress}</Text>
            <Text style={type.small}>
              Each square is {duration(unit)}. The red ring is your exam.
            </Text>
            <View style={styles.legend}>
              {(['learn', 'practise', 'review'] as const).map((p) => (
                <Text key={p} style={[type.body, styles.mark, { backgroundColor: color[p] }]}>
                  {phaseName[p]}
                </Text>
              ))}
            </View>
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => {
        const start = addDays(plan.startDate, section.week * 7);
        const last = addDays(plan.examDate, -1);
        const sixth = addDays(start, 6);
        const end = sixth < last ? sixth : last;
        return (
          <View style={[styles.line, styles.row]}>
            <View style={styles.margin} />
            <View style={[styles.page, styles.week]}>
              <Text accessibilityRole="header" style={type.heading}>
                Week {section.week + 1}
              </Text>
              <Text style={type.small}>
                {start === end ? shortDate(start) : `${shortDate(start)} to ${shortDate(end)}`},{' '}
                {duration(totalBlocks(section.data))}
              </Text>
            </View>
          </View>
        );
      }}
      renderItem={({ item }) => <Row session={item} onToggle={onToggle} onNote={onNote} />}
      ListFooterComponent={footer}
    />
  );
}

type RowProps = { session: Session } & Pick<Props, 'onToggle' | 'onNote'>;

const Row = memo(function Row({ session, onToggle, onNote }: RowProps) {
  const styles = useStyles();
  const type = useType();
  const { color } = useTheme();
  const { id, date, title, detail, blocks, phase, done, note } = session;
  const { ink, markInk } = color;
  const sweep = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    sweep.set(withTiming(done ? 1 : 0, { duration: 220 }));
  }, [done, sweep]);

  const stroke = useAnimatedStyle(() => ({ transform: [{ scaleX: sweep.value }] }));
  const writing = useAnimatedStyle(() => ({ color: interpolateColor(sweep.value, [0, 1], [ink, markInk]) }));

  return (
    <View style={styles.line}>
      <Pressable
        focusable={!!onToggle}
        onPress={onToggle && (() => onToggle(id))}
        accessibilityRole={onToggle ? 'checkbox' : undefined}
        aria-checked={onToggle && done}
        accessibilityLabel={`${title}, ${weekday(date)} ${shortDate(date)}, ${duration(blocks)}. ${detail}`}
        style={({ pressed }) => [styles.row, pressed && onToggle && styles.pressed]}>
        <View style={styles.margin}>
          <Text style={type.strong}>{weekday(date)}</Text>
          <Text style={type.small}>{shortDate(date)}</Text>
        </View>
        <View style={[styles.page, styles.entry]}>
          <View style={styles.text}>
            <View style={styles.titleWrap}>
              <Animated.View style={[styles.sweep, { backgroundColor: color[phase] }, stroke]} />
              <Animated.Text style={[type.strong, writing]}>{title}</Animated.Text>
            </View>
            <Text style={type.small}>{detail}</Text>
          </View>
          <View style={styles.side}>
            {onToggle && (
              <View style={styles.box}>
                {done && (
                  <Animated.View
                    entering={ZoomIn.duration(160)}
                    exiting={FadeOut.duration(120)}
                    style={[StyleSheet.absoluteFill, styles.fill, { backgroundColor: color[phase] }]}>
                    <View style={styles.tick} />
                  </Animated.View>
                )}
              </View>
            )}
            <Text style={type.small}>{duration(blocks)}</Text>
          </View>
        </View>
      </Pressable>
      {onNote && <Note title={title} note={note ?? ''} open={done || !!note} onChange={(text) => onNote(id, text)} />}
    </View>
  );
});

const useStyles = makeStyles((color) => ({
  content: { paddingBottom: 32 },
  intro: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 18, gap: 4 },
  red: { color: color.red },
  caption: { paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 24 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  mark: { paddingHorizontal: 8, color: color.markInk },
  line: { borderTopWidth: 1, borderColor: color.grid },
  row: { flexDirection: 'row' },
  margin: { width: 84, paddingLeft: GUTTER, paddingVertical: 12, borderRightWidth: 1.5, borderColor: color.red },
  page: { flex: 1, paddingLeft: 14, paddingRight: GUTTER, paddingVertical: 12 },
  week: { paddingTop: 26 },
  entry: { flexDirection: 'row', gap: 12 },
  text: { flex: 1, gap: 2 },
  titleWrap: { alignSelf: 'flex-start' },
  sweep: { position: 'absolute', top: 2, bottom: 1, left: -5, right: -5, transformOrigin: 'left' },
  side: { alignItems: 'flex-end', gap: 4 },
  box: { width: 26, height: 26, borderWidth: 1.5, borderColor: color.ink },
  fill: { alignItems: 'center' },
  tick: {
    width: 8,
    height: 15,
    marginTop: 1,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: color.markInk,
    transform: [{ rotate: '42deg' }],
  },
  pressed: { backgroundColor: color.pressed },
}));
