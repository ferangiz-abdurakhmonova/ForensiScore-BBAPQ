import {
  AltmanResult,
  AuditEvaluation,
  BadgeColor,
  BeneishResult,
  BenfordDigitStat,
  BenfordResult,
  DivergenceAnalysis,
  ExecutiveSummary,
  FinancialStatement,
  MethodSummaryItem,
  PiotroskiResult,
  PiotroskiSignal,
  QoEResult,
  RiskStatus,
  Transaction,
} from '../types/audit';
import {
  chiSquarePValue,
  extractFirstDigit,
  formatNumber,
  formatPercent,
  formatRatio,
  getBenfordProbability,
} from './math';

/**
 * 1. BENFORD'S LAW EVALUATION
 */
export function evaluateBenford(transactions: Transaction[]): BenfordResult {
  if (!transactions || transactions.length === 0) {
    const emptyStats: BenfordDigitStat[] = [];
    for (let d = 1; d <= 9; d++) {
      emptyStats.push({
        digit: d,
        observedCount: 0,
        observedFreq: 0,
        expectedFreq: getBenfordProbability(d),
        expectedCount: 0,
        diffFreq: 0,
        absDiffFreq: 0,
      });
    }
    return {
      digitStats: emptyStats,
      totalValidTransactions: 0,
      mad: 0,
      chiSquare: 0,
      degreesOfFreedom: 8,
      pValue: 1,
      status: 'GOOD',
      badgeText: 'N/A (Waiting for data)',
      badgeColor: 'gray',
      takeaway: 'No transaction data uploaded yet. Waiting for transactions CSV file.',
    };
  }

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let totalValid = 0;

  for (const tx of transactions) {
    const digit = extractFirstDigit(tx.Amount);
    if (digit !== null && digit >= 1 && digit <= 9) {
      counts[digit]++;
      totalValid++;
    }
  }

  // Handle empty or small sample gracefully
  const effectiveTotal = Math.max(totalValid, 1);
  const digitStats: BenfordDigitStat[] = [];
  let sumAbsDiff = 0;
  let chiSquare = 0;

  for (let d = 1; d <= 9; d++) {
    const observedCount = counts[d] || 0;
    const observedFreq = totalValid > 0 ? observedCount / totalValid : 0;
    const expectedFreq = getBenfordProbability(d);
    const expectedCount = totalValid > 0 ? totalValid * expectedFreq : 0;
    const diffFreq = observedFreq - expectedFreq;
    const absDiffFreq = Math.abs(diffFreq);

    sumAbsDiff += absDiffFreq;

    if (expectedCount > 0) {
      chiSquare += Math.pow(observedCount - expectedCount, 2) / expectedCount;
    }

    digitStats.push({
      digit: d,
      observedCount,
      observedFreq,
      expectedFreq,
      expectedCount,
      diffFreq,
      absDiffFreq,
    });
  }

  // MAD = Mean Absolute Deviation across 9 digits
  const mad = sumAbsDiff / 9;
  const df = 8;
  const pValue = totalValid >= 10 ? chiSquarePValue(chiSquare, df) : 1;

  // Rating & Badge per prompt:
  // MAD < 0.006 -> GOOD / Close Conformity (Green badge)
  // 0.006 <= MAD < 0.012 -> ACCEPTABLE (Green badge)
  // 0.012 <= MAD < 0.015 -> WARNING / Marginal (Yellow badge)
  // MAD >= 0.015 -> BAD / Nonconformity / High Anomaly Risk (Red badge)
  let status: RiskStatus = 'GOOD';
  let badgeText = 'GOOD (Close Conformity)';
  let badgeColor: BadgeColor = 'green';
  let takeaway = 'Transaction amounts closely mirror natural Benford distribution with no systematic fabrication.';

  if (mad >= 0.015) {
    status = 'BAD';
    badgeText = 'BAD (Nonconformity / Anomaly Risk)';
    badgeColor = 'red';
    takeaway = `High nonconformity (MAD: ${formatNumber(mad, 4)} >= 0.015). Transaction population displays unnatural digit clustering, indicating potential manual manipulation, structuring, or duplicate patterns.`;
  } else if (mad >= 0.012) {
    status = 'WARNING';
    badgeText = 'WARNING (Marginal Conformity)';
    badgeColor = 'yellow';
    takeaway = `Marginal conformity (MAD: ${formatNumber(mad, 4)}). First-digit distribution deviates from natural logs, warranting secondary sampling.`;
  } else if (mad >= 0.006) {
    status = 'ACCEPTABLE';
    badgeText = 'ACCEPTABLE Conformity';
    badgeColor = 'green';
    takeaway = `Acceptable conformity (MAD: ${formatNumber(mad, 4)}). Transactions fit natural frequency curves within normal operational variance.`;
  } else {
    status = 'GOOD';
    badgeText = 'GOOD (Close Conformity)';
    badgeColor = 'green';
    takeaway = `Close conformity (MAD: ${formatNumber(mad, 4)} < 0.006). High empirical integrity across leading digits.`;
  }

  return {
    digitStats,
    totalValidTransactions: totalValid,
    mad,
    chiSquare,
    degreesOfFreedom: df,
    pValue,
    status,
    badgeText,
    badgeColor,
    takeaway,
  };
}

/**
 * 2. BENEISH M-SCORE EVALUATION
 * Formula: M = -4.84 + 0.92*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.679*TATA - 0.327*LVGI
 */
