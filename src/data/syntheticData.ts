import { FinancialStatement, Transaction } from '../types/audit';

/**
 * Generates transactions according to Benford's law or with anomalies
 */
export function generateBenfordTransactions(
  company: string = 'Company Alpha',
  count: number = 220,
  mode: 'benford' | 'anomalous' = 'benford'
): Transaction[] {
  const transactions: Transaction[] = [];
  const baseDate = new Date('2024-01-05');

  // Realistic vendor and expense categories
  const categories = [
    'Procurement PO',
    'Logistics Freight',
    'Software License',
    'Facilities Lease',
    'Consulting Services',
    'Hardware Equipment',
    'Marketing Campaign',
    'Raw Materials',
    'Utility Power',
    'Audit & Legal',
  ];

  for (let i = 0; i < count; i++) {
    // Increment date
    const txDate = new Date(baseDate.getTime() + i * 1.5 * 24 * 3600 * 1000);
    const dateStr = txDate.toISOString().split('T')[0];
    let amount = 0;

    if (mode === 'benford') {
      // Natural logarithmic distribution:
      // U ~ Uniform(0, 1) -> 10^U has leading digit obeying log10(1 + 1/d) exactly!
      // Scale by realistic orders of magnitude ($10 to $100,000)
      const u = Math.random();
      const magnitudePower = 1 + Math.random() * 4; // 10^1 to 10^5
      const baseVal = Math.pow(10, u); // 1.0 to 10.0 obeying Benford
      const scale = Math.pow(10, Math.floor(magnitudePower));
      const centJitter = Math.floor(Math.random() * 100) / 100;
      amount = parseFloat((baseVal * scale + centJitter).toFixed(2));
    } else {
      // Anomalous distribution: heavily biased towards specific digits (e.g. 5, 8, 9, round numbers)
      const biasedDigits = [5, 5, 5, 8, 8, 9, 9, 9, 4, 7];
      const selectedDigit = biasedDigits[Math.floor(Math.random() * biasedDigits.length)];
      const magnitude = Math.pow(10, 2 + Math.floor(Math.random() * 3)); // 100 to 10000
      const remainder = Math.floor(Math.random() * magnitude);
      amount = selectedDigit * magnitude + remainder;
      // Many round numbers in fraud
      if (Math.random() < 0.35) {
        amount = Math.round(amount / 500) * 500;
      }
    }

    transactions.push({
      id: `TX-${2024000 + i}`,
      Company: company,
      Date: dateStr,
      Amount: Math.max(12.5, amount),
      Description: `${categories[Math.floor(Math.random() * categories.length)]} Expense #${1000 + i}`,
      Vendor: `Vendor ${String.fromCharCode(65 + (i % 26))}${i % 100}`,
    });
  }

  return transactions;
}

/**
 * Standard baseline financial statements for Company Alpha (2023 & 2024)
 * High-performing, clean, solvent company
 */
export const ALPHA_FINANCIALS_2021: FinancialStatement = {
  Company: 'Company Alpha',
  Period: '2021',
  TotalAssets: 102000000,
  TotalLiabilities: 44000000,
  CurrentAssets: 46000000,
  CurrentLiabilities: 21000000,
  Receivables: 12000000,
  Inventory: 13500000,
  PPE: 39000000,
  Depreciation: 4400000,
  Sales: 138000000,
  COGS: 84000000,
  SGA: 23500000,
  EBIT: 26100000,
  NetIncome: 18200000,
  CFO: 21400000,
  LongTermDebt: 23000000,
  SharesOutstanding: 10000000,
  RetainedEarnings: 36000000,
};

export const ALPHA_FINANCIALS_2022: FinancialStatement = {
  Company: 'Company Alpha',
  Period: '2022',
  TotalAssets: 114000000,
  TotalLiabilities: 46000000,
  CurrentAssets: 52000000,
  CurrentLiabilities: 23000000,
  Receivables: 13200000,
  Inventory: 14800000,
  PPE: 42000000,
  Depreciation: 4800000,
  Sales: 151000000,
  COGS: 91000000,
  SGA: 24800000,
  EBIT: 30400000,
  NetIncome: 21000000,
  CFO: 25100000,
  LongTermDebt: 23000000,
  SharesOutstanding: 10000000,
  RetainedEarnings: 44000000,
};

