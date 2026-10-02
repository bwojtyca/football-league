import { Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { LANGUAGES } from '../i18n/transloco';

/** The language of the app, as a segmented switch. */
@Component({
  selector: 'fl-language-switch',
  imports: [TranslocoPipe],
  template: `
    <div class="fl-switch" role="radiogroup" [attr.aria-label]="'menu.language' | transloco">
      @for (option of languages; track option.lang) {
        <button
          role="radio"
          [attr.aria-checked]="transloco.activeLang() === option.lang"
          [attr.lang]="option.lang"
          (click)="transloco.setActiveLang(option.lang)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitchComponent {
  protected readonly transloco = inject(TranslocoService);
  protected readonly languages = LANGUAGES;
}
