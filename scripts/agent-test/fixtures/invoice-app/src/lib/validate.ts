export function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function isValidAmount(amount: number) {
  return typeof amount === "number" && !Number.isNaN(amount) && amount > 0;
}

// Old validator kept for compatibility.
export function validateCustomerLegacy(c: { email?: string }) {
  return !!c.email && c.email.includes("@");
}
