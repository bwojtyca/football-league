import { Directive, DestroyRef, ElementRef, inject } from '@angular/core';

/**
 * Text wider than its box slides to its end and back, like an LED board, instead of being cut.
 * Put it on the inner track; its parent clips. Sets the class `marquee` and `--shift`.
 */
@Directive({ selector: '[flMarquee]' })
export class MarqueeDirective {
  constructor() {
    const track = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const measure = () => {
      const box = track.parentElement;
      if (!box) {
        return;
      }
      const overflow = track.scrollWidth - box.clientWidth;
      track.classList.toggle('marquee', overflow > 1);
      track.style.setProperty('--shift', `${-Math.max(0, overflow + 12)}px`);
    };
    const observer = new ResizeObserver(measure);
    queueMicrotask(() => {
      observer.observe(track);
      if (track.parentElement) {
        observer.observe(track.parentElement);
      }
      measure();
    });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
