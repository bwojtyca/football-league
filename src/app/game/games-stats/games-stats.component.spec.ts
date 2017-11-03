import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesStatsComponent } from './games-stats.component';

describe('GamesStatsComponent', () => {
  let component: GamesStatsComponent;
  let fixture: ComponentFixture<GamesStatsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GamesStatsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GamesStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