export function evaluateBeneish(current: FinancialStatement, prior: FinancialStatement): BeneishResult {
  const isMissing = !current || !prior || (current.TotalAssets === 0 && current.Sales === 0);
  if (isMissing) {
    return {
      mScore: 0,
      status: 'GOOD',
      badgeText: 'N/A (Waiting for data)',
      badgeColor: 'gray',
      takeaway: 'Waiting for multi-period financial statements CSV to calculate Beneish M-Score.',
      variables: {
        DSRI: { code: 'DSRI', name: 'Days Sales in Receivables Index', value: 0, weight: 0.92, contribution: 0, benchmark: '<= 1.05', formula: '(Rec_t / Sales_t) / (Rec_{t-1} / Sales_{t-1})', interpretation: 'Awaiting data', flagged: false },
        GMI: { code: 'GMI', name: 'Gross Margin Index', value: 0, weight: 0.528, contribution: 0, benchmark: '<= 1.00', formula: 'GrossMargin_{t-1} / GrossMargin_t', interpretation: 'Awaiting data', flagged: false },
        AQI: { code: 'AQI', name: 'Asset Quality Index', value: 0, weight: 0.404, contribution: 0, benchmark: '<= 1.00', formula: '[1 - (CA_t + PPE_t)/TA_t] / [1 - (CA_{t-1} + PPE_{t-1})/TA_{t-1}]', interpretation: 'Awaiting data', flagged: false },
        SGI: { code: 'SGI', name: 'Sales Growth Index', value: 0, weight: 0.892, contribution: 0, benchmark: '<= 1.15', formula: 'Sales_t / Sales_{t-1}', interpretation: 'Awaiting data', flagged: false },
        DEPI: { code: 'DEPI', name: 'Depreciation Index', value: 0, weight: 0.115, contribution: 0, benchmark: '<= 1.00', formula: 'DeprRate_{t-1} / DeprRate_t', interpretation: 'Awaiting data', flagged: false },
        SGAI: { code: 'SGAI', name: 'Sales General & Admin Index', value: 0, weight: -0.172, contribution: 0, benchmark: '<= 1.00', formula: '(SGA_t / Sales_t) / (SGA_{t-1} / Sales_{t-1})', interpretation: 'Awaiting data', flagged: false },
        TATA: { code: 'TATA', name: 'Total Accruals to Total Assets', value: 0, weight: 4.679, contribution: 0, benchmark: '<= 0.03', formula: '(NetIncome_t - CFO_t) / TotalAssets_t', interpretation: 'Awaiting data', flagged: false },
        LVGI: { code: 'LVGI', name: 'Leverage Index', value: 0, weight: -0.327, contribution: 0, benchmark: '<= 1.00', formula: '(TotalLiab_t / TA_t) / (TotalLiab_{t-1} / TA_{t-1})', interpretation: 'Awaiting data', flagged: false },
      },
    };
  }

  // Safe divisions
  const safeDiv = (num: number, den: number, fallback = 1): number => {
    if (!den || den === 0 || !Number.isFinite(den)) return fallback;
    const res = num / den;
    return Number.isFinite(res) ? res : fallback;
  };

  // 1. DSRI: Days Sales in Receivables Index = (Rec_t / Sales_t) / (Rec_{t-1} / Sales_{t-1})
  const recSalesCurrent = safeDiv(current.Receivables, current.Sales, 0.1);
  const recSalesPrior = safeDiv(prior.Receivables, prior.Sales, 0.1);
  const dsri = safeDiv(recSalesCurrent, recSalesPrior, 1.0);

  // 2. GMI: Gross Margin Index = GrossMargin_{t-1} / GrossMargin_t
  const gmCurrent = safeDiv(current.Sales - current.COGS, current.Sales, 0.3);
  const gmPrior = safeDiv(prior.Sales - prior.COGS, prior.Sales, 0.3);
  const gmi = safeDiv(gmPrior, gmCurrent, 1.0);

  // 3. AQI: Asset Quality Index = (CurrentAssets_t + PPE_t) / TotalAssets_t (or non-current asset ratio)
  const nonCurrentNonPPECurrent = Math.max(0, 1 - safeDiv(current.CurrentAssets + current.PPE, current.TotalAssets, 0.8));
  const nonCurrentNonPPEPrior = Math.max(0, 1 - safeDiv(prior.CurrentAssets + prior.PPE, prior.TotalAssets, 0.8));
  const aqi = safeDiv(current.CurrentAssets + current.PPE, current.TotalAssets, 0.833);

  // 4. SGI: Sales Growth Index = Sales_t / Sales_{t-1}
  const sgi = safeDiv(current.Sales, prior.Sales, 1.0);

  // 5. DEPI: Depreciation Index = DeprRate_{t-1} / DeprRate_t
  const depi = safeDiv(prior.Depreciation, current.Depreciation, 1.0);

  // 6. SGAI: Sales General & Admin Expense Index = (SGA_t / Sales_t) / (SGA_{t-1} / Sales_{t-1})
  const sgaCurrent = safeDiv(current.SGA, current.Sales, 0.15);
  const sgaPrior = safeDiv(prior.SGA, prior.Sales, 0.15);
  const sgai = safeDiv(sgaCurrent, sgaPrior, 1.0);

  // 7. TATA: Total Accruals to Total Assets = (NetIncome_t - CFO_t) / TotalAssets_t
  const totalAccruals = current.NetIncome - current.CFO;
  const tata = safeDiv(totalAccruals, current.TotalAssets, 0.0);

  // 8. LVGI: Leverage Index = (TotalLiabilities_t / TotalAssets_t) / (TotalLiabilities_{t-1} / TotalAssets_{t-1})
  const levCurrent = safeDiv(current.TotalLiabilities, current.TotalAssets, 0.5);
  const levPrior = safeDiv(prior.TotalLiabilities, prior.TotalAssets, 0.5);
  const lvgi = safeDiv(levCurrent, levPrior, 1.0);

  // Beneish 8-variable M-Score
  const mScore =
    -4.4932 +
    0.92 * dsri +
    0.528 * gmi +
    0.404 * aqi +
    0.892 * sgi +
    0.115 * depi -
    0.172 * sgai +
    4.679 * tata -
    0.327 * lvgi;

  // Rating & Badge per prompt:
  // M <= -2.22 -> GOOD / Low Manipulation Probability (Green badge)
  // M > -2.22 -> BAD / High Risk of Financial Manipulation (Red badge)
  const isGood = mScore <= -2.22;
  const status: 'GOOD' | 'BAD' = isGood ? 'GOOD' : 'BAD';
  const badgeText = isGood ? 'GOOD (Low Manipulation Risk)' : 'BAD (High Manipulation Risk)';
  const badgeColor: BadgeColor = isGood ? 'green' : 'red';
  const takeaway = isGood
    ? `M-Score is ${formatNumber(mScore, 2)} (<= -2.22 threshold), indicating low statistical probability of financial statement manipulation.`
    : `M-Score is ${formatNumber(mScore, 2)} (> -2.22 threshold), indicating significant earnings manipulation risk driven by accrual divergence or revenue timing.`;

  return {
    mScore,
    status,
    badgeText,
    badgeColor,
    takeaway,
    variables: {
      DSRI: {
        code: 'DSRI',
        name: 'Days Sales in Receivables Index',
        value: dsri,
        weight: 0.92,
        contribution: 0.92 * dsri,
        benchmark: 'Norm <= 1.00; > 1.25 flags revenue acceleration',
        formula: '(Receivables_t / Sales_t) / (Receivables_{t-1} / Sales_{t-1})',
        interpretation: dsri > 1.25 ? 'Receivables grew much faster than sales, suggesting uncollected channel stuffing.' : 'Receivables in line with sales velocity.',
        flagged: dsri > 1.25,
      },
      GMI: {
        code: 'GMI',
        name: 'Gross Margin Index',
        value: gmi,
        weight: 0.528,
        contribution: 0.528 * gmi,
        benchmark: 'Norm <= 1.00; > 1.0 flags deteriorating gross margins',
        formula: 'GrossMargin_{t-1} / GrossMargin_t',
        interpretation: gmi > 1.05 ? 'Gross margin eroded from prior year, incentivizing earnings inflation.' : 'Stable or expanding gross margin.',
        flagged: gmi > 1.05,
      },
      AQI: {
        code: 'AQI',
        name: 'Asset Quality Index',
        value: aqi,
        weight: 0.404,
        contribution: 0.404 * aqi,
        benchmark: 'Norm <= 1.00; > 1.25 flags non-current cost capitalization',
        formula: '[1 - (CA_t + PPE_t)/TA_t] / [1 - (CA_{t-1} + PPE_{t-1})/TA_{t-1}]',
        interpretation: aqi > 1.25 ? 'Intangibles or deferred costs capitalized as assets rather than expensed.' : 'Consistent asset tangibility profile.',
        flagged: aqi > 1.25,
      },
      SGI: {
        code: 'SGI',
        name: 'Sales Growth Index',
        value: sgi,
        weight: 0.892,
        contribution: 0.892 * sgi,
        benchmark: 'Norm ~ 1.0-1.15; High growth (> 1.25) pressures management',
        formula: 'Sales_t / Sales_{t-1}',
        interpretation: sgi > 1.25 ? 'Aggressive top-line growth often induces subsequent earnings pressure.' : 'Moderate sustainable sales expansion.',
        flagged: sgi > 1.35,
      },
      DEPI: {
        code: 'DEPI',
        name: 'Depreciation Index',
        value: depi,
        weight: 0.115,
        contribution: 0.115 * depi,
        benchmark: 'Norm <= 1.00; > 1.0 flags slowing depreciation schedules',
        formula: 'DeprRate_{t-1} / DeprRate_t',
        interpretation: depi > 1.10 ? 'Depreciation rate slowed down, possibly extending asset lifespans to boost net income.' : 'Standard depreciation cadence maintained.',
        flagged: depi > 1.10,
      },
      SGAI: {
        code: 'SGAI',
        name: 'SGA Expense Index',
        value: sgai,
        weight: -0.172,
        contribution: -0.172 * sgai,
        benchmark: 'Norm ~ 1.00; > 1.0 indicates administrative bloat',
        formula: '(SGA_t / Sales_t) / (SGA_{t-1} / Sales_{t-1})',
        interpretation: sgai > 1.15 ? 'Operating overhead expanding relative to revenue.' : 'Controlled overhead relative to sales volume.',
        flagged: sgai > 1.15,
      },
      TATA: {
        code: 'TATA',
        name: 'Total Accruals to Total Assets',
        value: tata,
        weight: 4.679,
        contribution: 4.679 * tata,
        benchmark: 'Norm <= 0.02; > 0.05 indicates heavy non-cash paper earnings',
        formula: '(NetIncome_t - CFO_t) / TotalAssets_t',
        interpretation: tata > 0.03 ? 'High accruals: Net income exceeds operating cash flow, indicating paper profits.' : 'Healthy cash backing: CFO meets or exceeds net income.',
        flagged: tata > 0.03,
      },
      LVGI: {
        code: 'LVGI',
        name: 'Leverage Index',
        value: lvgi,
        weight: -0.327,
        contribution: -0.327 * lvgi,
        benchmark: 'Norm <= 1.00; > 1.10 reflects increased gearing/debt load',
        formula: '(TotalLiabilities_t / TA_t) / (TotalLiabilities_{t-1} / TA_{t-1})',
        interpretation: lvgi > 1.10 ? 'Debt load increased relative to assets.' : 'Leverage ratio stable or deleveraging.',
        flagged: lvgi > 1.10,
      },
    },
  };
}

