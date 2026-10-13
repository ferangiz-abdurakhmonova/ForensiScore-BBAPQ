import { describe, it, expect } from 'vitest';
import { evaluateBenford } from './auditCalculations';
import { extractFirstDigit } from './math';
import { Transaction } from '../types/audit';

describe("Benford's Law (MAD Engine) Calculations", () => {
  it('correctly extracts leading non-zero digits', () => {
    expect(extractFirstDigit(750.00)).toBe(7);
    expect(extractFirstDigit(8123.45)).toBe(8);
    expect(extractFirstDigit('7,890.00')).toBe(7);
    expect(extractFirstDigit('$800.50')).toBe(8);
    expect(extractFirstDigit(0)).toBeNull();
  });

  it('detects unnatural digit distribution and returns MAD exceeding nonconformity threshold (> 0.0150)', () => {
    // Mock transaction array with 15 transactions heavily biased towards leading digits 7 and 8
    const mockTransactions: Transaction[] = [
      { id: 'TX-101', Company: 'TestCo Bad', Date: '2024-01-01', Amount: 750.00 },
      { id: 'TX-102', Company: 'TestCo Bad', Date: '2024-01-02', Amount: 7800.00 },
      { id: 'TX-103', Company: 'TestCo Bad', Date: '2024-01-03', Amount: 7120.50 },
      { id: 'TX-104', Company: 'TestCo Bad', Date: '2024-01-04', Amount: 799.00 },
      { id: 'TX-105', Company: 'TestCo Bad', Date: '2024-01-05', Amount: 7450.00 },
      { id: 'TX-106', Company: 'TestCo Bad', Date: '2024-01-06', Amount: 7300.00 },
      { id: 'TX-107', Company: 'TestCo Bad', Date: '2024-01-07', Amount: 8100.00 },
      { id: 'TX-108', Company: 'TestCo Bad', Date: '2024-01-08', Amount: 8850.00 },
      { id: 'TX-109', Company: 'TestCo Bad', Date: '2024-01-09', Amount: 8200.00 },
      { id: 'TX-110', Company: 'TestCo Bad', Date: '2024-01-10', Amount: 8900.00 },
      { id: 'TX-111', Company: 'TestCo Bad', Date: '2024-01-11', Amount: 8750.00 },
      { id: 'TX-112', Company: 'TestCo Bad', Date: '2024-01-12', Amount: 7600.00 },
      { id: 'TX-113', Company: 'TestCo Bad', Date: '2024-01-13', Amount: 120.00 },
      { id: 'TX-114', Company: 'TestCo Bad', Date: '2024-01-14', Amount: 230.00 },
      { id: 'TX-115', Company: 'TestCo Bad', Date: '2024-01-15', Amount: 340.00 },
    ];

    const result = evaluateBenford(mockTransactions);

    // Verify first digit extractions in result stats
    const digit7Stat = result.digitStats.find((s) => s.digit === 7);
    const digit8Stat = result.digitStats.find((s) => s.digit === 8);

    expect(digit7Stat?.observedCount).toBe(7);
    expect(digit8Stat?.observedCount).toBe(5);

    // Verify MAD exceeds threshold (> 0.0150)
    expect(result.mad).toBeGreaterThan(0.0150);
    expect(result.status).toBe('BAD');
  });
});
