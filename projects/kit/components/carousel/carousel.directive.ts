import {Directive, ElementRef, Inject, Input} from '@angular/core';
import {PAGE_VISIBILITY} from '@ng-web-apis/common';
import {
    ALWAYS_FALSE_HANDLER,
    ALWAYS_TRUE_HANDLER,
    tuiIfMap,
    tuiTypedFromEvent,
} from '@taiga-ui/cdk';
import {BehaviorSubject, combineLatest, interval, merge, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Directive({
    selector: 'tui-carousel',
})
export class TuiCarouselDirective extends Observable<unknown> {
    private readonly duration$ = new BehaviorSubject(0);

    private readonly running$ = merge(
        tuiTypedFromEvent(this.elementRef.nativeElement, 'mouseenter').pipe(
            map(ALWAYS_FALSE_HANDLER),
        ),
        tuiTypedFromEvent(this.elementRef.nativeElement, 'touchstart').pipe(
            map(ALWAYS_FALSE_HANDLER),
        ),
        tuiTypedFromEvent(this.elementRef.nativeElement, 'touchend').pipe(
            map(ALWAYS_TRUE_HANDLER),
        ),
        tuiTypedFromEvent(this.elementRef.nativeElement, 'mouseleave').pipe(
            map(ALWAYS_TRUE_HANDLER),
        ),
        this.visible$,
    );

    private readonly output$ = combineLatest([this.duration$, this.running$]).pipe(
        tuiIfMap(
            ([duration]) => interval(duration),
            values => values.every(Boolean),
        ),
    );

    @Input()
    set duration(duration: number) {
        this.duration$.next(duration);
    }

    @Input()
    set index(_: number) {
        this.duration$.next(this.duration$.value);
    }

    constructor(
        @Inject(ElementRef) private readonly elementRef: ElementRef<HTMLElement>,
        @Inject(PAGE_VISIBILITY) private readonly visible$: Observable<boolean>,
    ) {
        super(subscriber => this.output$.subscribe(subscriber));
    }
}
