/**
 * Substitutes `{{token}}` placeholders in an editable email template.
 * Duplicated (kept manually in sync) in
 * frontend/src/lib/emailTemplate.ts — see that file's comment for why.
 */
export function renderEmailTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}
