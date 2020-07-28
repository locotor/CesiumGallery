import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TiandituComponent } from './tianditu.component';

describe('TiandituComponent', () => {
  let component: TiandituComponent;
  let fixture: ComponentFixture<TiandituComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TiandituComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TiandituComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
