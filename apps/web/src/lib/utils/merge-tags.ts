const SAMPLE_VALUES: Record<string, string> = {
  first_name: 'Maya',
  last_name: 'Chen',
  email: 'maya.chen@example.com',
};

/** Replace {{variable}} tags with sample values for live email preview */
export function resolveMergeTags(template: string): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => SAMPLE_VALUES[key] ?? `{{${key}}}`);
}
