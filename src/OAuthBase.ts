import { PromiseHandler, DateUtil, ObservableData, LoggerWrapper, ILogger, TransportHttp, RandomUtil } from "@ts-core/common";
import * as _ from 'lodash';
import { filter, takeUntil, map, Observable, Subject } from "rxjs";
import { OAuthParser } from "./OAuthParser";

export abstract class OAuthBase<T = any> extends LoggerWrapper {
    //--------------------------------------------------------------------------
    //
    // 	Constants
    //
    //--------------------------------------------------------------------------

    public static ERROR_WINDOW_CLOSED = 'WINDOW_CLOSED';

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public popUpWidth: number;
    public popUpHeight: number;
    public popUpTarget: string;
    public popUpMessageParser: IOAuthPopUpParser;

    public redirectUri: string;
    public isRejectWhenPopUpClosed: boolean;

    protected http: TransportHttp;
    protected subject: Subject<ObservableData<OAuthEvent, Window>>;

    protected popUp: Window;
    protected promise: PromiseHandler<IOAuthDto>;
    protected responseType: string;

    protected _urlParams: Map<string, string>;
    protected _popUpCheckCloseTimer: any;

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, protected applicationId: string, protected window?: Window) {
        super(logger);
        this.http = new TransportHttp(logger, { method: 'get' });
        this.subject = new Subject();

        this.popUpWidth = 430;
        this.popUpHeight = 520;
        this.popUpTarget = '_blank';
        this.popUpMessageParser = this.browserInternalMessageHandler;

        this.isRejectWhenPopUpClosed = true;

        this._urlParams = new Map();
        this.urlParams.set('state', RandomUtil.randomString());
        this.urlParams.set('display', 'popup');
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected async open(): Promise<IOAuthDto> {
        if (!_.isNil(this.promise)) {
            this.popUpFocus();
            return this.promise.promise;
        }

        this.promise = PromiseHandler.create();
        this.popUp = this.popUpOpen();
        this.popUpFocus();

        this.window.addEventListener('message', this.messageHandler, false);
        this.subject.next(new ObservableData(OAuthEvent.POPUP_OPENED, this.popUp));
        this.popUpCheckCloseTimer = setInterval(this.popUpCheckClose, DateUtil.MILLISECONDS_SECOND / 5);

        return this.promise.promise;
    }

    protected popUpOpen(): Window {
        let window = this.window;

        let top = (window.screen.height - this.popUpHeight) / 2;
        let left = (window.screen.width - this.popUpWidth) / 2;
        let item = window.open(this.getUrl(), this.popUpTarget, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`,);
        return item;
    }

    protected popUpFocus(): void {
        if (this.isPopUpOpened) {
            this.popUp.focus();
        }
    }

    protected popUpCheckClose = (): void => {
        if (!this.isPopUpOpened) {
            this.close();
        }
    }

    protected getUrlParams(): URLSearchParams {
        let item = new URLSearchParams();
        item.append('client_id', this.applicationId);
        item.append('redirect_uri', this.getRedirectUri());
        item.append('response_type', this.responseType);
        this.urlParams.forEach((value, key) => item.append(key, value));
        return item;
    }

    protected abstract getUrl(): string;

    //--------------------------------------------------------------------------
    //
    // 	Event Handlers
    //
    //--------------------------------------------------------------------------

    protected messageHandler = (event: MessageEvent): void => this.parsePopUpResult(this.popUpMessageParser(event));

    protected browserInternalMessageHandler: IOAuthPopUpParser = (event: MessageEvent<IOAuthPopUpDto>): IOAuthPopUpDto => {
        return event.origin === this.getOriginUrl() && _.isObject(event.data) ? event.data : null;
    }

    //--------------------------------------------------------------------------
    //
    // 	Private Properties
    //
    //--------------------------------------------------------------------------

    protected getOriginUrl(): string {
        return this.window.location.origin;
    }

    protected getRedirectUri(): string {
        return !_.isNil(this.redirectUri) ? this.redirectUri : `${this.getOriginUrl()}/oauth`;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public abstract getProfile(token: string, ...params): Promise<T>;

    public abstract getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken>;

    public parsePopUpResult(data: IOAuthPopUpDto): void {
        if (_.isNil(data)) {
            return;
        }
        if (!_.isEmpty(data.oAuthCodeOrToken)) {
            this.promise.resolve({ redirectUri: this.getRedirectUri(), codeOrToken: data.oAuthCodeOrToken });
            this.promise = null;
        }
        if (!_.isEmpty(data.oAuthError)) {
            this.promise.reject(data.oAuthError);
            this.promise = null;
        }
        this.close();
    }

    public async getCode(): Promise<IOAuthDto> {
        this.responseType = 'code';
        return this.open();
    }

    public async getToken(): Promise<IOAuthDto> {
        this.responseType = 'token';
        return this.open();
    }

    public close(): void {
        this.window.removeEventListener('message', this.messageHandler, false);
        this.popUpCheckCloseTimer = null;
        if (_.isNil(this.popUp)) {
            return;
        }

        this.subject.next(new ObservableData(OAuthEvent.POPUP_CLOSED, this.popUp));
        this.popUp.close();
        this.popUp = null;

        if (this.isRejectWhenPopUpClosed && !_.isNil(this.promise)) {
            this.promise.reject(OAuthBase.ERROR_WINDOW_CLOSED);
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
            this.promise.reject(OAuthBase.ERROR_WINDOW_CLOSED);
            this.promise = null;
        }
        if (!_.isNil(this.urlParams)) {
            this.urlParams.clear();
            this._urlParams = null;
        }
        if (!_.isNil(this.http)) {
            this.http.destroy();
            this.http = null;
        }
        if (!_.isNil(this.subject)) {
            this.subject.complete();
            this.subject = null;
        }
    }

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

    public get urlParams(): Map<string, string> {
        return this._urlParams;
    }

    public get state(): string {
        return !_.isNil(this.urlParams) ? this.urlParams.get('state') : null;
    }

    public get events(): Observable<ObservableData<OAuthEvent, Window>> {
        return !_.isNil(this.subject) ? this.subject.asObservable() : null;
    }

    public get popUpClosed(): Observable<Window> {
        return this.events.pipe(filter(item => item.type === OAuthEvent.POPUP_CLOSED), map(item => item.data));
    }

    public get popUpOpened(): Observable<Window> {
        return this.events.pipe(filter(item => item.type === OAuthEvent.POPUP_OPENED), map(item => item.data));
    }
}

export interface IOAuthDto {
    codeOrToken: string;
    redirectUri: string;
}

export interface IOAuthPopUpDto {
    oAuthCodeOrToken: string;
    oAuthError: string;
}

export interface IOAuthToken {
    state?: string;
    scope?: string;
    userId?: number;
    tokenType?: string;

    idToken?: string;
    refreshToken?: string;

    expiresIn: number;
    accessToken: string;
}

export enum OAuthEvent {
    POPUP_OPENED = "POPUP_OPENED",
    POPUP_CLOSED = "POPUP_CLOSED",
}

export type IOAuthPopUpParser = (...params) => IOAuthPopUpDto;