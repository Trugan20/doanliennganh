export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email address',
  required: (v: string) => (v && v.trim().length > 0) || 'This field is required',
  minLength: (min: number) => (v: string) => v.length >= min || `Must be at least ${min} characters`,
  maxLength: (max: number) => (v: string) => v.length <= max || `Must be at most ${max} characters`,
  phone: (v: string) => /^[0-9+\-\s()]{7,15}$/.test(v) || 'Invalid phone number',
  positiveNumber: (v: number) => v > 0 || 'Must be a positive number',
  date: (v: string) => !isNaN(Date.parse(v)) || 'Invalid date',
  futureDate: (v: string) => new Date(v) > new Date() || 'Date must be in the future',
}

export function validate(
  value: string | number,
  rules: Array<(v: any) => string | true>
): string | null {
  for (const rule of rules) {
    const result = rule(value)
    if (result !== true) return result
  }
  return null
}