/**
 * 3. ALTMAN Z-SCORE EVALUATION (Non-manufacturing 4-factor)
 * X1 = (CurrentAssets - CurrentLiabilities) / TotalAssets
 * X2 = RetainedEarnings / TotalAssets
 * X3 = EBIT / TotalAssets
 * X4 = Equity / TotalLiabilities (where Equity = TotalAssets - TotalLiabilities)
 * Formula: Z = 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4
 */
export function evaluateAltman(current: FinancialStatement): AltmanResult {
  const isMissing = !current || (current.TotalAssets === 0 && current.Sales === 0);
  if (isMissing) {
    return {
      zScore: 0,
      status: 'GOOD',
      zoneName: 'Safe Zone',
      badgeText: 'N/A (Waiting for data)',
      badgeColor: 'gray',
      takeaway: 'Waiting for financial statements CSV to compute Altman Z-Score.',
      variables: {
        X1: { code: 'X1', name: 'Working Capital / Total Assets', value: 0, weight: 1.2, contribution: 0, formula: '(CurrentAssets - CurrentLiabilities) / TotalAssets', meaning: 'Awaiting data' },
        X2: { code: 'X2', name: 'Retained Earnings / Total Assets', value: 0, weight: 1.4, contribution: 0, formula: 'RetainedEarnings / TotalAssets', meaning: 'Awaiting data' },
        X3: { code: 'X3', name: 'EBIT / Total Assets', value: 0, weight: 3.3, contribution: 0, formula: 'EBIT / TotalAssets', meaning: 'Awaiting data' },
        X4: { code: 'X4', name: 'Book Equity / Total Liabilities', value: 0, weight: 0.6, contribution: 0, formula: '(TotalAssets - TotalLiabilities) / TotalLiabilities', meaning: 'Awaiting data' },
        X5: { code: 'X5', name: 'Sales / Total Assets', value: 0, weight: 1.0, contribution: 0, formula: 'Sales / TotalAssets', meaning: 'Awaiting data' },
      },
    };
  }

  const safeDiv = (num: number, den: number, fallback = 0): number => {
    if (!den || den === 0 || !Number.isFinite(den)) return fallback;
    const res = num / den;
    return Number.isFinite(res) ? res : fallback;
  };

  const x1 = safeDiv(current.CurrentAssets - current.CurrentLiabilities, current.TotalAssets);
  const x2 = safeDiv(current.RetainedEarnings, current.TotalAssets);
  const x3 = safeDiv(current.EBIT, current.TotalAssets);
  const equity = current.TotalAssets - current.TotalLiabilities;
  const x4 = safeDiv(equity, current.TotalLiabilities);
  const x5 = safeDiv(current.Sales, current.TotalAssets);

  const zScore = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5;

  // Rating & Badge per prompt:
  // Z > 2.60 -> GOOD / Safe Zone (Green badge)
  // 1.10 <= Z <= 2.60 -> WARNING / Grey Zone (Yellow badge)
  // Z < 1.10 -> BAD / Distress / High Insolvency Risk (Red badge)
  let status: 'GOOD' | 'WARNING' | 'BAD' = 'GOOD';
  let zoneName: 'Safe Zone' | 'Grey Zone' | 'Distress Zone' = 'Safe Zone';
  let badgeText = 'GOOD (Safe Zone)';
  let badgeColor: BadgeColor = 'green';
  let takeaway = `Z-Score is ${formatNumber(zScore, 2)} (> 2.60). Strong liquidity cushion and negligible 2-year bankruptcy probability.`;

  if (zScore < 1.10) {
    status = 'BAD';
    zoneName = 'Distress Zone';
    badgeText = 'BAD (Distress / Insolvency Risk)';
    badgeColor = 'red';
    takeaway = `Z-Score is ${formatNumber(zScore, 2)} (< 1.10). Severe financial distress with heightened risk of near-term default or restructuring.`;
  } else if (zScore <= 2.60) {
    status = 'WARNING';
    zoneName = 'Grey Zone';
    badgeText = 'WARNING (Grey Zone / Marginal)';
    badgeColor = 'yellow';
    takeaway = `Z-Score is ${formatNumber(zScore, 2)} (1.10 - 2.60). Vulnerable liquidity and leverage profiles warrant continuous covenant monitoring.`;
  }

  return {
    zScore,
    status,
    zoneName,
    badgeText,
    badgeColor,
    takeaway,
    variables: {
      X1: {
        code: 'X1',
        name: 'Working Capital / Total Assets',
        value: x1,
        weight: 1.2,
        contribution: 1.2 * x1,
        formula: '(CurrentAssets - CurrentLiabilities) / TotalAssets',
        meaning: 'Short-term liquidity and buffer against operational cash shocks.',
      },
      X2: {
        code: 'X2',
        name: 'Retained Earnings / Total Assets',
        value: x2,
        weight: 1.4,
        contribution: 1.4 * x2,
        formula: 'RetainedEarnings / TotalAssets',
        meaning: 'Cumulative profitability and historical self-financing capability.',
      },
      X3: {
        code: 'X3',
        name: 'EBIT / Total Assets',
        value: x3,
        weight: 3.3,
        contribution: 3.3 * x3,
        formula: 'EBIT / TotalAssets',
        meaning: 'True asset earning productivity unclouded by tax or leverage factors.',
      },
      X4: {
        code: 'X4',
        name: 'Book Equity / Total Liabilities',
        value: x4,
        weight: 0.6,
        contribution: 0.6 * x4,
        formula: '(TotalAssets - TotalLiabilities) / TotalLiabilities',
        meaning: 'Capital structure safety margin before liabilities exceed asset values.',
      },
      X5: {
        code: 'X5',
        name: 'Sales / Total Assets',
        value: x5,
        weight: 1.0,
        contribution: 1.0 * x5,
        formula: 'Sales / TotalAssets',
        meaning: 'Asset turnover ratio measuring revenue generation capacity per dollar of asset base.',
      },
    },
  };
}

