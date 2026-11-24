export type Phase = 'learn' | 'practise' | 'review';

export type Session = {
  id: string;
  week: number;
  date: string; // YYYY-MM-DD, local
  blocks: number; // half hours
  phase: Phase;
  title: string;
  detail: string;
  done: boolean;
  note?: string;
};

export type Plan = {
  id: string;
  subject: string;
  startDate: string;
  examDate: string;
  sessions: Session[];
};

export type Details = { subject: string; hours: string; examDate: string };

export const MAX_HOURS = 60;
export const MAX_DAYS = 365;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function toKey(d: Date) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n, i) => String(n).padStart(i ? 2 : 4, '0'))
    .join('-');
}

/** Local midnight, or null when the string is not a real calendar day. */
export function parseDay(key: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return toKey(d) === key ? d : null;
}

function day(key: string) {
  const d = parseDay(key);
  if (!d) throw new Error(`Not a date: ${key}`);
  return d;
}

export function addDays(key: string, n: number) {
  const d = day(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

// Rounded because a day is 23 or 25 hours long when the clocks change.
export function daysBetween(from: string, to: string) {
  return Math.round((day(to).getTime() - day(from).getTime()) / 86_400_000);
}

export const weekday = (key: string) => WEEKDAYS[day(key).getDay()];

export function shortDate(key: string) {
  const d = day(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function duration(blocks: number) {
  const hours = Math.floor(blocks / 2);
  return [hours && `${hours} h`, blocks % 2 && '30 min'].filter(Boolean).join(' ') || '0 h';
}

export function countdown(examDate: string, today: string) {
  const n = daysBetween(today, examDate);
  const left = n > 1 ? `${n} days left` : n === 1 ? 'tomorrow' : n === 0 ? 'today' : 'exam over';
  return `${weekday(examDate)} ${shortDate(examDate)}, ${left}`;
}

export function validate({ subject, hours, examDate }: Details, today: string) {
  const errors: Partial<Details> = {};
  if (!subject.trim()) errors.subject = 'Enter the subject of your exam.';
  if (!/^\d+$/.test(hours) || +hours < 1 || +hours > MAX_HOURS) {
    errors.hours = `Enter a whole number of hours from 1 to ${MAX_HOURS}.`;
  }
  const days = parseDay(examDate) ? daysBetween(today, examDate) : 0;
  if (days < 1 || days > MAX_DAYS) errors.examDate = 'Choose a date from tomorrow up to a year ahead.';
  return errors;
}

type Activity = Pick<Session, 'phase' | 'title' | 'detail'>;

/** Map the topics, learn them in parts, practise the parts, sit mock exams, recap. */
function activities(count: number): Activity[] {
  const recap: Activity = {
    phase: 'review',
    title: 'Final recap',
    detail: 'Read through your notes and redo the question you found hardest.',
  };
  if (count === 1) return [recap];

  const map: Activity[] =
    count < 4
      ? []
      : [
          {
            phase: 'learn',
            title: 'Map the exam',
            detail: 'List every topic that can come up and split the list into equal parts.',
          },
        ];
  const middle = count - map.length - 1;
  const learn = Math.round(middle * 0.5);
  const practise = Math.round((middle - learn) * 0.6);
  const review = middle - learn - practise;

  return [
    ...map,
    ...Array.from({ length: learn }, (_, i): Activity => ({
      phase: 'learn',
      title: learn === 1 ? 'Study the material' : `Study part ${i + 1} of ${learn}`,
      detail: 'Read it, then write a one-page summary in your own words.',
    })),
    ...Array.from({ length: practise }, (_, i): Activity => {
      const from = Math.floor((i * learn) / practise) + 1;
      const to = Math.floor(((i + 1) * learn) / practise);
      return {
        phase: 'practise',
        title:
          practise === 1
            ? 'Practise everything'
            : from === to
              ? `Practise part ${from}`
              : `Practise parts ${from} to ${to}`,
        detail: 'Answer questions with your notes closed, then mark your answers.',
      };
    }),
    ...Array.from({ length: review }, (_, i): Activity =>
      i % 2 === 0
        ? { phase: 'review', title: 'Mock exam', detail: 'Work on past-paper questions against the clock.' }
        : { phase: 'review', title: 'Fix your mistakes', detail: 'Redo what went wrong in the mock exam.' },
    ),
    recap,
  ];
}

export function proposePlan(id: string, details: Details, today: string): Plan {
  const days = daysBetween(today, details.examDate);
  const slots: Pick<Session, 'week' | 'date' | 'blocks'>[] = [];

  for (let week = 0; week * 7 < days; week++) {
    const length = Math.min(7, days - week * 7);
    // A short last week gets its share of the hours.
    const budget = Math.max(1, Math.floor((+details.hours * 2 * length) / 7));
    // At most 2 hours per activity, and at least 3 a week when there is room.
    const count = Math.max(Math.ceil(budget / 4), Math.min(3, budget, length));
    for (let i = 0; i < count; i++) {
      slots.push({
        week,
        date: addDays(today, week * 7 + Math.floor(((i + 0.5) * length) / count)),
        blocks: Math.floor(((i + 1) * budget) / count) - Math.floor((i * budget) / count),
      });
    }
  }
  slots[slots.length - 1].date = addDays(details.examDate, -1);

  const todo = activities(slots.length);
  return {
    id,
    subject: details.subject.trim(),
    startDate: today,
    examDate: details.examDate,
    sessions: slots.map((slot, i) => ({ id: String(i), ...slot, ...todo[i], done: false })),
  };
}

export const totalBlocks = (sessions: Session[]) => sessions.reduce((sum, s) => sum + s.blocks, 0);

/** The session behind each of `count` equal slices of the plan's study time. */
export function slices(sessions: Session[], count: number): Session[] {
  const byBlock = sessions.flatMap((s) => Array<Session>(s.blocks).fill(s));
  return Array.from({ length: count }, (_, i) => byBlock[Math.floor(((i + 0.5) * byBlock.length) / count)]);
}
