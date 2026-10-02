import { TestBed } from '@angular/core/testing';

import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  it('shows initials on a colour derived from the player id', async () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('playerId', '6BPiqbRevZs74xyoRzhT');
    fixture.componentRef.setInput('name', 'Jan Maria Rokita');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toBe('JR');
    expect(element.style.backgroundColor).not.toBe('');
    expect(element.getAttribute('aria-label')).toBe('Jan Maria Rokita');
  });

  it('falls back to the first letters of a single name', async () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('playerId', 'x');
    fixture.componentRef.setInput('name', 'Mateusz');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toBe('Ma');
  });
});
