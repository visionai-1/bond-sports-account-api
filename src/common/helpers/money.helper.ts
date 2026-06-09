// Exact decimal arithmetic for numeric(19,4) money fields, using BigInt at scale 4.
// Avoids JavaScript floating-point error. Values are strings in/out (matching the pg driver).

const SCALE = 4;

function toUnits(value: string): bigint {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const [intPart, fracPart = ''] = trimmed.replace('-', '').split('.');
  const frac = (fracPart + '0'.repeat(SCALE)).slice(0, SCALE);
  const units = BigInt((intPart || '0') + frac);
  return negative ? -units : units;
}

function fromUnits(units: bigint): string {
  const negative = units < 0n;
  const abs = (negative ? -units : units).toString().padStart(SCALE + 1, '0');
  const intPart = abs.slice(0, -SCALE);
  const fracPart = abs.slice(-SCALE);
  return `${negative ? '-' : ''}${intPart}.${fracPart}`;
}

export const Money = {
  isPositive(value: string): boolean {
    return toUnits(value) > 0n;
  },
  add(a: string, b: string): string {
    return fromUnits(toUnits(a) + toUnits(b));
  },
  subtract(a: string, b: string): string {
    return fromUnits(toUnits(a) - toUnits(b));
  },
  // a >= b
  gte(a: string, b: string): boolean {
    return toUnits(a) >= toUnits(b);
  },
  // a <= b
  lte(a: string, b: string): boolean {
    return toUnits(a) <= toUnits(b);
  },
};
