import { TestBed } from '@angular/core/testing';

import { Player } from '../player';
import { PlayerService } from '../player.service';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  const players = new Map<string, Player>();

  beforeEach(() => {
    players.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: PlayerService, useValue: { player: (id: string) => players.get(id) } }],
    });
  });

  it('shows initials on a colour derived from the player id', async () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('playerId', '6BPiqbRevZs74xyoRzhT');
    fixture.componentRef.setInput('name', 'Jan Maria Rokita');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent?.trim()).toBe('JR');
    expect(element.style.backgroundColor).not.toBe('');
    expect(element.getAttribute('aria-label')).toBe('Jan Maria Rokita');
  });

  it('falls back to the first letters of a single name', async () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('playerId', 'x');
    fixture.componentRef.setInput('name', 'Mateusz');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('Ma');
  });

  it("shows the player's figure once they have a kit", async () => {
    players.set('k', {
      id: 'k',
      name: 'Kasia',
      kit: { pattern: 'stripes', c1: 'white', c2: 'black', num: 7 },
    });
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('playerId', 'k');
    fixture.componentRef.setInput('name', 'Kasia');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.classList).toContain('kit');
    expect(element.querySelector('fl-kit-figure svg')).not.toBeNull();
    expect(element.querySelector('text')?.textContent).toBe('7');
  });
});
