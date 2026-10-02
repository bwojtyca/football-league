import { HttpClient, provideHttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, Injectable, isDevMode, Provider } from '@angular/core';
import { getBrowserLang, provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';

export const LANGUAGES = [
  { lang: 'pl', label: 'Polski' },
  { lang: 'en', label: 'English' },
] as const;

/** Loads `public/i18n/<lang>.json`. */
@Injectable({ providedIn: 'root' })
class TranslationLoader implements TranslocoLoader {
  private readonly _http = inject(HttpClient);

  public getTranslation(lang: string) {
    return this._http.get<Translation>(`i18n/${lang}.json`);
  }
}

function storage(): Storage | undefined {
  try {
    return localStorage;
  } catch {
    return undefined; // Private mode: the language is not remembered.
  }
}

/** Transloco with ICU messages, locale-aware numbers and dates, and the chosen language remembered. */
export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(),
    ...provideTransloco({
      config: {
        availableLangs: LANGUAGES.map((l) => l.lang),
        defaultLang: getBrowserLang() === 'pl' ? 'pl' : 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        missingHandler: { useFallbackTranslation: true },
        prodMode: !isDevMode(),
      },
      loader: TranslationLoader,
    }),
    provideTranslocoMessageformat(),
    provideTranslocoLocale({ langToLocaleMapping: { pl: 'pl-PL', en: 'en-GB' } }),
    provideTranslocoPersistLang({
      storageKey: 'fl.lang',
      storage: { useFactory: storage },
      getLangFn: ({ cachedLang, defaultLang }) =>
        cachedLang && LANGUAGES.some((l) => l.lang === cachedLang) ? cachedLang : defaultLang,
    }),
  ];
}
