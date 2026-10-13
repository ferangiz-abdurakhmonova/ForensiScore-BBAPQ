# ForensiScore BBAPQ

> ⚠️ **Notice: Test & Prototype Version (v0.1.0)**  
> This platform is currently an experimental research prototype released for methodology testing, peer review, and academic validation. Formulas, threshold benchmarks, and calculations are subject to active verification.
You can explore the live prototype directly in your browser without any installation or account setup:
**[Launch ForensiScore BBAPQ](https://forensi-score-bbapq-4tok.vercel.app/)**

> Integrated 5D Evaluation: **Benford's Law (MAD)** · **Beneish M-Score** · **Altman Z-Score** · **Piotroski F-Score** · **Quality of Earnings (QoE)**

ForensiScore BBAPQ is an advanced forensic accounting and audit technology platform designed to detect financial irregularities and assess corporate health through automated analysis of transaction ledgers and multi-period financial statements.

## Core Forensic Capabilities

ForensiScore BBAPQ evaluates datasets across five key quantitative dimensions:

1. **Benford's Law (Transaction Forensics):** Analyzes the leading digit frequency of ledger transactions to identify unnatural patterns or synthetic entries, featuring Mean Absolute Deviation (MAD) scoring and anomalous transaction drill-down.
2. **Beneish M-Score:** An 8-factor probabilistic model designed to detect earnings manipulation and financial statement distortion.
3. **Altman Z-Score:** An insolvency risk model tailored to identify bankruptcy vulnerability, especially in non-manufacturing service and technology enterprises.
4. **Piotroski F-Score:** A 9-point binary fundamental accounting framework evaluating year-over-year momentum in profitability, leverage, and operating efficiency.
5. **Quality of Earnings (QoE):** Measures the conversion of reported accounting profits (Net Income) into actual liquid cash (CFO) to ensure financial reporting integrity.

## Features

- **End-to-End Traceability:** Every score computation includes a "Math & Source Data Trace" section, allowing auditors to see raw cell references and step-by-step arithmetic substitutions.
- **Interactive Workbench:** Import CSV/Excel datasets and analyze trends, with integrated filtering and drill-down tools to inspect flagged records.
- **Divergence Detection:** Executive-level analysis that identifies structural discrepancies between pristine top-line financial ratios and anomalous underlying transaction patterns.

## Tech Stack

- **Framework:** React SPA (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Forensic Engine:** Custom TypeScript analytical modules
- **Package Manager:** Bun / npm

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
