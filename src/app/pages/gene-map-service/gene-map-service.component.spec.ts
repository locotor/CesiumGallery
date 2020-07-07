import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneMapServiceComponent } from './gene-map-service.component';

describe('GeneMapServiceComponent', () => {
  let component: GeneMapServiceComponent;
  let fixture: ComponentFixture<GeneMapServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneMapServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneMapServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
