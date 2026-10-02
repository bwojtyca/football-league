/** A theme colour as `rgb(...)`, for Chart.js which cannot read CSS variables. */
export function cssColor(variable: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${variable})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** The same colour, see-through. */
export function withAlpha(color: string, alpha: number): string {
  return color.replace(/^rgb\((.*)\)$/, `rgba($1, ${alpha})`);
}
