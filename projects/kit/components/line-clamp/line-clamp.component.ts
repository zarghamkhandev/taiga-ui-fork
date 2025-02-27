import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DoCheck,
    ElementRef,
    HostBinding,
    HostListener,
    Inject,
    Input,
    NgZone,
    Output,
    Renderer2,
    ViewChild,
} from '@angular/core';
import {
    tuiDefaultProp,
    tuiIsCurrentTarget,
    tuiTypedFromEvent,
    tuiZonefree,
} from '@taiga-ui/cdk';
import {TUI_HINT_COMPONENT, TuiHintDirective} from '@taiga-ui/core';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';
import {BehaviorSubject, Observable, of, Subject, timer} from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    map,
    pairwise,
    startWith,
    switchMap,
} from 'rxjs/operators';

import {TuiLineClampBoxComponent} from './line-clamp-box.component';
import {TUI_LINE_CLAMP_OPTIONS, TuiLineClampOptions} from './line-clamp-options';

@Component({
    selector: 'tui-line-clamp',
    templateUrl: './line-clamp.template.html',
    styleUrls: ['./line-clamp.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TUI_HINT_COMPONENT,
            useValue: TuiLineClampBoxComponent,
        },
    ],
})
export class TuiLineClampComponent implements DoCheck, AfterViewInit {
    @ViewChild(TuiHintDirective, {read: ElementRef})
    private readonly outlet?: ElementRef<HTMLElement>;

    private readonly linesLimit$ = new BehaviorSubject(1);
    private readonly isOverflown$ = new Subject<boolean>();
    private initialized = false;

    @HostBinding('style.maxHeight.px')
    maxHeight: number | null = null;

    @HostBinding('style.height.px')
    height = 0;

    @Input()
    @tuiDefaultProp()
    set linesLimit(linesLimit: number) {
        this.linesLimit$.next(linesLimit);
    }

    @Input()
    @tuiDefaultProp()
    lineHeight = 24;

    @Input()
    @tuiDefaultProp()
    content: PolymorpheusContent = '';

    @Output()
    readonly overflownChange: Observable<boolean> = this.isOverflown$.pipe(
        distinctUntilChanged(),
    );

    lineClamp$ = this.linesLimit$.pipe(
        startWith(1),
        pairwise(),
        switchMap(([prev, next]) =>
            next >= prev
                ? of(next)
                : tuiTypedFromEvent(this.elementRef.nativeElement, 'transitionend').pipe(
                      filter(tuiIsCurrentTarget),
                      map(() => next),
                  ),
        ),
    );

    constructor(
        @Inject(ElementRef) private readonly elementRef: ElementRef<HTMLElement>,
        @Inject(Renderer2) private readonly renderer: Renderer2,
        @Inject(ChangeDetectorRef) private readonly cd: ChangeDetectorRef,
        @Inject(NgZone) private readonly ngZone: NgZone,
        @Inject(TUI_LINE_CLAMP_OPTIONS) private readonly options: TuiLineClampOptions,
    ) {
        this.skipInitialTransition();
    }

    get overflown(): boolean {
        if (!this.outlet) {
            return false;
        }

        const {scrollHeight, scrollWidth} = this.outlet.nativeElement;
        const {clientHeight, clientWidth} = this.elementRef.nativeElement;

        // 4px buffer for IE/Edge incorrectly rounding scrollHeight
        return scrollHeight - clientHeight > 4 || scrollWidth - clientWidth > 0;
    }

    get computedContent(): PolymorpheusContent {
        return this.options.showHint && this.overflown ? this.content : '';
    }

    @HostListener('transitionend')
    updateView(): void {
        this.cd.detectChanges();
    }

    ngAfterViewInit(): void {
        this.initialized = true;
    }

    ngDoCheck(): void {
        this.updateStaticallyHostBinding();
        this.isOverflown$.next(this.overflown);
    }

    private skipInitialTransition(): void {
        timer(0)
            .pipe(tuiZonefree(this.ngZone))
            .subscribe(() => {
                this.renderer.addClass(this.elementRef.nativeElement, '_initialized');
                this.cd.detectChanges();
            });
    }

    private updateStaticallyHostBinding(): void {
        if (this.outlet) {
            this.height = this.outlet.nativeElement.scrollHeight + 4;
        }

        if (this.initialized) {
            this.maxHeight = this.lineHeight * this.linesLimit$.value;
        }
    }
}
