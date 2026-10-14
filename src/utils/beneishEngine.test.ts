import { describe, it, expect } from 'vitest';
import { evaluateBeneish } from './auditCalculations';
import { FinancialStatement } from '../types/audit';

describe('Beneish M-Score Engine Calculations', () => {
  it('calculates exact M-Score indices and overall M-Score for aggressive manipulation scenario', () => {
    // Input / Mocks provided in specification:
    // Year t-1 (Prior): Sales = 80000, COGS = 50000, Receivables = 10000, CurrentAssets = 40000, PPE = 50000, Depreciation = 5000, TotalAssets = 100000, TotalLiabilities = 60000, SGA = 15000, NetIncome = 7000, CFO = 8000
    const priorYear: FinancialStatement = {
      Company: 'Company Beta',
      Period: 't-1',
      Sales: 80000,
      COGS: 50000,
      Receivables: 10000,
      CurrentAssets: 40000,
      CurrentLiabilities: 20000,
      Inventory: 10000,
      PPE: 50000,
      Depreciation: 5000,
      TotalAssets: 100000,
      TotalLiabilities: 60000,
      SGA: 15000,
      EBIT: 15000,
      NetIncome: 7000,
      CFO: 8000,
      LongTermDebt: 40000,
      SharesOutstanding: 100000,
      RetainedEarnings: 20000,
    };

    // Year t (Current): Sales = 120000, COGS = 90000, Receivables = 30000, CurrentAssets = 45000, PPE = 55000, Depreciation = 4000, TotalAssets = 120000, TotalLiabilities = 100000, SGA = 20000, NetIncome = 5000, CFO = -15000
    const currentYear: FinancialStatement = {
      Company: 'Company Beta',
      Period: 't',
      Sales: 120000,
      COGS: 90000,
      Receivables: 30000,
      CurrentAssets: 45000,
      CurrentLiabilities: 30000,
      Inventory: 5000,
      PPE: 55000,
      Depreciation: 4000,
      TotalAssets: 120000,
      TotalLiabilities: 100000,
      SGA: 20000,
      EBIT: 10000,
      NetIncome: 5000,
      CFO: -15000,
      LongTermDebt: 70000,
      SharesOutstanding: 100000,
      RetainedEarnings: 15000,
    };

    const result = evaluateBeneish(currentYear, priorYear);

    // Expected Assertions (checked using .toBeCloseTo(value, 3))
    expect(result.variables.DSRI.value).toBeCloseTo(2.000, 3);
    expect(result.variables.GMI.value).toBeCloseTo(1.500, 3);
    expect(result.variables.AQI.value).toBeCloseTo(0.833, 3);
    expect(result.variables.SGI.value).toBeCloseTo(1.500, 3);
    expect(result.variables.DEPI.value).toBeCloseTo(1.250, 3);
    expect(result.variables.SGAI.value).toBeCloseTo(0.889, 3);
    expect(result.variables.LVGI.value).toBeCloseTo(1.389, 3);
    expect(result.variables.LVGI.flagged).toBe(true);
    expect(result.variables.TATA.value).toBeCloseTo(0.167, 3);
    expect(result.mScore).toBeCloseTo(0.130, 3);
  });

  it('correctly flags LVGI when value is 1.131 (> 1.10 threshold)', () => {
    const priorYear: FinancialStatement = {
      Company: 'Test Co',
      Period: 't-1',
      Sales: 100000, COGS: 60000, Receivables: 10000, CurrentAssets: 40000,
      CurrentLiabilities: 20000, Inventory: 10000, PPE: 50000, Depreciation: 5000,
      TotalAssets: 100000, TotalLiabilities: 50000, SGA: 15000, EBIT: 15000,
      NetIncome: 10000, CFO: 10000, LongTermDebt: 30000, SharesOutstanding: 100000,
      RetainedEarnings: 20000,
    };

    // Increase liabilities to assets ratio by factor ~1.131
    // TotalLiab_t / TA_t = 0.5655 vs 0.50 => LVGI = 1.131
    const currentYear: FinancialStatement = {
      ...priorYear,
      Period: 't',
      TotalLiabilities: 56550,
      TotalAssets: 100000,
    };

    const result = evaluateBeneish(currentYear, priorYear);
    expect(result.variables.LVGI.value).toBeCloseTo(1.131, 3);
    expect(result.variables.LVGI.flagged).toBe(true);
  });
});
