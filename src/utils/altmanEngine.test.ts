import { describe, it, expect } from 'vitest';
import { evaluateAltman } from './auditCalculations';
import { FinancialStatement } from '../types/audit';

describe('Altman Z-Score Engine Calculations', () => {
  it('calculates exact Z-Score components and overall Z-Score for TestCo Bad scenario', () => {
    // Input parameters (Year 2024):
    // TotalAssets = 120000, TotalLiabilities = 100000, CurrentAssets = 45000, CurrentLiabilities = 70000, RetainedEarnings = 25000, EBIT = 8000, Sales = 120000.
    const currentYear: FinancialStatement = {
      Company: 'TestCo Bad',
      Period: '2024',
      TotalAssets: 120000,
      TotalLiabilities: 100000,
      CurrentAssets: 45000,
      CurrentLiabilities: 70000,
      Receivables: 10000,
      Inventory: 10000,
      PPE: 50000,
      Depreciation: 5000,
      Sales: 120000,
      COGS: 90000,
      SGA: 20000,
      EBIT: 8000,
      NetIncome: 5000,
      CFO: -15000,
      LongTermDebt: 30000,
      SharesOutstanding: 100000,
      RetainedEarnings: 25000,
    };

    const result = evaluateAltman(currentYear);

    // Expected Assertions (using .toBeCloseTo(value, 3))
    // X1 (Working Capital / TA): -0.208
    expect(result.variables.X1.value).toBeCloseTo(-0.208, 3);

    // X2 (Retained Earnings / TA): 0.208
    expect(result.variables.X2.value).toBeCloseTo(0.208, 3);

    // X3 (EBIT / TA): 0.067
    expect(result.variables.X3.value).toBeCloseTo(0.067, 3);

    // X4 (Equity / TL): 0.200 (where Equity = TotalAssets - TotalLiabilities)
    expect(result.variables.X4.value).toBeCloseTo(0.200, 3);

    // X5 (Sales / TA): 1.000
    expect(result.variables.X5?.value).toBeCloseTo(1.000, 3);

    // Overall Z-Score: 1.382
    expect(result.zScore).toBeCloseTo(1.382, 3);
  });
});
