import {
    AfterViewInit,
    ChangeDetectorRef,
    Directive,
    EventEmitter,
    HostBinding,
    Inject,
    Input,
    Output,
} from '@angular/core';
import {IntersectionObserverService} from '@ng-web-apis/intersection-observer';
import {TuiComparator} from '@taiga-ui/addon-table/types';
import {AbstractTuiController, tuiDefaultProp} from '@taiga-ui/cdk';
import {TUI_MODE, TuiBrightness, TuiSizeL, TuiSizeS} from '@taiga-ui/core';
import {Observable} from 'rxjs';

import {TUI_STUCK} from '../providers/stuck.provider';
// TODO: find the best way for prevent cycle
// eslint-disable-next-line import/no-cycle
import {TUI_TABLE_PROVIDERS} from '../providers/table.providers';

@Directive({
    selector: 'table[tuiTable]',
    providers: TUI_TABLE_PROVIDERS,
    host: {
        '($.data-mode.attr)': 'mode$',
        '($.class._stuck)': 'stuck$',
        style: 'border-collapse: separate',
    },
})
export class TuiTableDirective<T extends Partial<Record<keyof T, any>>>
    extends AbstractTuiController
    implements AfterViewInit
{
    @Input()
    @tuiDefaultProp()
    columns: ReadonlyArray<string | keyof T> = [];

    @Input()
    @HostBinding('attr.data-size')
    @tuiDefaultProp()
    size: TuiSizeL | TuiSizeS = 'm';

    @Input()
    @tuiDefaultProp()
    direction: -1 | 1 = 1;

    @Output()
    readonly directionChange = new EventEmitter<-1 | 1>();

    @Output()
    readonly sorterChange = new EventEmitter<TuiComparator<T> | null>();

    constructor(
        @Inject(IntersectionObserverService)
        readonly entries$: Observable<IntersectionObserverEntry[]>,
        @Inject(TUI_MODE) readonly mode$: Observable<TuiBrightness | null>,
        @Inject(TUI_STUCK) readonly stuck$: Observable<boolean>,
        @Inject(ChangeDetectorRef) private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        super();
    }

    @Input()
    @tuiDefaultProp()
    sorter: TuiComparator<T> = () => 0;

    updateSorterAndDirection(sorter: TuiComparator<T> | null): void {
        if (this.sorter === sorter) {
            this.updateDirection(this.direction === 1 ? -1 : 1);
        } else {
            this.updateSorter(sorter);
            this.updateDirection(1);
        }
    }

    ngAfterViewInit(): void {
        this.changeDetectorRef.detectChanges();
    }

    updateSorter(sorter: TuiComparator<T> | null): void {
        this.sorter = sorter || (() => 0);
        this.sorterChange.emit(this.sorter);
        this.change$.next();
    }

    private updateDirection(direction: -1 | 1): void {
        this.direction = direction;
        this.directionChange.emit(this.direction);
        this.change$.next();
    }
}
