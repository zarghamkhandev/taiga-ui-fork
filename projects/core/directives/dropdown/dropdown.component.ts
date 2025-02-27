import {AnimationOptions} from '@angular/animations';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    Inject,
    OnDestroy,
    Optional,
    Self,
} from '@angular/core';
import {WINDOW} from '@ng-web-apis/common';
import {
    AbstractTuiPortalHostComponent,
    TuiDestroyService,
    tuiGetClosestFocusable,
    tuiPx,
} from '@taiga-ui/cdk';
import {
    tuiPositionAccessorFor,
    TuiRectAccessor,
    tuiRectAccessorFor,
} from '@taiga-ui/core/abstract';
import {tuiDropdownAnimation} from '@taiga-ui/core/animations';
import {TuiDropdownAnimation} from '@taiga-ui/core/enums';
import {TuiPositionService, TuiVisualViewportService} from '@taiga-ui/core/services';
import {TUI_ANIMATION_OPTIONS} from '@taiga-ui/core/tokens';
import {TuiPoint} from '@taiga-ui/core/types';
import {Observable} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

// TODO: find the best way for prevent cycle
// eslint-disable-next-line import/no-cycle
import {TuiDropdownDirective} from './dropdown.directive';
import {TuiDropdownHoverDirective} from './dropdown-hover.directive';
import {TUI_DROPDOWN_OPTIONS, TuiDropdownOptions} from './dropdown-options.directive';

/**
 * @description:
 * This component is used to show template in a portal
 * using default style of white rounded box with a shadow
 */
@Component({
    selector: 'tui-dropdown',
    templateUrl: './dropdown.template.html',
    styleUrls: ['./dropdown.style.less'],
    providers: [
        TuiDestroyService,
        TuiPositionService,
        tuiPositionAccessorFor('dropdown'),
        tuiRectAccessorFor('dropdown', TuiDropdownDirective),
    ],
    animations: [tuiDropdownAnimation],
    // @bad TODO: OnPush
    // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
    changeDetection: ChangeDetectionStrategy.Default,
})
export class TuiDropdownComponent implements OnDestroy {
    @HostBinding('@tuiDropdownAnimation')
    readonly dropdownAnimation = {
        value: TuiDropdownAnimation.FadeInTop,
        ...this.animationOptions,
    };

    constructor(
        @Inject(TuiPositionService) position$: Observable<TuiPoint>,
        @Self() @Inject(TuiDestroyService) destroy$: Observable<void>,
        @Inject(TuiDropdownDirective) readonly directive: TuiDropdownDirective,
        @Inject(ElementRef) private readonly elementRef: ElementRef<HTMLElement>,
        @Inject(AbstractTuiPortalHostComponent)
        private readonly host: AbstractTuiPortalHostComponent,
        @Inject(TuiRectAccessor) private readonly accessor: TuiRectAccessor,
        @Inject(WINDOW) private readonly windowRef: Window,
        @Inject(TUI_ANIMATION_OPTIONS)
        private readonly animationOptions: AnimationOptions,
        @Inject(TUI_DROPDOWN_OPTIONS) private readonly options: TuiDropdownOptions,
        @Optional()
        @Inject(TuiDropdownHoverDirective)
        private readonly hoverDirective: TuiDropdownHoverDirective | null,
        @Inject(TuiVisualViewportService) visualViewportService: TuiVisualViewportService,
    ) {
        position$
            .pipe(
                map(point =>
                    this.directive.position === 'fixed'
                        ? visualViewportService.correct(point)
                        : point,
                ),
                takeUntil(destroy$),
            )
            .subscribe(([top, left]) => {
                this.update(top, left);
            });

        this.updateWidth();
    }

    ngOnDestroy(): void {
        this.onHoveredChange(false);
    }

    onHoveredChange(hovered: boolean): void {
        if (this.hoverDirective) {
            this.hoverDirective.toggle(hovered);
        }
    }

    onTopFocus(): void {
        this.moveFocusOutside(true);
    }

    onBottomFocus(): void {
        this.moveFocusOutside(false);
    }

    private update(top: number, left: number): void {
        const {style} = this.elementRef.nativeElement;
        const {right} = this.elementRef.nativeElement.getBoundingClientRect();
        const {maxHeight, offset} = this.options;
        const {innerHeight} = this.windowRef;
        const {clientRect} = this.host;
        const {position} = this.directive;
        const rect = this.accessor.getClientRect();
        const offsetX = position === 'fixed' ? 0 : -clientRect.left;
        const offsetY = position === 'fixed' ? 0 : -clientRect.top;

        top += offsetY;
        left += offsetX;

        const isIntersecting =
            left < rect.right && right > rect.left && top < offsetY + 2 * offset;
        const available = isIntersecting
            ? rect.top - 2 * offset
            : offsetY + innerHeight - top - offset;

        style.position = position;
        style.top = tuiPx(Math.max(top, offsetY + offset));
        style.left = tuiPx(left);
        style.maxHeight = tuiPx(Math.min(maxHeight, available));
        style.width = '';
        style.minWidth = '';

        this.updateWidth();
    }

    private updateWidth(): void {
        const {style} = this.elementRef.nativeElement;
        const rect = this.accessor.getClientRect();
        const {limitWidth} = this.options;

        switch (limitWidth) {
            case 'min':
                style.minWidth = tuiPx(rect.width);
                break;
            case 'fixed':
                style.width = tuiPx(rect.width);
                break;
            case 'auto':
                break;
        }
    }

    private moveFocusOutside(previous: boolean): void {
        const {nativeElement} = this.directive.elementRef;
        const {ownerDocument} = nativeElement;
        const root = ownerDocument ? ownerDocument.body : nativeElement;
        let focusable = tuiGetClosestFocusable({initial: nativeElement, root, previous});

        while (focusable !== null && nativeElement.contains(focusable)) {
            focusable = tuiGetClosestFocusable({initial: focusable, root, previous});
        }

        focusable?.focus();
    }
}
