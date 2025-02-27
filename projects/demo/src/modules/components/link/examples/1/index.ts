import {Component} from '@angular/core';
import {changeDetection} from '@demo/emulate/change-detection';
import {encapsulation} from '@demo/emulate/encapsulation';

@Component({
    selector: 'tui-link-example-1',
    templateUrl: './index.html',
    changeDetection,
    encapsulation,
})
export class TuiLinkExample1 {}
