/**
 * Statistical and financial calculation utilities
 */

/**
 * Theoretical Benford's Law probability for first digit d in [1..9]
 * P(d) = log10(1 + 1/d)
 */
export function getBenfordProbability(digit: number): number {
  if (digit < 1 || digit > 9) return 0;
  return Math.log10(1 + 1 / digit);
}

/**
 * Extracts the leading non-zero digit (1..9) of a number.
 * Returns null if the number is zero, NaN, or non-finite.
 */
export function extractFirstDigit(value: number | string): number | null {
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  if (!Number.isFinite(num)) return null;

  const abs = Math.abs(num);
  if (abs === 0) return null;

  // Convert to exponential notation or clean string to easily find the first non-zero digit
  const str = abs.toExponential();
  const firstChar = str.charAt(0);
  const digit = parseInt(firstChar, 10);

  return digit >= 1 && digit <= 9 ? digit : null;
}

/**
 * Log-gamma function Lanczos approximation
 */
function logGamma(x: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.138571095836524,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    a += p[i] / (x + i + 1);
  }
  const t = x + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Lower incomplete regularized gamma function P(a, x) = gamma(a, x) / Gamma(a)
 * Series representation
 */
function gammp(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x < a + 1) {
    // Series expansion
    let sum = 1 / a;
    let term = sum;
    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-12) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  } else {
    // Continued fraction for Q(a, x)
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 100; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    const q = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
    return 1 - q;
  }
}

/**
 * Chi-Square survival function (p-value): P(X^2 >= chiSquare) for given degrees of freedom
 */
export function chiSquarePValue(chiSquare: number, df: number): number {
  if (chiSquare <= 0) return 1;
  if (df <= 0) return 1;
  const p = 1 - gammp(df / 2, chiSquare / 2);
  return Math.max(0, Math.min(1, p));
}

// Formatting helpers
export function formatCurrency(val: number): string {
  if (!Number.isFinite(val)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number, decimals: number = 2): string {
  if (!Number.isFinite(val)) return '0.00';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(val: number, decimals: number = 2): string {
  if (!Number.isFinite(val)) return '0.00%';
  return `${(val * 100).toFixed(decimals)}%`;
}

export function formatRatio(val: number, decimals: number = 3): string {
  if (!Number.isFinite(val)) return '0.000';
  return val.toFixed(decimals);
}
