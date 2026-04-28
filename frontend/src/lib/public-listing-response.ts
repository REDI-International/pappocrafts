/** Hide direct contact fields from public catalog JSON (returned only via /api/public/reveal-contact). */
export function redactPublicListingContact(row: Record<string, unknown>): Record<string, unknown> {
  const o = { ...row };
  o.phone = "";
  o.submitter_phone = "";
  o.contact_email = "";
  o.submitter_email = "";
  delete o.contact_reveal_count;
  return o;
}