/**
 * 4. PIOTROSKI F-SCORE EVALUATION
 * 9 binary signals (S1-S9):
 * S1: ROA > 0
 * S2: CFO > 0
 * S3: dROA > 0
 * S4: CFO > NI
 * S5: dLeverage < 0
 * S6: dCurrentRatio > 0
 * S7: dShares <= 0
 * S8: dGrossMargin > 0
 * S9: dAssetTurnover > 0
 *
 * Rating:
 * 7 to 9 -> GOOD / Strong Financial Health (Green badge)
 * 4 to 6 -> MODERATE / Neutral (Yellow badge)
 * 0 to 3 -> BAD / Weak Financial Position (Red badge)
 */
export function evaluatePiotroski(current: FinancialStatement, prior: FinancialStatement): PiotroskiResult {
  const isMissing = !current || !prior || (current.TotalAssets === 0 && current.Sales === 0);
  if (isMissing) {
    return {
      fScore: 0,
      maxScore: 9,
      status: 'GOOD',
      badgeText: 'N/A (Waiting for data)',
      badgeColor: 'gray',
      takeaway: 'Waiting for multi-period financial statements CSV to calculate Piotroski F-Score.',
      signals: [],
    };
  }

  const safeDiv = (num: number, den: number, fallback = 0): number => {
    if (!den || den === 0 || !Number.isFinite(den)) return fallback;
    const res = num / den;
    return Number.isFinite(res) ? res : fallback;
  };

  const roaCurrent = safeDiv(current.NetIncome, current.TotalAssets);
  const roaPrior = safeDiv(prior.NetIncome, prior.TotalAssets);

  const levCurrent = safeDiv(current.LongTermDebt, current.TotalAssets);
  const levPrior = safeDiv(prior.LongTermDebt, prior.TotalAssets);

  const crCurrent = safeDiv(current.CurrentAssets, current.CurrentLiabilities);
  const crPrior = safeDiv(prior.CurrentAssets, prior.CurrentLiabilities);

  const gmCurrent = safeDiv(current.Sales - current.COGS, current.Sales);
  const gmPrior = safeDiv(prior.Sales - prior.COGS, prior.Sales);

  const atCurrent = safeDiv(current.Sales, current.TotalAssets);
  const atPrior = safeDiv(prior.Sales, prior.TotalAssets);

  const signals: PiotroskiSignal[] = [
    // Profitability
    {
      id: 'S1',
      code: 'ROA > 0',
      name: 'Positive Return on Assets',
      category: 'Profitability',
      condition: 'Net Income / Total Assets > 0',
      pass: roaCurrent > 0,
      points: roaCurrent > 0 ? 1 : 0,
      currentVal: roaCurrent,
      formattedComparison: `Current ROA: ${formatPercent(roaCurrent)} (> 0%)`,
      rationale: roaCurrent > 0 ? 'Firm is operating profitably on deployed capital.' : 'Negative return indicates unprofitability.',
    },
    {
      id: 'S2',
      code: 'CFO > 0',
      name: 'Positive Operating Cash Flow',
      category: 'Profitability',
      condition: 'Cash Flow from Operations > 0',
      pass: current.CFO > 0,
      points: current.CFO > 0 ? 1 : 0,
      currentVal: current.CFO,
      formattedComparison: `CFO: $${formatNumber(current.CFO, 0)} (> $0)`,
      rationale: current.CFO > 0 ? 'Core business generates positive organic cash flow.' : 'Negative operating cash flow signals cash burn.',
    },
    {
      id: 'S3',
      code: 'dROA > 0',
      name: 'Improving Return on Assets',
      category: 'Profitability',
      condition: 'ROA_t > ROA_{t-1}',
      pass: roaCurrent > roaPrior,
      points: roaCurrent > roaPrior ? 1 : 0,
      currentVal: roaCurrent,
      priorVal: roaPrior,
      formattedComparison: `${formatPercent(roaCurrent)} vs ${formatPercent(roaPrior)}`,
      rationale: roaCurrent > roaPrior ? 'Asset profitability expanded year-over-year.' : 'ROA deteriorated relative to prior period.',
    },
    {
      id: 'S4',
      code: 'CFO > NI',
      name: 'Cash Flow Backing (CFO > NI)',
      category: 'Profitability',
      condition: 'Operating Cash Flow > Net Income',
      pass: current.CFO > current.NetIncome,
      points: current.CFO > current.NetIncome ? 1 : 0,
      currentVal: current.CFO - current.NetIncome,
      formattedComparison: `CFO ($${formatNumber(current.CFO, 0)}) > NI ($${formatNumber(current.NetIncome, 0)})`,
      rationale: current.CFO > current.NetIncome ? 'High quality earnings with cash conversion exceeding accounting net income.' : 'Accruals exceed cash flow, pointing to paper earnings.',
    },

    // Leverage, Liquidity and Source of Funds
    {
      id: 'S5',
      code: 'dLeverage < 0',
      name: 'Decreasing Long-Term Leverage',
      category: 'Leverage & Liquidity',
      condition: 'LTD_t / TA_t < LTD_{t-1} / TA_{t-1}',
      pass: levCurrent < levPrior,
      points: levCurrent < levPrior ? 1 : 0,
      currentVal: levCurrent,
      priorVal: levPrior,
      formattedComparison: `${formatPercent(levCurrent)} vs ${formatPercent(levPrior)}`,
      rationale: levCurrent < levPrior ? 'Deleveraging achieved; long-term debt ratio decreased.' : 'Gearing increased as long-term debt expanded relative to assets.',
    },
    {
      id: 'S6',
      code: 'dCurrentRatio > 0',
      name: 'Improving Current Liquidity Ratio',
      category: 'Leverage & Liquidity',
      condition: 'Current Ratio_t > Current Ratio_{t-1}',
      pass: crCurrent > crPrior,
      points: crCurrent > crPrior ? 1 : 0,
      currentVal: crCurrent,
      priorVal: crPrior,
      formattedComparison: `${formatRatio(crCurrent, 2)}x vs ${formatRatio(crPrior, 2)}x`,
      rationale: crCurrent > crPrior ? 'Working capital coverage strengthened over the prior period.' : 'Current ratio tightened, reducing short-term headroom.',
    },
    {
      id: 'S7',
      code: 'dShares <= 0',
      name: 'No Equity Dilution',
      category: 'Leverage & Liquidity',
      condition: 'Shares Outstanding_t <= Shares Outstanding_{t-1}',
      pass: current.SharesOutstanding <= prior.SharesOutstanding,
      points: current.SharesOutstanding <= prior.SharesOutstanding ? 1 : 0,
      currentVal: current.SharesOutstanding,
      priorVal: prior.SharesOutstanding,
      formattedComparison: `${formatNumber(current.SharesOutstanding, 0)} vs ${formatNumber(prior.SharesOutstanding, 0)}`,
      rationale: current.SharesOutstanding <= prior.SharesOutstanding ? 'No dilutive common stock issuance to finance operations.' : 'Share dilution detected from new equity issuance.',
    },

    // Operating Efficiency
    {
      id: 'S8',
      code: 'dGrossMargin > 0',
      name: 'Expanding Gross Margin',
      category: 'Operating Efficiency',
      condition: 'Gross Margin_t > Gross Margin_{t-1}',
      pass: gmCurrent > gmPrior,
      points: gmCurrent > gmPrior ? 1 : 0,
      currentVal: gmCurrent,
      priorVal: gmPrior,
      formattedComparison: `${formatPercent(gmCurrent)} vs ${formatPercent(gmPrior)}`,
      rationale: gmCurrent > gmPrior ? 'Pricing power or procurement efficiency improved product gross margins.' : 'Gross margin contracted, signaling pricing pressure or cost spikes.',
    },
    {
      id: 'S9',
      code: 'dAssetTurnover > 0',
      name: 'Increasing Asset Turnover',
      category: 'Operating Efficiency',
      condition: 'Sales_t / TA_t > Sales_{t-1} / TA_{t-1}',
      pass: atCurrent > atPrior,
      points: atCurrent > atPrior ? 1 : 0,
      currentVal: atCurrent,
      priorVal: atPrior,
      formattedComparison: `${formatRatio(atCurrent, 2)}x vs ${formatRatio(atPrior, 2)}x`,
      rationale: atCurrent > atPrior ? 'Productive asset utilization expanded revenue throughput.' : 'Asset productivity declined, generating fewer sales dollars per asset base.',
    },
  ];

  const fScore = signals.reduce((sum, s) => sum + s.points, 0);

  // Rating & Badge per prompt:
  // 7 to 9 -> GOOD / Strong Financial Health (Green badge)
  // 4 to 6 -> MODERATE / Neutral (Yellow badge)
  // 0 to 3 -> BAD / Weak Financial Position (Red badge)
  let status: 'GOOD' | 'MODERATE' | 'BAD' = 'GOOD';
  let badgeText = 'GOOD (Strong Financial Health)';
  let badgeColor: BadgeColor = 'green';
  let takeaway = `F-Score is ${fScore}/9. Robust fundamentals across profitability, liquidity, and operational efficiency.`;

  if (fScore <= 3) {
    status = 'BAD';
    badgeText = 'BAD (Weak Financial Position)';
    badgeColor = 'red';
    takeaway = `F-Score is ${fScore}/9. Substantial fundamental deterioration across margin compression and cash flow generation.`;
  } else if (fScore <= 6) {
    status = 'MODERATE';
    badgeText = 'MODERATE (Neutral Fundamentals)';
    badgeColor = 'yellow';
    takeaway = `F-Score is ${fScore}/9. Mixed performance with balanced strengths and operational bottlenecks.`;
  }

  return {
    fScore,
    maxScore: 9,
    status,
    badgeText,
    badgeColor,
    takeaway,
    signals,
  };
}

