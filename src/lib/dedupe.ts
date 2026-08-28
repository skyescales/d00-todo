export function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function leadKeys(businessName: string, city: string) {
  return {
    businessNameKey: normalizeKey(businessName),
    cityKey: normalizeKey(city),
  };
}
