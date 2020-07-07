import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenSplitComponent } from './screen-split.component';

describe('ScreenSplitComponent', () => {
  let component: ScreenSplitComponent;
  let fixture: ComponentFixture<ScreenSplitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScreenSplitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScreenSplitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
