import { Pipe, PipeTransform } from '@angular/core';

/** Keeps a short text on one line, e.g. a date ("13 paź 2026" never breaks after "paź"). */
@Pipe({ name: 'nbsp' })
export class NbspPipe implements PipeTransform {
  public transform(value: string | null | undefined): string {
    return (value ?? '').replace(/ /g, ' ');
  }
}
