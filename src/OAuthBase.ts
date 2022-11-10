import { PromiseHandler, DateUtil, LoggerWrapper, ILogger, TransportHttp } from "@ts-core/common";
import * as _ from 'lodash';
import { URLSearchParams } from "url";

export abstract class OAuthBase<T = any> extends LoggerWrapper {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    protected http: TransportHttp;
    protected timer: any;

    protected popUp: Window;
    protected promise: PromiseHandler<IOAuthDto>;

    protected popUpWidth: number = 640;
    protected popUpHeight: number = 480;
    protected responseType: string;

    protected _urlParams: Map<string, string>;

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, protected applicationId: string, protected window?: Window) {
        super(logger);
        this.http = new TransportHttp(logger, { method: 'get' });

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
            return this.promise.promise;
        }

        this.promise = PromiseHandler.create();

        this.popUp = this.openPopup();
        this.window.addEventListener('message', this.messageHandler, false);
        this.timer = setInterval(this.checkPopUp, DateUtil.MILLISECONDS_NANOSECOND / 2);
        return this.promise.promise;
    }

    protected openPopup(): Window {
        let window = this.window;
        let top = (window.screen.height - this.popUpHeight) / 2;
        let left = (window.screen.width - this.popUpWidth) / 2;
        let item = window.open(this.getUrl(), '_blank', `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`,);
        item.focus();
        return item;
    }

    protected checkPopUp = (): void => {
        if (_.isNil(this.popUp) || this.popUp.closed) {
            this.close();
        }
    }

    protected getUrlParams(): URLSearchParams {
        let item = new URLSearchParams();
        item.append('display', 'popup');
        item.append('client_id', this.applicationId);
        item.append('redirect_uri', this.redirectUri);
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

    protected messageHandler = (event: MessageEvent<IOAuthPopUpDto>): void => {
        let data = event.data;
        if (event.origin !== this.originUrl || !_.isObject(data)) {
            return;
        }

        if (!_.isEmpty(data.oAuthCodeOrToken)) {
            this.promise.resolve({ redirectUri: this.redirectUri, codeOrToken: data.oAuthCodeOrToken });
        }
        if (!_.isEmpty(data.oAuthError)) {
            this.promise.reject(data.oAuthError);
        }
        if (!this.promise.isPending) {
            this.close();
        }
    }

    //--------------------------------------------------------------------------
    //
    // 	Private Properties
    //
    //--------------------------------------------------------------------------

    protected get redirectUri(): string {
        return `${this.originUrl}/oauth`;
    }

    protected get originUrl(): string {
        return this.window.location.origin;
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
        clearInterval(this.timer);
        this.timer = null;

        if (!_.isNil(this.popUp)) {
            this.popUp.close();
            this.popUp = null;
        }

        if (!_.isNil(this.promise)) {
            this.promise.reject();
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