export const ALPHA_FINANCIALS_2023: FinancialStatement = {
  Company: 'Company Alpha',
  Period: '2023',
  TotalAssets: 125000000,
  TotalLiabilities: 48000000,
  CurrentAssets: 58000000,
  CurrentLiabilities: 24000000,
  Receivables: 14500000,
  Inventory: 16000000,
  PPE: 45000000,
  Depreciation: 5200000,
  Sales: 165000000,
  COGS: 99000000,
  SGA: 26400000,
  EBIT: 34400000,
  NetIncome: 23500000,
  CFO: 28900000,
  LongTermDebt: 24000000,
  SharesOutstanding: 10000000,
  RetainedEarnings: 52000000,
};

export const ALPHA_FINANCIALS_2024: FinancialStatement = {
  Company: 'Company Alpha',
  Period: '2024',
  TotalAssets: 142000000,
  TotalLiabilities: 51000000,
  CurrentAssets: 68000000,
  CurrentLiabilities: 25000000,
  Receivables: 15200000,
  Inventory: 17500000,
  PPE: 49000000,
  Depreciation: 5800000,
  Sales: 188000000,
  COGS: 110000000,
  SGA: 28200000,
  EBIT: 44000000,
  NetIncome: 30100000,
  CFO: 36200000,
  LongTermDebt: 22000000,
  SharesOutstanding: 10000000,
  RetainedEarnings: 68000000,
};

export const ALPHA_MULTI_PERIODS = [
  ALPHA_FINANCIALS_2021,
  ALPHA_FINANCIALS_2022,
  ALPHA_FINANCIALS_2023,
  ALPHA_FINANCIALS_2024,
];

/**
 * Preset Scenarios for instant evaluation and testing
 */
export interface PresetScenario {
  id: string;
  name: string;
  shortTag: string;
  description: string;
  company: string;
  expectedOutcome: string;
  transactions: Transaction[];
  financialStatements: FinancialStatement[];
  fin2023: FinancialStatement;
  fin2024: FinancialStatement;
}