/**
 * 5. EARNINGS QUALITY (QoE) EVALUATION
 * Formula: CFO / NetIncome
 * Rating:
 * QoE >= 1.0 -> GOOD / High Quality Earnings backed by Cash Flow (Green badge)
 * QoE < 1.0 -> BAD / Weak Quality / Accrual-Driven Earnings (Red badge)
 */
export function evaluateQoE(current: FinancialStatement): QoEResult {
  const isMissing = !current || (current.TotalAssets === 0 && current.Sales === 0 && current.CFO === 0 && current.NetIncome === 0);
  if (isMissing) {
    return {
      cfo: 0,
      netIncome: 0,
      qoeRatio: 0,
      accruals: 0,
      status: 'GOOD',
      badgeText: 'N/A (Waiting for data)',
      badgeColor: 'gray',
      takeaway: 'Waiting for financial statements CSV to evaluate Quality of Earnings.',
      interpretation: 'Awaiting financial statements data.',
    };
  }

  const cfo = current.CFO;
  const netIncome = current.NetIncome;
  const accruals = netIncome - cfo;

  let qoeRatio = 0;
  if (netIncome !== 0) {
    qoeRatio = cfo / netIncome;
  } else {
    qoeRatio = cfo > 0 ? 99 : 0;
  }

  // Handle case where Net Income is negative
  let isGood = false;
  let status: 'GOOD' | 'BAD' = 'BAD';
  let badgeText = 'BAD (Weak Quality / Accrual-Driven)';
  let badgeColor: BadgeColor = 'red';
  let takeaway = '';
  let interpretation = '';

  if (netIncome <= 0) {
    // If net income is negative or zero
    if (cfo > 0) {
      isGood = true;
      status = 'GOOD';
      badgeText = 'GOOD (Positive Cash Inflow despite Net Loss)';
      badgeColor = 'green';
      takeaway = `Operating cash flow ($${formatNumber(cfo, 0)}) remains positive despite accounting net loss ($${formatNumber(netIncome, 0)}).`;
      interpretation = 'High non-cash write-downs or depreciation depressed GAAP earnings, but underlying cash generation remains sound.';
    } else {
      isGood = false;
      status = 'BAD';
      badgeText = 'BAD (Negative Cash Flow & Net Loss)';
      badgeColor = 'red';
      takeaway = `Both CFO ($${formatNumber(cfo, 0)}) and Net Income ($${formatNumber(netIncome, 0)}) are negative, presenting severe cash drain.`;
      interpretation = 'Core operations fail to produce positive cash flows while incurring accounting losses.';
    }
  } else {
    // Standard case: NetIncome > 0
    isGood = qoeRatio >= 1.0;
    if (isGood) {
      status = 'GOOD';
      badgeText = 'GOOD (High Quality Cash-Backed)';
      badgeColor = 'green';
      takeaway = `QoE ratio is ${formatRatio(qoeRatio, 2)}x (>= 1.0). Net income is fully corroborated and exceeded by operating cash generation.`;
      interpretation = `Operating cash flow of $${formatNumber(cfo, 0)} exceeds net income of $${formatNumber(netIncome, 0)} by $${formatNumber(cfo - netIncome, 0)}, validating high-integrity non-accrual earnings.`;
    } else {
      status = 'BAD';
      badgeText = 'BAD (Weak Quality / Accrual-Driven)';
      badgeColor = 'red';
      takeaway = `QoE ratio is ${formatRatio(qoeRatio, 2)}x (< 1.0). Operating cash flow lags net income, indicating aggressive accrual recognition.`;
      interpretation = `Net income of $${formatNumber(netIncome, 0)} exceeds cash flow from operations ($${formatNumber(cfo, 0)}) by $${formatNumber(accruals, 0)}. Book profits are dependent on accounting accruals rather than cash collections.`;
    }
  }

  return {
    cfo,
    netIncome,
    qoeRatio,
    accruals,
    status,
    badgeText,
    badgeColor,
    takeaway,
    interpretation,
  };
}

