# AuditScore: Mathematical Audit Features Implementation Plan

## 1. Overview
The AuditScore platform implements automated forensic auditing using five core quantitative models. This plan details the mathematical underpinnings, data mapping, and component structure for these features.

## 2. Mathematical Models & Formulas
| Model | Formula |
| :--- | :--- |
| **Benford's Law** | MAD = (1/9) · Σ |P_obs(d) - P_exp(d)|, where P_exp(d) = log10(1 + 1/d) |
| **Beneish M-Score** | M = -4.84 + 0.92(DSRI) + 0.528(GMI) + 0.404(AQI) + 0.892(SGI) + 0.115(DEPI) - 0.172(SGAI) + 4.679(TATA) - 0.327(LVGI) |
| **Altman Z-Score** | Z = 6.56(WC/TA) + 3.26(RE/TA) + 6.72(EBIT/TA) + 1.05(BookEquity/TL) |
| **Piotroski F-Score** | F = Σ [S1 + S2 + S3 + S4 + S5 + S6 + S7 + S8 + S9], where Si = 1 if condition met, else 0 |
| **QoE Ratio** | QoE = CFO / NetIncome |

## 3. Data Mappings & Traceability
All models are mapped from raw input fields to calculated metrics with explicit cell references:
- **Ledger Data:** CSV transactions mapped via `BenfordChartPanel`.
- **Financial Statements:** `BalanceSheet`, `IncomeStatement`, `CashFlow` CSV inputs mapped to model variables (e.g., `Receivables` -> DSRI, `CFO` -> QoE).
- **Traceability:** Enabled via `MathSourceTraceSection` which provides step-by-step substitution display.

## 4. UI Breakdown & Components
- **`BenfordChartPanel`**: Forensic ledger interaction, digit deviation chart, anomalous transaction inspector table (with reset functionality).
- **`BeneishPanel`, `AltmanPanel`, `PiotroskiPanel`, `QoEPanel`**: Model-specific dashboards displaying scores, gauges, factor contributions, and traceability sections.
- **`MathSourceTraceSection`**: Universal sub-component for displaying formulas, raw source cell references, and arithmetic substitution steps.
- **`ExecutiveVerdictCard`**: High-level summary, macro/micro divergence detection banner, and navigation triggers to data sources.

## 5. Status
- [x] All 5 models implemented.
- [x] Data traceability implemented via `MathSourceTraceSection`.
- [x] Interactive drill-down and inspector modal functional.
- [x] Filter reset functionality added to `BenfordChartPanel`.