export const EMPTY_FINANCIAL_STATEMENT: FinancialStatement = {
  Company: 'Custom Company',
  Period: 'N/A',
  TotalAssets: 0,
  TotalLiabilities: 0,
  CurrentAssets: 0,
  CurrentLiabilities: 0,
  Receivables: 0,
  Inventory: 0,
  PPE: 0,
  Depreciation: 0,
  Sales: 0,
  COGS: 0,
  SGA: 0,
  EBIT: 0,
  NetIncome: 0,
  CFO: 0,
  LongTermDebt: 0,
  SharesOutstanding: 0,
  RetainedEarnings: 0,
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'acme_healthy',
    name: 'Company Alpha (Clean Baseline)',
    shortTag: 'Clean Baseline',
    description: 'Robust solvency (Z > 3.5), sound accruals (QoE 1.2x), compliant Benford distribution, and low manipulation probability.',
    company: 'Company Alpha',
    expectedOutcome: 'STRONG & HEALTHY (5/5 Green Badges)',
    transactions: generateBenfordTransactions('Company Alpha', 250, 'benford'),
    financialStatements: ALPHA_MULTI_PERIODS,
    fin2023: ALPHA_FINANCIALS_2023,
    fin2024: ALPHA_FINANCIALS_2024,
  },
  {
    id: 'apex_manipulation',
    name: 'Company Beta (Earnings Manipulation)',
    shortTag: 'Earnings Manipulation',
    description: 'Aggressive revenue timing, surging receivables, paper net income unbacked by operating cash (QoE = 0.35x), tripping Beneish M-Score.',
    company: 'Company Beta',
    expectedOutcome: 'HIGH RISK / RED FLAGS (Beneish M-Score & QoE Flagged)',
    transactions: generateBenfordTransactions('Company Beta', 200, 'benford'),
    financialStatements: [
      {
        Company: 'Company Beta',
        Period: '2021',
        TotalAssets: 92000000,
        TotalLiabilities: 45000000,
        CurrentAssets: 41000000,
        CurrentLiabilities: 23000000,
        Receivables: 8500000,
        Inventory: 12500000,
        PPE: 39000000,
        Depreciation: 4600000,
        Sales: 105000000,
        COGS: 66000000,
        SGA: 18000000,
        EBIT: 17200000,
        NetIncome: 11000000,
        CFO: 13500000,
        LongTermDebt: 22000000,
        SharesOutstanding: 12000000,
        RetainedEarnings: 29000000,
      },
      {
        Company: 'Company Beta',
        Period: '2022',
        TotalAssets: 101000000,
        TotalLiabilities: 49000000,
        CurrentAssets: 44000000,
        CurrentLiabilities: 25000000,
        Receivables: 9800000,
        Inventory: 13800000,
        PPE: 41000000,
        Depreciation: 4900000,
        Sales: 118000000,
        COGS: 73000000,
        SGA: 20000000,
        EBIT: 19800000,
        NetIncome: 12800000,
        CFO: 14800000,
        LongTermDebt: 24000000,
        SharesOutstanding: 12000000,
        RetainedEarnings: 33000000,
      },
      {
        Company: 'Company Beta',
        Period: '2023',
        TotalAssets: 110000000,
        TotalLiabilities: 55000000,
        CurrentAssets: 48000000,
        CurrentLiabilities: 28000000,
        Receivables: 11000000,
        Inventory: 15000000,
        PPE: 42000000,
        Depreciation: 5200000,
        Sales: 130000000,
        COGS: 80000000,
        SGA: 22000000,
        EBIT: 22800000,
        NetIncome: 14500000,
        CFO: 16000000,
        LongTermDebt: 27000000,
        SharesOutstanding: 12000000,
        RetainedEarnings: 38000000,
      },
      {
        Company: 'Company Beta',
        Period: '2024',
        TotalAssets: 145000000,
        TotalLiabilities: 82000000,
        CurrentAssets: 55000000,
        CurrentLiabilities: 38000000,
        Receivables: 32000000, // receivables exploded
        Inventory: 24000000,
        PPE: 38000000,
        Depreciation: 2800000, // slowed depreciation rate
        Sales: 195000000, // high sales growth SGI
        COGS: 135000000, // gross margin compressed
        SGA: 31000000,
        EBIT: 26200000,
        NetIncome: 24000000, // inflated net income
        CFO: 7200000, // meager CFO -> huge accruals
        LongTermDebt: 44000000, // surged debt
        SharesOutstanding: 14000000,
        RetainedEarnings: 45000000,
      },
    ],
    fin2023: {
      Company: 'Company Beta',
      Period: '2023',
      TotalAssets: 110000000,
      TotalLiabilities: 55000000,
      CurrentAssets: 48000000,
      CurrentLiabilities: 28000000,
      Receivables: 11000000,
      Inventory: 15000000,
      PPE: 42000000,
      Depreciation: 5200000,
      Sales: 130000000,
      COGS: 80000000,
      SGA: 22000000,
      EBIT: 22800000,
      NetIncome: 14500000,
      CFO: 16000000,
      LongTermDebt: 27000000,
      SharesOutstanding: 12000000,
      RetainedEarnings: 38000000,
    },
    fin2024: {
      Company: 'Company Beta',
      Period: '2024',
      TotalAssets: 145000000,
      TotalLiabilities: 82000000,
      CurrentAssets: 55000000,
      CurrentLiabilities: 38000000,
      Receivables: 32000000,
      Inventory: 24000000,
      PPE: 38000000,
      Depreciation: 2800000,
      Sales: 195000000,
      COGS: 135000000,
      SGA: 31000000,
      EBIT: 26200000,
      NetIncome: 24000000,
      CFO: 7200000,
      LongTermDebt: 44000000,
      SharesOutstanding: 14000000,
      RetainedEarnings: 45000000,
    },
  },
  {
    id: 'solv_distress',
    name: 'Company Gamma (Bankruptcy Distress)',
    shortTag: 'Bankruptcy Distress',
    description: 'Deteriorating working capital, negative operating earnings, crushing debt load (Z < 0.90), and Piotroski deterioration (F-Score <= 3).',
    company: 'Company Gamma',
    expectedOutcome: 'HIGH RISK / RED FLAGS (Altman Distress & Low Piotroski)',
    transactions: generateBenfordTransactions('Company Gamma', 180, 'benford'),
    financialStatements: [
      {
        Company: 'Company Gamma',
        Period: '2021',
        TotalAssets: 104000000,
        TotalLiabilities: 58000000,
        CurrentAssets: 35000000,
        CurrentLiabilities: 24000000,
        Receivables: 9500000,
        Inventory: 13000000,
        PPE: 52000000,
        Depreciation: 4400000,
        Sales: 94000000,
        COGS: 68000000,
        SGA: 16500000,
        EBIT: 7200000,
        NetIncome: 3800000,
        CFO: 5900000,
        LongTermDebt: 34000000,
        SharesOutstanding: 9000000,
        RetainedEarnings: 14000000,
      },
      {
        Company: 'Company Gamma',
        Period: '2022',
        TotalAssets: 100000000,
        TotalLiabilities: 61000000,
        CurrentAssets: 32000000,
        CurrentLiabilities: 26000000,
        Receivables: 8800000,
        Inventory: 12000000,
        PPE: 50000000,
        Depreciation: 4300000,
        Sales: 89000000,
        COGS: 65000000,
        SGA: 16200000,
        EBIT: 5800000,
        NetIncome: 2500000,
        CFO: 4600000,
        LongTermDebt: 35000000,
        SharesOutstanding: 9000000,
        RetainedEarnings: 11000000,
      },
      {
        Company: 'Company Gamma',
        Period: '2023',
        TotalAssets: 95000000,
        TotalLiabilities: 65000000,
        CurrentAssets: 28000000,
        CurrentLiabilities: 29000000,
        Receivables: 8000000,
        Inventory: 11000000,
        PPE: 48000000,
        Depreciation: 4100000,
        Sales: 82000000,
        COGS: 62000000,
        SGA: 16000000,
        EBIT: 4000000,
        NetIncome: 1200000,
        CFO: 3500000,
        LongTermDebt: 36000000,
        SharesOutstanding: 9000000,
        RetainedEarnings: 8000000,
      },
      {
        Company: 'Company Gamma',
        Period: '2024',
        TotalAssets: 88000000,
        TotalLiabilities: 81000000,
        CurrentAssets: 19000000,
        CurrentLiabilities: 34000000,
        Receivables: 6500000,
        Inventory: 8500000,
        PPE: 44000000,
        Depreciation: 3800000,
        Sales: 68000000,
        COGS: 56000000,
        SGA: 15500000,
        EBIT: -3500000,
        NetIncome: -7200000,
        CFO: -2100000,
        LongTermDebt: 47000000,
        SharesOutstanding: 11500000,
        RetainedEarnings: 800000,
      },
    ],
    fin2023: {
      Company: 'Company Gamma',
      Period: '2023',
      TotalAssets: 95000000,
      TotalLiabilities: 65000000,
      CurrentAssets: 28000000,
      CurrentLiabilities: 29000000,
      Receivables: 8000000,
      Inventory: 11000000,
      PPE: 48000000,
      Depreciation: 4100000,
      Sales: 82000000,
      COGS: 62000000,
      SGA: 16000000,
      EBIT: 4000000,
      NetIncome: 1200000,
      CFO: 3500000,
      LongTermDebt: 36000000,
      SharesOutstanding: 9000000,
      RetainedEarnings: 8000000,
    },
    fin2024: {
      Company: 'Company Gamma',
      Period: '2024',
      TotalAssets: 88000000,
      TotalLiabilities: 81000000,
      CurrentAssets: 19000000,
      CurrentLiabilities: 34000000,
      Receivables: 6500000,
      Inventory: 8500000,
      PPE: 44000000,
      Depreciation: 3800000,
      Sales: 68000000,
      COGS: 56000000,
      SGA: 15500000,
      EBIT: -3500000,
      NetIncome: -7200000,
      CFO: -2100000,
      LongTermDebt: 47000000,
      SharesOutstanding: 11500000,
      RetainedEarnings: 800000,
    },
  },
  {
    id: 'starlight_benford',
    name: 'Company Delta (Benford Anomaly)',
    shortTag: 'Benford Anomaly',
    description: 'Suspicious procurement ledger with excessive round amounts and unnatural digit clustering (MAD >= 0.020, high Chi-square).',
    company: 'Company Delta',
    expectedOutcome: 'WARNING / ANOMALIES (Benford Bad / Chi-Sq High)',
    transactions: generateBenfordTransactions('Company Delta', 280, 'anomalous'),
    financialStatements: [
      { ...ALPHA_FINANCIALS_2021, Company: 'Company Delta' },
      { ...ALPHA_FINANCIALS_2022, Company: 'Company Delta' },
      { ...ALPHA_FINANCIALS_2023, Company: 'Company Delta' },
      { ...ALPHA_FINANCIALS_2024, Company: 'Company Delta' },
    ],
    fin2023: { ...ALPHA_FINANCIALS_2023, Company: 'Company Delta' },
    fin2024: { ...ALPHA_FINANCIALS_2024, Company: 'Company Delta' },
  },
  {
    id: 'custom',
    name: 'Custom Company',
    shortTag: 'Custom Co',
    description: 'Upload your own datasets (Transactions & Financials CSV) and customize the company name.',
    company: 'Custom Company',
    expectedOutcome: 'CUSTOM AUDIT (Based on your uploaded CSV datasets)',
    transactions: [],
    financialStatements: [],
    fin2023: { ...EMPTY_FINANCIAL_STATEMENT, Company: 'Custom Company', Period: '2023' },
    fin2024: { ...EMPTY_FINANCIAL_STATEMENT, Company: 'Custom Company', Period: '2024' },
  },
];

