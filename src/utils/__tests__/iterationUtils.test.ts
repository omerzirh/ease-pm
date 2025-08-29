import { describe, it, expect } from 'vitest';
import { formatIterationName } from '../iterationUtils';
import { Iteration } from '../../services/gitlabService';

describe('formatIterationName', () => {
  const createMockIteration = (overrides: Partial<Iteration> = {}): Iteration => ({
    id: 1,
    iid: 1,
    title: 'Sprint 1',
    description: 'Test iteration',
    state: 1,
    start_date: '2024-01-01',
    due_date: '2024-01-14',
    web_url: 'https://gitlab.com/test',
    ...overrides,
  });

  describe('when iteration has a valid title', () => {
    it('should return the title when title is provided', () => {
      const iteration = createMockIteration({ title: 'Sprint 1' });
      expect(formatIterationName(iteration)).toBe('Sprint 1');
    });

    it('should return the title when title has whitespace but content', () => {
      const iteration = createMockIteration({ title: '  Sprint 2  ' });
      expect(formatIterationName(iteration)).toBe('  Sprint 2  ');
    });
  });

  describe('when iteration has no title or empty title', () => {
    it('should return date range when title is null', () => {
      const iteration = createMockIteration({ 
        title: null as any,
        start_date: '2024-01-01',
        due_date: '2024-01-14'
      });
      expect(formatIterationName(iteration)).toBe('1/1/2024 - 1/14/2024');
    });

    it('should return date range when title is empty string', () => {
      const iteration = createMockIteration({ 
        title: '',
        start_date: '2024-02-01',
        due_date: '2024-02-15'
      });
      expect(formatIterationName(iteration)).toBe('2/1/2024 - 2/15/2024');
    });

    it('should return date range when title is only whitespace', () => {
      const iteration = createMockIteration({ 
        title: '   ',
        start_date: '2024-03-01',
        due_date: '2024-03-15'
      });
      expect(formatIterationName(iteration)).toBe('3/1/2024 - 3/15/2024');
    });

    it('should handle different date formats correctly', () => {
      const iteration = createMockIteration({ 
        title: '',
        start_date: '2024-12-25',
        due_date: '2025-01-08'
      });
      expect(formatIterationName(iteration)).toBe('12/25/2024 - 1/8/2025');
    });
  });

  describe('error handling for invalid dates', () => {
    it('should fallback to iteration ID when start_date is invalid', () => {
      const iteration = createMockIteration({ 
        id: 42,
        title: '',
        start_date: 'invalid-date',
        due_date: '2024-01-14'
      });
      expect(formatIterationName(iteration)).toBe('Iteration 42');
    });

    it('should fallback to iteration ID when due_date is invalid', () => {
      const iteration = createMockIteration({ 
        id: 123,
        title: '',
        start_date: '2024-01-01',
        due_date: 'not-a-date'
      });
      expect(formatIterationName(iteration)).toBe('Iteration 123');
    });

    it('should fallback to iteration ID when both dates are invalid', () => {
      const iteration = createMockIteration({ 
        id: 999,
        title: '',
        start_date: 'bad-start',
        due_date: 'bad-end'
      });
      expect(formatIterationName(iteration)).toBe('Iteration 999');
    });

    it('should fallback to iteration ID when dates are empty strings', () => {
      const iteration = createMockIteration({ 
        id: 456,
        title: '',
        start_date: '',
        due_date: ''
      });
      expect(formatIterationName(iteration)).toBe('Iteration 456');
    });

    it('should fallback to iteration ID when dates are null', () => {
      const iteration = createMockIteration({ 
        id: 789,
        title: '',
        start_date: null as any,
        due_date: null as any
      });
      expect(formatIterationName(iteration)).toBe('Iteration 789');
    });
  });

  describe('edge cases', () => {
    it('should handle iteration with ID 0', () => {
      const iteration = createMockIteration({ 
        id: 0,
        title: '',
        start_date: 'invalid',
        due_date: 'invalid'
      });
      expect(formatIterationName(iteration)).toBe('Iteration 0');
    });

    it('should handle very large iteration IDs', () => {
      const iteration = createMockIteration({ 
        id: 999999999,
        title: '',
        start_date: 'invalid',
        due_date: 'invalid'
      });
      expect(formatIterationName(iteration)).toBe('Iteration 999999999');
    });

    it('should prefer title over date range even with invalid dates', () => {
      const iteration = createMockIteration({ 
        id: 100,
        title: 'Valid Title',
        start_date: 'invalid-date',
        due_date: 'invalid-date'
      });
      expect(formatIterationName(iteration)).toBe('Valid Title');
    });
  });
});