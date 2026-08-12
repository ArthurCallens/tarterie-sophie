/**
 * Substitutes `{{token}}` placeholders in an editable email template.
 * Duplicated (kept manually in sync) in
 * backend/invoicing/src/lib/emailTemplate.ts, since the frontend admin
 * preview and the actual trigger.dev send are separate build targets with
 * no shared package — same precedent as other duplicated constants in this
 * codebase (see DeclineOrderModal.tsx).
 */
export function renderEmailTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}
