/** Number / currency / impression formatting helpers. */

export function formatCurrency(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1000) {
    return (
      '$' +
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n)
    );
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatRange(low: number, high: number, compact = true): string {
  return `${formatCurrency(low, compact)} – ${formatCurrency(high, compact)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

export function formatImpressions(n: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.round(n));
}