/**
 * Converts transaction list to CSV string
 */
export function transactionsToCSV(transactions: Transaction[]): string {
  const headers = ['Company', 'Date', 'Amount'];
  if (!transactions || transactions.length === 0) {
    return [headers.join(','), '"Custom Company",2024-01-15,1250.00'].join('\n');
  }
  const rows = transactions.map((t) => [
    `"${t.Company.replace(/"/g, '""')}"`,
    t.Date,
    t.Amount.toFixed(2),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Converts financial statements list to CSV string
 */
export function financialsToCSV(statements: FinancialStatement[]): string {
  const headers = [
    'Company',
    'Period',
    'TotalAssets',
    'TotalLiabilities',
    'CurrentAssets',
    'CurrentLiabilities',
    'Receivables',
    'Inventory',
    'PPE',
    'Depreciation',
    'Sales',
    'COGS',
    'SGA',
    'EBIT',
    'NetIncome',
    'CFO',
    'LongTermDebt',
    'SharesOutstanding',
    'RetainedEarnings',
  ];

  if (!statements || statements.length === 0) {
    const templateRow23 = [
      '"Custom Company"',
      '2023',
      100000000,
      40000000,
      45000000,
      20000000,
      12000000,
      14000000,
      40000000,
      5000000,
      120000000,
      75000000,
      20000000,
      25000000,
      18000000,
      22000000,
      20000000,
      10000000,
      35000000,
    ];
    const templateRow24 = [
      '"Custom Company"',
      '2024',
      115000000,
      45000000,
      52000000,
      23000000,
      14500000,
      16000000,
      45000000,
      5500000,
      140000000,
      88000000,
      23000000,
      29000000,
      21000000,
      26000000,
      22000000,
      10000000,
      42000000,
    ];
    return [headers.join(','), templateRow23.join(','), templateRow24.join(',')].join('\n');
  }

  const rows = statements.map((s) => [
    `"${s.Company.replace(/"/g, '""')}"`,
    s.Period,
    s.TotalAssets,
    s.TotalLiabilities,
    s.CurrentAssets,
    s.CurrentLiabilities,
    s.Receivables,
    s.Inventory,
    s.PPE,
    s.Depreciation,
    s.Sales,
    s.COGS,
    s.SGA,
    s.EBIT,
    s.NetIncome,
    s.CFO,
    s.LongTermDebt,
    s.SharesOutstanding,
    s.RetainedEarnings,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Simple CSV parser handling quotes
 */
function parseCSVRows(csvText: string): string[][] {
  const lines = csvText.trim().split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const tokens: string[] = [];
    let insideQuote = false;
    let currentToken = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          currentToken += '"';
          i++; // skip next quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        tokens.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    tokens.push(currentToken.trim());
    rows.push(tokens);
  }

  return rows;
}

/**
 * Parses Transactions CSV
 */
export function parseTransactionsCSV(csvText: string): { data: Transaction[]; errors: string[] } {
  const rows = parseCSVRows(csvText);
  const errors: string[] = [];
  const data: Transaction[] = [];

  if (rows.length < 2) {
    return { data: [], errors: ['CSV file is empty or missing data rows.'] };
  }

  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const compIdx = header.findIndex((h) => h.includes('company'));
  const dateIdx = header.findIndex((h) => h.includes('date'));
  const amountIdx = header.findIndex((h) => h.includes('amount') || h.includes('value') || h.includes('total'));

  if (amountIdx === -1) {
    errors.push('Required column "Amount" not found in CSV header.');
    return { data: [], errors };
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every((c) => c === '')) continue;

    const rawAmount = row[amountIdx];
    const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));

    if (isNaN(cleanAmount)) {
      errors.push(`Row ${i + 1}: Invalid numeric amount "${rawAmount}".`);
      continue;
    }

    const company = compIdx !== -1 && row[compIdx] ? row[compIdx] : 'Uploaded Co';
    const date = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : new Date().toISOString().split('T')[0];

    data.push({
      id: `TX-UP-${i}`,
      Company: company,
      Date: date,
      Amount: cleanAmount,
    });
  }

  return { data, errors };
}

/**
 * Parses Financial Statements CSV
 */
export function parseFinancialsCSV(csvText: string): { data: FinancialStatement[]; errors: string[] } {
  const rows = parseCSVRows(csvText);
  const errors: string[] = [];
  const data: FinancialStatement[] = [];

  if (rows.length < 2) {
    return { data: [], errors: ['Financials CSV is empty or missing data rows.'] };
  }

  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const findIdx = (keywords: string[]): number => {
    return header.findIndex((h) => keywords.some((k) => h === k || h.includes(k)));
  };

  const compIdx = findIdx(['company', 'firm', 'name']);
  const periodIdx = findIdx(['period', 'year', 'date', 'fiscalyear']);
  const taIdx = findIdx(['totalassets', 'assets']);
  const tlIdx = findIdx(['totalliabilities', 'liabilities']);
  const caIdx = findIdx(['currentassets']);
  const clIdx = findIdx(['currentliabilities']);
  const recIdx = findIdx(['receivables', 'ar', 'accountsreceivable']);
  const invIdx = findIdx(['inventory']);
  const ppeIdx = findIdx(['ppe', 'propertyplant', 'fixedassets']);
  const depIdx = findIdx(['depreciation', 'depr', 'deprec']);
  const salesIdx = findIdx(['sales', 'revenue', 'turnover']);
  const cogsIdx = findIdx(['cogs', 'costofgoods', 'costofsales']);
  const sgaIdx = findIdx(['sga', 'sellinggeneral', 'operatingexpenses']);
  const ebitIdx = findIdx(['ebit', 'operatingincome', 'operatingprofit']);
  const niIdx = findIdx(['netincome', 'profit', 'netprofit', 'earnings']);
  const cfoIdx = findIdx(['cfo', 'operatingcashflow', 'cashflowoperations', 'cashfromoperations']);
  const ltdIdx = findIdx(['longtermdebt', 'ltdebt', 'noncurrentdebt']);
  const sharesIdx = findIdx(['sharesoutstanding', 'shares', 'commonshares']);
  const reIdx = findIdx(['retainedearnings', 'retained']);

  const getNum = (row: string[], idx: number, fieldName: string, rowNum: number): number => {
    if (idx === -1 || idx >= row.length) {
      return 0;
    }
    const raw = row[idx];
    const val = parseFloat(raw.replace(/[^0-9.-]+/g, ''));
    if (isNaN(val)) {
      errors.push(`Row ${rowNum}: "${fieldName}" has invalid value "${raw}".`);
      return 0;
    }
    return val;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every((c) => c === '')) continue;

    const company = compIdx !== -1 && row[compIdx] ? row[compIdx] : 'Uploaded Entity';
    const period = periodIdx !== -1 && row[periodIdx] ? row[periodIdx] : `${2020 + i}`;

    data.push({
      Company: company,
      Period: period,
      TotalAssets: getNum(row, taIdx, 'TotalAssets', i + 1),
      TotalLiabilities: getNum(row, tlIdx, 'TotalLiabilities', i + 1),
      CurrentAssets: getNum(row, caIdx, 'CurrentAssets', i + 1),
      CurrentLiabilities: getNum(row, clIdx, 'CurrentLiabilities', i + 1),
      Receivables: getNum(row, recIdx, 'Receivables', i + 1),
      Inventory: getNum(row, invIdx, 'Inventory', i + 1),
      PPE: getNum(row, ppeIdx, 'PPE', i + 1),
      Depreciation: getNum(row, depIdx, 'Depreciation', i + 1),
      Sales: getNum(row, salesIdx, 'Sales', i + 1),
      COGS: getNum(row, cogsIdx, 'COGS', i + 1),
      SGA: getNum(row, sgaIdx, 'SGA', i + 1),
      EBIT: getNum(row, ebitIdx, 'EBIT', i + 1),
      NetIncome: getNum(row, niIdx, 'NetIncome', i + 1),
      CFO: getNum(row, cfoIdx, 'CFO', i + 1),
      LongTermDebt: getNum(row, ltdIdx, 'LongTermDebt', i + 1),
      SharesOutstanding: getNum(row, sharesIdx, 'SharesOutstanding', i + 1),
      RetainedEarnings: getNum(row, reIdx, 'RetainedEarnings', i + 1),
    });
  }

  return { data, errors };
}
