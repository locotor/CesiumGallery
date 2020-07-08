import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoBoxComponent } from './demo-box.component';

describe('DemoBoxComponent', () => {
  let component: DemoBoxComponent;
  let fixture: ComponentFixture<DemoBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DemoBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