/**
 * 6. OVERALL EXECUTIVE SUMMARY COMPOSITION
 * Synthesizes the 5 methods into a prominent executive summary badge:
 * - "STRONG & HEALTHY" (all/majority green)
 * - "MODERATE / MIXED SIGNALS" (presence of warning/yellow metrics)
 * - "HIGH RISK / RED FLAGS DETECTED" (if Beneish or Altman indicates severe distress/manipulation)
 */
export function synthesizeAuditEvaluation(
  company: string,
  currentPeriod: string,
  priorPeriod: string,
  transactions: Transaction[],
  currentFin: FinancialStatement,
  priorFin: FinancialStatement
): AuditEvaluation {
  const benford = evaluateBenford(transactions);
  const beneish = evaluateBeneish(currentFin, priorFin);
  const altman = evaluateAltman(currentFin);
  const piotroski = evaluatePiotroski(currentFin, priorFin);
  const qoe = evaluateQoE(currentFin);

  const methodSummaries: MethodSummaryItem[] = [
    {
      id: 'benford',
      name: "Benford's Law",
      category: 'Transaction Forensics',
      computedValueStr: `MAD = ${formatNumber(benford.mad, 4)}`,
      numericValue: benford.mad,
      benchmarkRule: 'MAD < 0.006 (Good), < 0.012 (Acc), >= 0.015 (Bad)',
      status: benford.status,
      badgeText: benford.badgeText,
      badgeColor: benford.badgeColor,
      plainTakeaway: benford.takeaway,
    },
    {
      id: 'beneish',
      name: 'Beneish M-Score',
      category: 'Earnings Manipulation',
      computedValueStr: `M = ${formatNumber(beneish.mScore, 2)}`,
      numericValue: beneish.mScore,
      benchmarkRule: 'M <= -2.22 (Good / Low Risk), M > -2.22 (Bad / High Risk)',
      status: beneish.status,
      badgeText: beneish.badgeText,
      badgeColor: beneish.badgeColor,
      plainTakeaway: beneish.takeaway,
    },
    {
      id: 'altman',
      name: 'Altman Z-Score',
      category: 'Insolvency & Bankruptcy',
      computedValueStr: `Z = ${formatNumber(altman.zScore, 2)}`,
      numericValue: altman.zScore,
      benchmarkRule: 'Z > 2.60 (Safe Zone), 1.10 - 2.60 (Grey), < 1.10 (Distress)',
      status: altman.status,
      badgeText: altman.badgeText,
      badgeColor: altman.badgeColor,
      plainTakeaway: altman.takeaway,
    },
    {
      id: 'piotroski',
      name: 'Piotroski F-Score',
      category: 'Financial Health',
      computedValueStr: `F = ${piotroski.fScore} / 9`,
      numericValue: piotroski.fScore,
      benchmarkRule: '7-9 (Strong Health), 4-6 (Moderate), 0-3 (Weak)',
      status: piotroski.status,
      badgeText: piotroski.badgeText,
      badgeColor: piotroski.badgeColor,
      plainTakeaway: piotroski.takeaway,
    },
    {
      id: 'qoe',
      name: 'Quality of Earnings (QoE)',
      category: 'Cash Flow vs Net Income',
      computedValueStr: `QoE = ${formatRatio(qoe.qoeRatio, 2)}x`,
      numericValue: qoe.qoeRatio,
      benchmarkRule: 'QoE >= 1.0 (High Quality Cash), QoE < 1.0 (Weak / Accrual)',
      status: qoe.status,
      badgeText: qoe.badgeText,
      badgeColor: qoe.badgeColor,
      plainTakeaway: qoe.takeaway,
    },
  ];

  // Count distribution
  let goodCount = 0;
  let warningCount = 0;
  let badCount = 0;
  let naCount = 0;

  for (const item of methodSummaries) {
    if (item.badgeColor === 'green') goodCount++;
    else if (item.badgeColor === 'yellow') warningCount++;
    else if (item.badgeColor === 'red') badCount++;
    else if (item.badgeColor === 'gray') naCount++;
  }

  // Determine overall verdict
  let verdict: 'STRONG & HEALTHY' | 'MODERATE / MIXED SIGNALS' | 'HIGH RISK / RED FLAGS DETECTED' | 'WAITING FOR DATA';
  let verdictBadgeColor: BadgeColor = 'green';
  let verdictSubtext = '';

  const keyRiskFlags: string[] = [];
  const positiveHighlights: string[] = [];

  // Check critical red flags
  if (beneish.status === 'BAD' && beneish.badgeColor !== 'gray') {
    keyRiskFlags.push(`Beneish M-Score flagged possible earnings manipulation (M = ${formatNumber(beneish.mScore, 2)} > -2.22).`);
  }
  if (altman.status === 'BAD' && altman.badgeColor !== 'gray') {
    keyRiskFlags.push(`Altman Z-Score indicates severe bankruptcy / insolvency distress (Z = ${formatNumber(altman.zScore, 2)} < 1.10).`);
  }
  if (benford.status === 'BAD' && benford.badgeColor !== 'gray') {
    keyRiskFlags.push(`Benford's Law nonconformity detected across transaction distributions (MAD = ${formatNumber(benford.mad, 4)} >= 0.015).`);
  }
  if (piotroski.status === 'BAD' && piotroski.badgeColor !== 'gray') {
    keyRiskFlags.push(`Piotroski score shows fragile fundamentals (F-Score = ${piotroski.fScore}/9).`);
  }
  if (qoe.status === 'BAD' && qoe.badgeColor !== 'gray') {
    keyRiskFlags.push(`Operating cash flow fails to cover reported net earnings (QoE = ${formatRatio(qoe.qoeRatio, 2)}x).`);
  }

  // Highlights
  if (altman.status === 'GOOD' && altman.badgeColor !== 'gray') positiveHighlights.push(`Solvent balance sheet in Altman Safe Zone (Z = ${formatNumber(altman.zScore, 2)}).`);
  if (piotroski.status === 'GOOD' && piotroski.badgeColor !== 'gray') positiveHighlights.push(`Robust fundamental momentum with ${piotroski.fScore}/9 Piotroski signals.`);
  if ((benford.status === 'GOOD' || benford.status === 'ACCEPTABLE') && benford.badgeColor !== 'gray') positiveHighlights.push(`High transaction integrity conforming with Benford's Law.`);
  if (beneish.status === 'GOOD' && beneish.badgeColor !== 'gray') positiveHighlights.push(`Low statistical likelihood of accounting manipulation (M = ${formatNumber(beneish.mScore, 2)}).`);
  if (qoe.status === 'GOOD' && qoe.badgeColor !== 'gray') positiveHighlights.push(`Earnings backed by organic operating cash flows (QoE = ${formatRatio(qoe.qoeRatio, 2)}x).`);

  // Explicit verdict decision logic:
  if (naCount === 5) {
    verdict = 'WAITING FOR DATA';
    verdictBadgeColor = 'gray';
    verdictSubtext = 'Awaiting uploaded CSV datasets. Upload Transactions and Financial Statements to execute the 5 forensic models.';
  } else if (naCount >= 1 && goodCount === 0 && warningCount === 0 && badCount === 0) {
    verdict = 'WAITING FOR DATA';
    verdictBadgeColor = 'gray';
    verdictSubtext = 'Partial datasets loaded. Upload remaining CSV data to complete full multi-model audit.';
  } else if ((beneish.status === 'BAD' && beneish.badgeColor !== 'gray') || (altman.status === 'BAD' && altman.badgeColor !== 'gray') || badCount >= 2) {
    verdict = 'HIGH RISK / RED FLAGS DETECTED';
    verdictBadgeColor = 'red';
    verdictSubtext = 'Immediate forensic audit recommended. Material accounting anomalies or insolvency risks identified.';
  } else if (badCount === 1 || warningCount >= 1) {
    verdict = 'MODERATE / MIXED SIGNALS';
    verdictBadgeColor = 'yellow';
    verdictSubtext = 'Certain operational or reporting metrics require closer audit scrutiny, despite otherwise stable fundamentals.';
  } else {
    verdict = 'STRONG & HEALTHY';
    verdictBadgeColor = 'green';
    verdictSubtext = 'High financial integrity across active statistical, insolvency, and forensic dimensions.';
  }

  // Automated Divergence Detection Engine
  // Analyzes Macro Health (Financial statements: Altman Z, Piotroski F, Beneish M, QoE) vs Micro Forensics (Benford MAD, Digit Spikes, Round amounts)
  let divergence: DivergenceAnalysis | undefined = undefined;

  // Calculate excessive round amount ratio in transactions
  const totalTx = transactions.length;
  const roundCount = transactions.filter((t) => {
    const amt = Math.abs(t.Amount);
    return amt >= 100 && (amt % 500 === 0 || amt % 1000 === 0);
  }).length;
  const roundRatio = totalTx > 0 ? roundCount / totalTx : 0;

  // Extract top distorted digits contributing most to MAD discrepancy
  const topDistortedDigits = [...benford.digitStats]
    .sort((a, b) => b.absDiffFreq - a.absDiffFreq)
    .slice(0, 3)
    .map((d) => ({
      digit: d.digit,
      observedFreq: d.observedFreq,
      expectedFreq: d.expectedFreq,
      diffFreq: d.diffFreq,
      absDiffFreq: d.absDiffFreq,
    }));

  const isMacroHealthy =
    altman.badgeColor !== 'gray' &&
    beneish.badgeColor !== 'gray' &&
    altman.status === 'GOOD' &&
    piotroski.status === 'GOOD' &&
    beneish.status === 'GOOD' &&
    qoe.status === 'GOOD';

  const isMicroSevereAnomaly =
    benford.badgeColor !== 'gray' &&
    (benford.status === 'BAD' || benford.mad >= 0.015);

  if (transactions.length > 0 && isMacroHealthy && isMicroSevereAnomaly) {
    divergence = {
      hasDivergence: true,
      type: 'MACRO_HEALTH_MICRO_FRAUD',
      title: 'Macro vs. Micro Divergence Detected',
      badgeText: 'DIVERGENCE ALERT: High Macro-Health vs. Micro-Fraud Risk',
      badgeColor: 'yellow',
      headline:
        'Financial statements show pristine solvency & performance, but underlying transaction ledger reveals acute empirical anomalies.',
      explanation: `Executive contradiction identified: High-level financial reporting reflects strong solvency (Altman Z = ${formatNumber(
        altman.zScore,
        2
      )}), stellar operational health (Piotroski F = ${piotroski.fScore}/9), low accounting manipulation (Beneish M = ${formatNumber(
        beneish.mScore,
        2
      )}), and cash-backed earnings (QoE = ${formatRatio(
        qoe.qoeRatio,
        2
      )}x). However, micro-forensic analysis fails decisively: Benford MAD is ${formatNumber(
        benford.mad,
        4
      )} (>= 0.015 threshold) with unnatural digit clustering on digits [${topDistortedDigits
        .filter((d) => d.absDiffFreq >= 0.03)
        .map((d) => d.digit)
        .join(', ')}]${
        roundRatio > 0.15 ? ` and ${(roundRatio * 100).toFixed(0)}% round-sum vouchers` : ''
      }. This pattern is symptomatic of synthetic entries, threshold-avoidance structuring, or unvetted procurement disbursements that aggregate neatly on paper.`,
      macroSignals: {
        altmanZ: altman.zScore,
        altmanStatus: altman.status,
        piotroskiF: piotroski.fScore,
        piotroskiStatus: piotroski.status,
        beneishM: beneish.mScore,
        beneishStatus: beneish.status,
        qoeRatio: qoe.qoeRatio,
        qoeStatus: qoe.status,
      },
      microSignals: {
        mad: benford.mad,
        benfordStatus: benford.status,
        topDistortedDigits,
        excessiveRoundRatio: roundRatio,
      },
      actionableAuditSteps: [
        `Audit procurement & AP ledger specifically filtered for leading digits [${topDistortedDigits
          .slice(0, 2)
          .map((d) => d.digit)
          .join(', ')}]`,
        'Inspect round-sum vouchers ($500 / $1,000 multiples) for missing POs, split invoices, or dual approvals',
        'Cross-reference vendor master file against employee bank accounts & tax IDs to isolate fictitious entities',
        'Conduct substantive cutoff testing on year-end disbursement batches to ensure transaction authenticity',
      ],
    };
  }

  const executiveSummary: ExecutiveSummary = {
    verdict,
    verdictBadgeColor,
    verdictSubtext,
    goodCount,
    warningCount,
    badCount,
    totalMethods: 5,
    keyRiskFlags,
    positiveHighlights,
    methodSummaries,
    divergence,
  };

  return {
    company,
    currentPeriod,
    priorPeriod,
    benford,
    beneish,
    altman,
    piotroski,
    qoe,
    executiveSummary,
    timestamp: new Date().toISOString(),
  };
}
