import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays, countdown, daysBetween, duration, parseDay, proposePlan, slices, totalBlocks, validate,
} from './planner.ts';

const today = '2026-11-24';

test('every plan fits its dates and its weekly hours', () => {
  for (let days = 1; days <= 365; days++) {
    for (const hours of [1, 2, 3, 7, 10, 25, 60]) {
      const examDate = addDays(today, days);
      const { sessions } = proposePlan('x', { subject: 'Maths', hours: String(hours), examDate }, today);
      const where = `${days} days, ${hours} h`;
      const perWeek = {};
      let previous = today;
      for (const s of sessions) {
        assert.ok(s.title && s.detail && s.phase, where);
        assert.ok(s.blocks >= 1 && s.blocks <= 4, where);
        assert.ok(s.date >= previous && s.date < examDate, where);
        assert.equal(s.week, Math.floor(daysBetween(today, s.date) / 7), where);
        previous = s.date;
        perWeek[s.week] = (perWeek[s.week] ?? 0) + s.blocks;
      }
      for (const blocks of Object.values(perWeek)) assert.ok(blocks <= hours * 2, where);
      const full = Math.floor(days / 7);
      for (let w = 0; w < full; w++) assert.equal(perWeek[w], hours * 2, where);
      assert.equal(sessions.at(-1).title, 'Final recap');
      assert.equal(previous, addDays(examDate, -1), where);
      assert.equal(new Set(sessions.map((s) => s.id)).size, sessions.length);
    }
  }
});

test('phases come in order', () => {
  const { sessions } = proposePlan('x', { subject: 'Maths', hours: '10', examDate: '2026-12-18' }, today);
  const order = ['learn', 'practise', 'review'];
  const seen = sessions.map((s) => order.indexOf(s.phase));
  assert.deepEqual(seen, [...seen].sort());
  assert.deepEqual([...new Set(seen)], [0, 1, 2]);
});

test('validation', () => {
  const ok = { subject: 'Maths', hours: '10', examDate: '2026-12-18' };
  assert.deepEqual(validate(ok, today), {});
  assert.ok(validate({ ...ok, subject: '  ' }, today).subject);
  for (const hours of ['', '0', '61', '1.5', '-2', 'ten']) {
    assert.ok(validate({ ...ok, hours }, today).hours, hours);
  }
  for (const examDate of ['', today, '2026-11-23', '2027-02-30', '2030-01-01', 'soon']) {
    assert.ok(validate({ ...ok, examDate }, today).examDate, examDate);
  }
});

test('dates survive clock changes and month ends', () => {
  assert.equal(addDays('2026-10-24', 2), '2026-10-26');
  assert.equal(daysBetween('2026-03-28', '2026-03-30'), 2);
  assert.equal(daysBetween('2026-10-24', '2026-10-26'), 2);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(parseDay('2026-02-29'), null);
});

test('labels', () => {
  assert.equal(duration(1), '30 min');
  assert.equal(duration(3), '1 h 30 min');
  assert.equal(duration(0), '0 h');
  assert.equal(countdown('2026-12-18', today), 'Fri 18 Dec, 24 days left');
  assert.equal(countdown(today, today), 'Tue 24 Nov, today');
  assert.equal(countdown('2026-11-23', today), 'Mon 23 Nov, exam over');
});

test('slices cover the plan from first to last session', () => {
  const { sessions } = proposePlan('x', { subject: 'Maths', hours: '1', examDate: '2026-11-25' }, today);
  assert.equal(totalBlocks(sessions), 1);
  for (const count of [1, 13, 83]) {
    const s = slices(sessions, count);
    assert.equal(s.length, count);
    assert.ok(s.every(Boolean));
  }
});
