/**
 * Compute the assigned fiscal year for a given date.
 * Calendar year cycle:
 * - January to December: Fiscal Year = Calendar Year
 */
export function getFiscalYear(date: Date = new Date()): number {
  return date.getFullYear();
}
