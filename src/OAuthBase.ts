import { PromiseHandler, DateUtil, LoggerWrapper, ILogger, TransportHttp } from "@ts-core/common";
import * as _ from 'lodash';

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
    public popUpIsCheckClose: boolean;
    public popUpMessageParser: IOAuthPopUpMessageParser;

    public redirectUri: string;

    protected http: TransportHttp;

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

        this.popUpWidth = 430;
        this.popUpHeight = 520;
        this.popUpTarget = '_blank';
        this.popUpIsCheckClose = true;
        this.popUpMessageParser = this.browserMessageHandler;

        this._urlParams = new Map();
        this.urlParams.set('display', 'popup');
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected async open(): Promise<IOAuthDto> {
        if (!_.isNil(this.promise)) {
            if (!_.isNil(this.popUp) && !this.popUp.closed) {
                this.popUp.focus();
            }
            return this.promise.promise;
        }

        this.promise = PromiseHandler.create();
        this.popUp = this.popupOpen();
        this.popUpFocus();

        if (this.popUpIsCheckClose) {
            this.popUpCheckCloseTimer = setInterval(this.popUpCheckClose, DateUtil.MILLISECONDS_SECOND / 10);
        }

        this.window.addEventListener('message', this.messageHandler, false);
        return this.promise.promise;
    }

    protected popupOpen(): Window {
        let window = this.window;
        let top = (window.screen.height - this.popUpHeight) / 2;
        let left = (window.screen.width - this.popUpWidth) / 2;
        let item = window.open(this.getUrl(), this.popUpTarget, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`,);
        return item;
    }

    protected popUpFocus(): void {
        if (!_.isNil(this.popUp) && !this.popUp.closed) {
            this.popUp.focus();
        }
    }

    protected popUpCheckClose = (): void => {
        if (_.isNil(this.popUp) || this.popUp.closed) {
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

    protected messageHandler = (event: MessageEvent): void => {
        let data = this.popUpMessageParser(event);
        if (_.isNil(data)) {
            return;
        }
        if (!_.isEmpty(data.oAuthCodeOrToken)) {
            this.promise.resolve({ redirectUri: this.getRedirectUri(), codeOrToken: data.oAuthCodeOrToken });
        }
        if (!_.isEmpty(data.oAuthError)) {
            this.promise.reject(data.oAuthError);
        }
        if (!this.promise.isPending) {
            this.close();
        }
    }

    protected browserMessageHandler(event: MessageEvent<IOAuthPopUpDto>): IOAuthPopUpDto {
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
        
        if (!_.isNil(this.popUp)) {
            this.popUp.close();
            this.popUp = null;
        }

        if (!_.isNil(this.promise)) {
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

        if (!_.isNil(this.urlParams)) {
            this.urlParams.clear();
            this._urlParams = null;
        }

        if (!_.isNil(this.http)) {
            this.http.destroy();
            this.http = null;
        }
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Properties
    //
    //--------------------------------------------------------------------------

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

export type IOAuthPopUpMessageParser = (event: MessageEvent) => IOAuthPopUpDto;

