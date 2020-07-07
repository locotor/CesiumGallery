import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-demo-box',
  templateUrl: './demo-box.component.html',
  styleUrls: ['./demo-box.component.less']
})
export class DemoBoxComponent implements OnInit {

  @Input() public title = '';
  @Input() public url = '';
  @Input() public img = '';

  constructor() { }

  ngOnInit() {
    this.updateUrl();
  }

  updateUrl() {
    // this.url = `${location.origin}/${this.url}`;
  }

  openUrl() {
    window.open('#/' + this.url, '_blank');
  }

}
