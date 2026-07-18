/**
 * @jest-environment jsdom
 */
import { practiceService } from './practiceService.js';

describe('dime practiceService', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    test('cue level advances after 3 consecutive successes, resets streak on almost', () => {
        let s;
        for (let i = 0; i < 3; i++) s = practiceService.recordAttempt('x', 'success');
        expect(s.cueLevel).toBe(1);
        expect(s.advanced).toBe(true);
        s = practiceService.recordAttempt('x', 'almost');
        expect(s.streak).toBe(0);
        expect(s.cueLevel).toBe(1); // never lowers automatically
        for (let i = 0; i < 3; i++) s = practiceService.recordAttempt('x', 'success');
        expect(s.cueLevel).toBe(2);
    });

    test('skip does not count as attempt', () => {
        practiceService.recordAttempt('y', 'skip');
        expect(practiceService.getItemState('y').attempts).toBe(0);
    });

    test('week message never guilt-inducing and counts distinct days', () => {
        expect(practiceService.getPracticeDaysThisWeek()).toBe(0);
        practiceService.logSession('palabras', 60000, 5, 4);
        practiceService.logSession('palabras', 60000, 5, 4); // same day
        expect(practiceService.getPracticeDaysThisWeek()).toBe(1);
        expect(practiceService.getWeekMessage()).not.toMatch(/no |falta|mal/i);
    });

    test('mergeData: per-item max progress, session union without duplicates', () => {
        let a = {
            items: { w1: { cueLevel: 2, streak: 1, successes: 9, attempts: 12 } },
            sessions: [{ date: 'd1', level: 'palabras', durationMs: 100, items: 5, successes: 4 }]
        };
        let b = {
            items: { w1: { cueLevel: 1, streak: 2, successes: 11, attempts: 11 }, w2: { cueLevel: 1, streak: 0, successes: 3, attempts: 3 } },
            sessions: [
                { date: 'd1', level: 'palabras', durationMs: 100, items: 5, successes: 4 }, // dup
                { date: 'd2', level: 'frases', durationMs: 200, items: 6, successes: 6 }
            ]
        };
        let m = practiceService.mergeData(a, b);
        expect(m.items.w1).toEqual({ cueLevel: 2, streak: 2, successes: 11, attempts: 12 });
        expect(m.items.w2.cueLevel).toBe(1);
        expect(m.sessions.length).toBe(2);
    });

    test('mergeData tolerates null/garbage inputs', () => {
        expect(practiceService.mergeData(null, undefined)).toEqual({ items: {}, sessions: [] });
        let m = practiceService.mergeData('garbage', { items: { a: { cueLevel: 1 } }, sessions: [] });
        expect(m.items.a.cueLevel).toBe(1);
    });

    test('importData merges into local storage instead of overwriting', () => {
        practiceService.recordAttempt('w1', 'success');
        practiceService.importData({ items: { w2: { cueLevel: 2, streak: 0, successes: 9, attempts: 9 } }, sessions: [] });
        expect(practiceService.getItemState('w1').successes).toBe(1);
        expect(practiceService.getItemState('w2').cueLevel).toBe(2);
    });
});
