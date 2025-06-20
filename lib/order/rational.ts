export type Rational = {
  numerator: bigint
  denominator: bigint
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== BigInt(0)) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

export function reduceRational(r: Rational): Rational {
  if (r.denominator === BigInt(0))
    throw new Error("Division by zero in rational")
  const divisor = gcd(
    r.numerator < BigInt(0) ? -r.numerator : r.numerator,
    r.denominator
  )
  return {
    numerator: r.numerator / divisor,
    denominator: r.denominator / divisor,
  }
}

export function makeRational(numerator: bigint, denominator: bigint): Rational {
  if (denominator === BigInt(0)) throw new Error("Division by zero in rational")
  return reduceRational({ numerator, denominator })
}

// Compare two rationals: returns negative if a < b, 0 if equal, positive if a > b.
export function compareRational(a: Rational, b: Rational): number {
  const left = a.numerator * b.denominator
  const right = b.numerator * a.denominator
  if (left < right) return -1
  if (left > right) return 1
  return 0
}
