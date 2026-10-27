import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calendarDaysBetween, localDateString, nextStreakDays } from './streak.ts';

describe('localDateString', () => {
  it('uses the local calendar date, not UTC', () => {
    const localEvening = new Date(2026, 8, 20, 20, 38, 0);
    assert.equal(localDateString(localEvening), '2026-09-20');

    // After UTC midnight, toISOString() flips the date while local evening has not.
    const afterUtcMidnight = new Date('2026-09-21T01:38:00.000Z');
    assert.equal(afterUtcMidnight.toISOString().slice(0, 10), '2026-09-21');
    if (afterUtcMidnight.getTimezoneOffset() > 0) {
      assert.equal(localDateString(afterUtcMidnight), '2026-09-20');
    }
  });
});

describe('nextStreakDays', () => {
  it('does not change the streak on a later visit the same local day', () => {
    assert.equal(nextStreakDays('2026-09-20', '2026-09-20', 7), 7);
  });

  it('increments after exactly one calendar day', () => {
    assert.equal(nextStreakDays('2026-09-19', '2026-09-20', 7), 8);
  });

  it('resets after a skipped day', () => {
    assert.equal(nextStreakDays('2026-09-18', '2026-09-20', 7), 1);
  });

  it('starts a streak on first recorded access', () => {
    assert.equal(nextStreakDays(undefined, '2026-09-20', 0), 1);
  });

  it('treats YYYY-MM-DD gaps as calendar days, not mixed local/UTC instants', () => {
    assert.equal(calendarDaysBetween('2026-09-20', '2026-09-21'), 1);
  });
});
