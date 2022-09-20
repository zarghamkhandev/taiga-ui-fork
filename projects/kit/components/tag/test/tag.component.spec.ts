import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TuiTagComponent, TuiTagModule} from '@taiga-ui/kit';
import {configureTestSuite, TuiPageObject, TuiTagHarness} from '@taiga-ui/testing';

describe(`Tag`, () => {
    @Component({
        template: `
            <tui-tag
                *ngIf="default"
                automation-id="tui-tag__item"
                [value]="tag"
            ></tui-tag>
            <tui-tag
                *ngIf="!default"
                automation-id="tui-tag__item"
                [value]="tag"
                [removable]="removable"
                [editable]="editable"
                [autoColor]="autoColor"
                (edited)="editedSpy($event)"
            ></tui-tag>
        `,
    })
    class TestComponent {
        @ViewChild(TuiTagComponent, {static: true})
        component!: TuiTagComponent;

        default = false;
        tag = `Tag`;
        removable = true;
        editable = true;
        autoColor = false;
        editedSpy = jest.fn();
    }

    let fixture: ComponentFixture<TestComponent>;
    let testComponent: TestComponent;
    let loader: HarnessLoader;
    let pageObject: TuiPageObject<TestComponent>;
    const keydownEnter = new KeyboardEvent(`keydown`, {
        key: `enter`,
    });
    const testContext = {
        get prefix() {
            return `tui-tag__`;
        },
    };

    function getTag(): HTMLElement {
        return pageObject.getByAutomationId(`${testContext.prefix}item`)!.nativeElement;
    }

    function getTagDiv(): Element {
        return getTag().firstElementChild!;
    }

    function getInput(): HTMLInputElement {
        return pageObject.getByAutomationId(`${testContext.prefix}edit`)!.nativeElement;
    }

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [TuiTagModule],
            declarations: [TestComponent],
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestComponent);
        loader = TestbedHarnessEnvironment.loader(fixture);
        pageObject = new TuiPageObject(fixture);
        testComponent = fixture.componentInstance;
        testComponent.editedSpy.mockClear();
        fixture.detectChanges();
    });

    describe(`Default values:`, () => {
        beforeEach(() => {
            testComponent.default = true;
            fixture.detectChanges();
        });

        it(`Cross not shown`, async () => {
            const tag = await loader.getHarness(TuiTagHarness);
            const hasCrossIcon = await tag.hasCrossIcon();

            expect(hasCrossIcon).toBeFalse();
        });

        it(`Tag is not editable`, () => {
            getTag().dispatchEvent(keydownEnter);
            fixture.detectChanges();

            expect(pageObject.getByAutomationId(`${testContext.prefix}edit`)).toBeNull();
        });
    });

    describe(`Editing a tag, editable === true`, () => {
        beforeEach(() => {
            getTag().dispatchEvent(keydownEnter);
            fixture.detectChanges();
        });

        it(`Tag is being edited`, () => {
            expect(
                pageObject.getByAutomationId(`${testContext.prefix}edit`),
            ).not.toBeNull();
        });

        it(`Emit an edit event on enter`, () => {
            getInput().value = `Hapica`;
            getInput().dispatchEvent(new Event(`input`));
            fixture.detectChanges();
            getInput().dispatchEvent(keydownEnter);
            fixture.detectChanges();

            expect(testComponent.editedSpy).toHaveBeenCalledWith(`Hapica`);
        });

        it(`Emitting edit event on field exit`, () => {
            getInput().value = `Hapica`;
            getInput().dispatchEvent(new Event(`input`));
            fixture.detectChanges();

            getInput().blur();
            fixture.detectChanges();

            expect(testComponent.editedSpy).toHaveBeenCalledWith(`Hapica`);
        });

        it(`Emitting edit event on comma input`, () => {
            getInput().value = `Hapica, ogo`;
            getInput().dispatchEvent(new Event(`input`));
            fixture.detectChanges();

            expect(testComponent.editedSpy).toHaveBeenCalledWith(`Hapica, ogo`);
        });

        it(`Issuer empty string when storing empty tag`, () => {
            getInput().value = ``;
            getInput().dispatchEvent(new Event(`input`));
            fixture.detectChanges();

            getInput().blur();
            fixture.detectChanges();

            expect(testComponent.editedSpy).toHaveBeenCalledWith(``);
        });
    });

    describe(`Deleting a tag`, () => {
        it(`Cross shown with removable === true`, () => {
            expect(
                pageObject.getByAutomationId(`${testContext.prefix}remove`),
            ).not.toBeNull();
        });

        it(`Emit an empty line across a cross`, () => {
            pageObject
                .getByAutomationId(`${testContext.prefix}remove`)!
                .nativeElement.click();

            expect(testComponent.editedSpy).toHaveBeenCalledWith(``);
        });

        it(`When you press the backspace on the tag, an empty line is emitted`, () => {
            getTag().dispatchEvent(
                new KeyboardEvent(`keydown`, {
                    key: `backspace`,
                }),
            );

            expect(testComponent.editedSpy).toHaveBeenCalledWith(``);
        });

        it(`When you press delete on the tag, an empty string is emitted`, () => {
            getTag().dispatchEvent(
                new KeyboardEvent(`keydown`, {
                    key: `delete`,
                }),
            );

            expect(testComponent.editedSpy).toHaveBeenCalledWith(``);
        });
    });

    // TODO: remake stringHashToHsl to stringHashToRgb and include test
    xdescribe(`Tag color`, () => {
        it(`when autoColor is enabled, the color will be rgb(241, 188, 229)`, () => {
            testComponent.autoColor = true;
            fixture.detectChanges();
            expect(getComputedStyle(getTagDiv()).backgroundColor).toBe(
                `rgb(241, 188, 229)`,
            );
        });
    });
});
