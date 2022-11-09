import { PromiseHandler, DateUtil, LoggerWrapper, ILogger, TransportHttp } from "@ts-core/common";
import * as _ from 'lodash';

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

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, protected window: Window, protected applicationId: string, protected scope?: string) {
        super(logger);
        this.http = new TransportHttp(logger, { method: 'get' });
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

        this.popUp = this.openPopup(this.getAuthUrl(), '_blank');
        this.window.addEventListener('message', this.messageHandler, false);
        this.timer = setInterval(this.checkPopUp, DateUtil.MILLISECONDS_NANOSECOND / 2);
        return this.promise.promise;
    }

    protected openPopup(url: string, target: string): Window {
        let window = this.window;

        let top = (window.screen.height - this.popUpHeight) / 2;
        let left = (window.screen.width - this.popUpWidth) / 2;
        let item = window.open(url, target, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`,);
        item.focus();
        return item;
    }

    protected checkPopUp = (): void => {
        if (_.isNil(this.popUp) || this.popUp.closed) {
            this.close();
        }
    }

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

    protected abstract getAuthUrl(): string;

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

        if (!_.isNil(this.http)) {
            this.http.destroy();
            this.http = null;
        }
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

