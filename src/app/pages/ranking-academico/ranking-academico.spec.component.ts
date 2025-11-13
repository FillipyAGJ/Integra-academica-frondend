import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankingAcademico } from './ranking-academico.component';

describe('RankingAcademico', () => {
  let component: RankingAcademico;
  let fixture: ComponentFixture<RankingAcademico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingAcademico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RankingAcademico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
