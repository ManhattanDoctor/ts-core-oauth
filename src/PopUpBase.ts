import { PromiseHandler, DateUtil, ObservableData, LoggerWrapper, ILogger, ExtendedError } from "@ts-core/common";
import { filter, map, Observable, Subject } from "rxjs";
import * as _ from 'lodash';

export abstract class PopUpBase<U> extends LoggerWrapper {
    //--------------------------------------------------------------------------
    //
    // 	Constants
    //
    //--------------------------------------------------------------------------

    public static ERROR_WINDOW_CLOSED = 'WINDOW_CLOSED';

    //--------------------------------------------------------------------------
    //
    // 	Public Static Methods
    //
    //--------------------------------------------------------------------------

    public static isWindowClosedError(error: any): boolean {
        return !_.isNil(error) && error.code === PopUpBase.ERROR_WINDOW_CLOSED;
    }

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public popUpWidth: number;
    public popUpHeight: number;
    public popUpTarget: string;
    public popUpOpener: IPopUpOpener;
    public popUpMessageEventParser: IPopUpMessageEventParser;

    protected popUp: Window;
    protected window: Window;
    protected subject: Subject<ObservableData<PopUpEvent, Window>>;
    protected promise: PromiseHandler<U, ExtendedError>;

    protected _params: Map<string, string>;
    protected _popUpCheckCloseTimer: any;

    public isRejectWhenPopUpClosed: boolean;

    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, window?: Window) {
        super(logger);
        this.window = window;
        this.subject = new Subject();

        this._params = new Map();

        this.popUpWidth = 430;
        this.popUpHeight = 520;
        this.popUpTarget = '_blank';

        this.popUpOpener = popUpOpener;
        this.isRejectWhenPopUpClosed = true;
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected popUpFocus(): void {
        if (this.isPopUpOpened && _.isFunction(this.popUp.focus)) {
            this.popUp.focus();
        }
    }

    protected popUpCheckClose = (): void => {
        if (!this.isPopUpOpened) {
            this.close();
        }
    }

    protected getParams(): URLSearchParams {
        let item = new URLSearchParams();
        this.params.forEach((value, key) => item.append(key, value));
        return item;
    }

    //--------------------------------------------------------------------------
    //
    // 	Event Handlers
    //
    //--------------------------------------------------------------------------

    protected popUpMessageHandler(event: MessageEvent): void {
        if (event.origin === this.originUrl && !_.isNil(event.data)) {
            this.popUpMessageParse(this.popUpMessageEventParser(event));
        }
    }

    protected popUpMessageParse(item: any): void {
        if (_.isNil(item)) {
            return;
        }
        if (this.isMessageError(item)) {
            this.promise.reject(this.parseMessageError(item));
        }
        else {
            this.promise.resolve(this.parseMessageData(item));
        }
        this.close();
    }

    protected popUpMessageHandlerProxy = (event: MessageEvent): void => this.popUpMessageHandler(event);

    //--------------------------------------------------------------------------
    //
    // 	Private Properties
    //
    //--------------------------------------------------------------------------

    protected abstract isMessageError(item: any): boolean;

    protected abstract parseMessageData(item: any): U;

    protected abstract parseMessageError(item: any): ExtendedError;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public async open(...params): Promise<U> {
        if (!_.isNil(this.promise)) {
            this.popUpFocus();
            return this.promise.promise;
        }

        this.promise = PromiseHandler.create();
        this.popUp = this.popUpOpener(this, this.window);
        this.popUpFocus();

        this.window.addEventListener('message', this.popUpMessageHandlerProxy, false);
        this.subject.next(new ObservableData(PopUpEvent.OPENED, this.popUp));
        this.popUpCheckCloseTimer = setInterval(this.popUpCheckClose, DateUtil.MILLISECONDS_SECOND / 5);

        return this.promise.promise;
    }

    public close(): void {
        this.window.removeEventListener('message', this.popUpMessageHandlerProxy, false);
        this.popUpCheckCloseTimer = null;

        if (_.isNil(this.popUp)) {
            return;
        }

        this.subject.next(new ObservableData(PopUpEvent.CLOSED, this.popUp));
        this.popUp.close();
        this.popUp = null;

        if (this.isRejectWhenPopUpClosed && !_.isNil(this.promise)) {
            this.promise.reject(new ExtendedError(PopUpBase.ERROR_WINDOW_CLOSED, PopUpBase.ERROR_WINDOW_CLOSED as any));
            this.promise = null;
        }
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();
        this.close();

        if (!_.isNil(this.promise)) {
            this.promise.reject(new ExtendedError(PopUpBase.ERROR_WINDOW_CLOSED, PopUpBase.ERROR_WINDOW_CLOSED as any));
            this.promise = null;
        }
        if (!_.isNil(this.params)) {
            this.params.clear();
            this._params = null;
        }
        if (!_.isNil(this.subject)) {
            this.subject.complete();
            this.subject = null;
        }
    }

    public abstract popUpUrl(): string;

    //--------------------------------------------------------------------------
    //
    // 	Protected Properties
    //
    //--------------------------------------------------------------------------

    protected get isPopUpOpened(): boolean {
        return !_.isNil(this.popUp) && !this.popUp.closed;
    }

    protected get popUpCheckCloseTimer(): any {
        return this._popUpCheckCloseTimer;
    }
    protected set popUpCheckCloseTimer(value: any) {
        if (value === this._popUpCheckCloseTimer) {
            return;
        }
        clearInterval(this._popUpCheckCloseTimer);
        this._popUpCheckCloseTimer = value;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Properties
    //
    //--------------------------------------------------------------------------

    public get originUrl(): string {
        return this.window.location.origin;
    }

    public get params(): Map<string, string> {
        return this._params;
    }

    public get events(): Observable<ObservableData<PopUpEvent, Window>> {
        return !_.isNil(this.subject) ? this.subject.asObservable() : null;
    }

    public get closed(): Observable<Window> {
        return this.events.pipe(filter(item => item.type === PopUpEvent.CLOSED), map(item => item.data));
    }

    public get opened(): Observable<Window> {
        return this.events.pipe(filter(item => item.type === PopUpEvent.OPENED), map(item => item.data));
    }
}

export function popUpOpener<T extends PopUpBase<U>, U>(popUp: T, window: Window): Window {
    let top = (window.screen.height - popUp.popUpHeight) / 2;
    let left = (window.screen.width - popUp.popUpWidth) / 2;
    return window.open(popUp.popUpUrl(), popUp.popUpTarget, `scrollbars=yes,width=${popUp.popUpWidth},height=${popUp.popUpHeight},top=${top},left=${left}`);
}

export type IPopUpOpener = <T extends PopUpBase<U>, U>(popUp: T, window: Window) => Window;

export type IPopUpMessageEventParser = (event: MessageEvent) => any;

export enum PopUpEvent {
    OPENED = "OPENED",
    CLOSED = "CLOSED",
}