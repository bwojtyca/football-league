import { Pipe, PipeTransform } from '@angular/core';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Wraps the words of `search` found in `text` in `<span class="highlight">`, escaping the rest. */
@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  public transform(text: string, search: unknown): string {
    if (typeof text !== 'string') {
      return text;
    }
    const words =
      typeof search === 'string'
        ? search
            .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
            .split(' ')
            .filter((word) => word.length > 0)
        : [];
    if (words.length === 0) {
      return escapeHtml(text);
    }
    // With a single capturing group, the odd entries of the split are the matches.
    return text
      .split(new RegExp(`(${words.join('|')})`, 'gi'))
      .map((part, i) =>
        i % 2 ? `<span class="highlight">${escapeHtml(part)}</span>` : escapeHtml(part),
      )
      .join('');
  }
}
