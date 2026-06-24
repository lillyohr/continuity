export function render(template, vars) {
    return template
        .replace(/\{\{JOB_ID\}\}/g, vars.JOB_ID)
        .replace(/\{\{JOB_NAME\}\}/g, vars.JOB_NAME)
        .replace(/\{\{SLUG\}\}/g, vars.SLUG)
        .replace(/\{\{DATE\}\}/g, vars.DATE);
}
