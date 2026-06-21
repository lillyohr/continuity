export type TemplateVars = {
  JOB_ID: string;
  JOB_NAME: string;
  SLUG: string;
  DATE: string;
};

export function render(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{JOB_ID\}\}/g, vars.JOB_ID)
    .replace(/\{\{JOB_NAME\}\}/g, vars.JOB_NAME)
    .replace(/\{\{SLUG\}\}/g, vars.SLUG)
    .replace(/\{\{DATE\}\}/g, vars.DATE);
}
