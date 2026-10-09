/**
 * Escapes SQL LIKE / ILIKE wildcard characters (%, _, \)
 * so that user searches treat them as literal characters per AC-SRCH-05.
 */
export function escapeSearchTerm(term: string): string {
  return term
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}
