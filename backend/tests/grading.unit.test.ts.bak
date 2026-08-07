import { GradingService } from '../src/services/grading.service';

const gradingService = new GradingService();

// Helper to access private methods
const testGrading = {
  gradeMCQ: (optionId: string, question: any) => (gradingService as any).gradeMCQ(optionId, question),
  gradeShortAnswer: (student: string, correct: string) => (gradingService as any).gradeShortAnswer(student, correct),
  levenshteinDistance: (a: string, b: string) => (gradingService as any).levenshteinDistance(a, b),
  normalizeAnswer: (answer: string) => (gradingService as any).normalizeAnswer(answer),
};

describe('GradingService Unit Tests', () => {
  describe('gradeMCQ', () => {
    const mockQuestion = {
      id: 'q1',
      points: 10,
      options: [
        { id: 'opt1', is_correct: false },
        { id: 'opt2', is_correct: true },
        { id: 'opt3', is_correct: false },
      ],
    };

    test('Correct answer returns is_correct=true and full points', () => {
      const result = testGrading.gradeMCQ('opt2', mockQuestion);
      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(10);
    });

    test('Incorrect answer returns is_correct=false and 0 points', () => {
      const result = testGrading.gradeMCQ('opt1', mockQuestion);
      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
    });

    test('Invalid option returns is_correct=false and 0 points', () => {
      const result = testGrading.gradeMCQ('opt999', mockQuestion);
      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
    });
  });

  describe('gradeShortAnswer (fuzzy matching)', () => {
    test('Exact match (after normalization) returns true and similarity 1.0', () => {
      const result = testGrading.gradeShortAnswer('Paris', 'Paris');
      expect(result.isCorrect).toBe(true);
      expect(result.similarityScore).toBe(1.0);
    });

    test('Case-insensitive match: "PARIS" vs "paris"', () => {
      const result = testGrading.gradeShortAnswer('PARIS', 'paris');
      expect(result.isCorrect).toBe(true);
      expect(result.similarityScore).toBe(1.0);
    });

    test('Whitespace: "  Paris  " vs "Paris"', () => {
      const result = testGrading.gradeShortAnswer('  Paris  ', 'Paris');
      expect(result.isCorrect).toBe(true);
    });

    test('Accents: "café" vs "cafe"', () => {
      const result = testGrading.gradeShortAnswer('café', 'cafe');
      expect(result.isCorrect).toBe(true);
    });

    test('Fuzzy match above threshold: "Pariss" vs "Paris" (distance 1, max 6 → 0.833 < 0.85) -> actually 0.833 < 0.85 fails, so we need a case that passes.', () => {
      // Let's use "Parissx" vs "Pariss" distance 1, max 7 → 0.857 > 0.85
      const result = testGrading.gradeShortAnswer('Parissx', 'Pariss');
      expect(result.isCorrect).toBe(true);
      expect(result.similarityScore).toBeGreaterThanOrEqual(0.85);
    });

    test('Fuzzy match below threshold: "Pariz" vs "Paris" (0.8 < 0.85)', () => {
      const result = testGrading.gradeShortAnswer('Pariz', 'Paris');
      expect(result.isCorrect).toBe(false);
      expect(result.similarityScore).toBeLessThan(0.85);
    });

    test('Empty student answer vs "Paris"', () => {
      const result = testGrading.gradeShortAnswer('', 'Paris');
      expect(result.isCorrect).toBe(false);
    });

    test('Numeric exact match: "42" vs "42"', () => {
      const result = testGrading.gradeShortAnswer('42', '42');
      expect(result.isCorrect).toBe(true);
    });

    test('Numeric mismatch: "43" vs "42"', () => {
      const result = testGrading.gradeShortAnswer('43', '42');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('levenshteinDistance', () => {
    test('Identical strings distance 0', () => {
      expect(testGrading.levenshteinDistance('test', 'test')).toBe(0);
    });

    test('Single substitution', () => {
      expect(testGrading.levenshteinDistance('kitten', 'sitten')).toBe(1);
    });

    test('Single insertion', () => {
      expect(testGrading.levenshteinDistance('cat', 'cats')).toBe(1);
    });

    test('Single deletion', () => {
      expect(testGrading.levenshteinDistance('cats', 'cat')).toBe(1);
    });

    test('Complex example: "kitten" vs "sitting"', () => {
      expect(testGrading.levenshteinDistance('kitten', 'sitting')).toBe(3);
    });

    test('Empty strings distance 0', () => {
      expect(testGrading.levenshteinDistance('', '')).toBe(0);
    });

    test('One empty string distance is length of other', () => {
      expect(testGrading.levenshteinDistance('abc', '')).toBe(3);
      expect(testGrading.levenshteinDistance('', 'abc')).toBe(3);
    });
  });

  describe('normalizeAnswer', () => {
    test('Trims whitespace', () => {
      expect(testGrading.normalizeAnswer('  Hello  ')).toBe('hello');
    });

    test('Lowercases', () => {
      expect(testGrading.normalizeAnswer('HELLO')).toBe('hello');
    });

    test('Collapses multiple spaces', () => {
      expect(testGrading.normalizeAnswer('Hello   World')).toBe('hello world');
    });

    test('Removes accents', () => {
      expect(testGrading.normalizeAnswer('café')).toBe('cafe');
      expect(testGrading.normalizeAnswer('Zürich')).toBe('zurich');
      expect(testGrading.normalizeAnswer('naïve')).toBe('naive');
    });

    test('Combines all transformations', () => {
      expect(testGrading.normalizeAnswer('  Café  ')).toBe('cafe');
      expect(testGrading.normalizeAnswer('  New   York  ')).toBe('new york');
    });

    test('Handles empty string', () => {
      expect(testGrading.normalizeAnswer('')).toBe('');
    });
  });
});
