import { describe, it, expect } from 'vitest';
import { evaluateQoE } from './auditCalculations';
import { FinancialStatement } from '../types/audit';

describe('Quality of Earnings (QoE) Engine Calculations', () => {
  it('calculates QoE ratio accurately for TestCo Bad scenario', () => {
    // Input parameters: NetIncome = 5000, CFO = -15000.
    const currentYear: FinancialStatement = {
      Company: 'TestCo Bad',
      Period: '2024',
      TotalAssets: 120000,
      TotalLiabilities: 100000,
      CurrentAssets: 45000,
      CurrentLiabilities: 70000,
      Receivables: 30000,
      Inventory: 5000,
      PPE: 55000,
      Depreciation: 4000,
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

    const result = evaluateQoE(currentYear);

    // Expected Result: -3.00 (or -3.000)
    expect(result.qoeRatio).toBeCloseTo(-3.000, 3);
    expect(result.cfo).toBe(-15000);
    expect(result.netIncome).toBe(5000);
    expect(result.status).toBe('BAD');
  });
});
