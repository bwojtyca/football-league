import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  transform(text: string, search: string): string {
    if (search && text && typeof search === 'string' && typeof text === 'string') {
      let pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
      pattern = pattern.split(' ').filter((t) => t.length > 0).join('|');
      const regex = new RegExp(pattern, 'gi');
      return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
    } else {
      return text;
    }
  }
}
