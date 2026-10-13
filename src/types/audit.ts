export interface Transaction {
  id: string;
  Company: string;
  Date: string;
  Amount: number;
  Description?: string;
  Vendor?: string;
}

export interface FinancialStatement {
  Company: string;
  Period: string; // e.g. "2023" or "2024"
  TotalAssets: number;
  TotalLiabilities: number;
  CurrentAssets: number;
  CurrentLiabilities: number;
  Receivables: number;
  Inventory: number;
  PPE: number;
  Depreciation: number;
  Sales: number;
  COGS: number;
  SGA: number;
  EBIT: number;
  NetIncome: number;
  CFO: number;
  LongTermDebt: number;
  SharesOutstanding: number;
  RetainedEarnings: number;
}

export type RiskStatus = 'GOOD' | 'ACCEPTABLE' | 'MODERATE' | 'WARNING' | 'BAD';
export type BadgeColor = 'green' | 'yellow' | 'red' | 'gray';

export interface BenfordDigitStat {
  digit: number;
  observedCount: number;
  observedFreq: number; // 0 to 1
  expectedFreq: number; // 0 to 1
  expectedCount: number;
  diffFreq: number; // observed - expected
  absDiffFreq: number;
}

export interface BenfordResult {
  digitStats: BenfordDigitStat[];
  totalValidTransactions: number;
  mad: number;
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  status: RiskStatus;
  badgeText: string;
  badgeColor: BadgeColor;
  takeaway: string;
}

export interface BeneishVariableDetail {
  code: string;
  name: string;
  value: number;
  weight: number;
  contribution: number;
  benchmark: string;
  formula: string;
  interpretation: string;
  flagged: boolean;
}

export interface BeneishResult {
  mScore: number;
  status: 'GOOD' | 'BAD';
  badgeText: string;
  badgeColor: BadgeColor;
  takeaway: string;
  variables: {
    DSRI: BeneishVariableDetail;
    GMI: BeneishVariableDetail;
    AQI: BeneishVariableDetail;
    SGI: BeneishVariableDetail;
    DEPI: BeneishVariableDetail;
    SGAI: BeneishVariableDetail;
    TATA: BeneishVariableDetail;
    LVGI: BeneishVariableDetail;
  };
}

export interface AltmanVariableDetail {
  code: string;
  name: string;
  value: number;
  weight: number;
  contribution: number;
  formula: string;
  meaning: string;
}

export interface AltmanResult {
  zScore: number;
  status: 'GOOD' | 'WARNING' | 'BAD';
  zoneName: 'Safe Zone' | 'Grey Zone' | 'Distress Zone';
  badgeText: string;
  badgeColor: BadgeColor;
  takeaway: string;
  variables: {
    X1: AltmanVariableDetail;
    X2: AltmanVariableDetail;
    X3: AltmanVariableDetail;
    X4: AltmanVariableDetail;
  };
}

export interface PiotroskiSignal {
  id: string;
  code: string;
  name: string;
  category: 'Profitability' | 'Leverage & Liquidity' | 'Operating Efficiency';
  condition: string;
  pass: boolean;
  points: number; // 1 or 0
  currentVal: number;
  priorVal?: number;
  formattedComparison: string;
  rationale: string;
}

export interface PiotroskiResult {
  fScore: number; // 0 to 9
  maxScore: number;
  status: 'GOOD' | 'MODERATE' | 'BAD';
  badgeText: string;
  badgeColor: BadgeColor;
  takeaway: string;
  signals: PiotroskiSignal[];
}

export interface QoEResult {
  cfo: number;
  netIncome: number;
  qoeRatio: number;
  accruals: number;
  status: 'GOOD' | 'BAD';
  badgeText: string;
  badgeColor: BadgeColor;
  takeaway: string;
  interpretation: string;
}

export interface MethodSummaryItem {
  id: 'benford' | 'beneish' | 'altman' | 'piotroski' | 'qoe';
  name: string;
  category: string;
  computedValueStr: string;
  numericValue: number;
  benchmarkRule: string;
  status: RiskStatus;
  badgeText: string;
  badgeColor: BadgeColor;
  plainTakeaway: string;
}

export interface DivergenceAnalysis {
  hasDivergence: boolean;
  type: 'MACRO_HEALTH_MICRO_FRAUD' | 'MACRO_DISTRESS_CLEAN_MICRO' | 'NONE';
  title: string;
  badgeText: string;
  badgeColor: BadgeColor;
  headline: string;
  explanation: string;
  macroSignals: {
    altmanZ: number;
    altmanStatus: RiskStatus;
    piotroskiF: number;
    piotroskiStatus: RiskStatus;
    beneishM: number;
    beneishStatus: 'GOOD' | 'BAD';
    qoeRatio: number;
    qoeStatus: 'GOOD' | 'BAD';
  };
  microSignals: {
    mad: number;
    benfordStatus: RiskStatus;
    topDistortedDigits: Array<{
      digit: number;
      observedFreq: number;
      expectedFreq: number;
      diffFreq: number;
      absDiffFreq: number;
    }>;
    excessiveRoundRatio: number;
  };
  actionableAuditSteps: string[];
}

export interface BenfordDrillDownFilter {
  active: boolean;
  targetDigits: number[];
  flagRoundAmounts: boolean;
  reason: string;
  sourceMAD?: number;
}

export interface ExecutiveSummary {
  verdict: 'STRONG & HEALTHY' | 'MODERATE / MIXED SIGNALS' | 'HIGH RISK / RED FLAGS DETECTED' | 'WAITING FOR DATA';
  verdictBadgeColor: BadgeColor;
  verdictSubtext: string;
  goodCount: number;
  warningCount: number;
  badCount: number;
  totalMethods: number;
  keyRiskFlags: string[];
  positiveHighlights: string[];
  methodSummaries: MethodSummaryItem[];
  divergence?: DivergenceAnalysis;
}

export interface AuditEvaluation {
  company: string;
  currentPeriod: string;
  priorPeriod: string;
  benford: BenfordResult;
  beneish: BeneishResult;
  altman: AltmanResult;
  piotroski: PiotroskiResult;
  qoe: QoEResult;
  executiveSummary: ExecutiveSummary;
  timestamp: string;
}
