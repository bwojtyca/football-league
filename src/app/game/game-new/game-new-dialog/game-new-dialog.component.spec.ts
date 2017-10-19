import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameNewDialogComponent } from './game-new-dialog.component';

describe('GameNewDialogComponent', () => {
  let component: GameNewDialogComponent;
  let fixture: ComponentFixture<GameNewDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameNewDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameNewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
