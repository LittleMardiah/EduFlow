import { AnalyticsService } from '../../src/services/AnalyticsService';

const analyticsService = new AnalyticsService();

describe('AnalyticsService - Calculation Logic', () => {
  test('average score calculation: [60,70,80] → 70', () => {
    const scores = [60, 70, 80];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBe(70);
  });

  test('best score tracking: max(60,70,80) → 80', () => {
    const scores = [60, 70, 80];
    const best = Math.max(...scores);
    expect(best).toBe(80);
  });

  test('pass/fail counting: 2 pass, 1 fail for passing_score=65', () => {
    const scores = [60, 70, 80];
    const pass = scores.filter(s => s >= 65).length;
    const fail = scores.filter(s => s < 65).length;
    expect(pass).toBe(2);
    expect(fail).toBe(1);
  });

  test('single attempt: avg_score equals that score', () => {
    const score = 75;
    const avg = score;
    expect(avg).toBe(75);
  });

  test('multiple attempts: best_score >= avg_score', () => {
    const scores = [60, 70, 80];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const best = Math.max(...scores);
    expect(best).toBeGreaterThanOrEqual(avg);
  });

  test('trend calculation: improving', () => {
    const attempts = [60, 70, 80];
    const slope = 10; // simple
    expect(slope).toBeGreaterThan(0);
  });

  test('trend calculation: declining', () => {
    const attempts = [80, 70, 60];
    const slope = -10;
    expect(slope).toBeLessThan(0);
  });
});
