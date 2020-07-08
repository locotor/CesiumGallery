import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';

import { BaseMapComponent } from './components/base-map/base-map.component';

const antdModules = [
  NzLayoutModule,
  NzMenuModule,
  NzIconModule,
  NzCardModule
];

@NgModule({
  declarations: [
    BaseMapComponent
  ],
  imports: [
    ...antdModules,
    CommonModule
  ],
  exports: [
    ...antdModules,
    BaseMapComponent
  ]
})
export class SharedModule { }
