import { ILogger, TransportHttp, RandomUtil, ExtendedError } from "@ts-core/common";
import * as _ from 'lodash';
import { Subject } from "rxjs";
import { PopUpBase } from "./PopUpBase";
import { OAuthBrowserPropertiesSet } from "./public-api";

export abstract class OAuthBase<T = any> extends PopUpBase<IOAuthDto> {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public redirectUri: string;

    protected http: TransportHttp;
    protected responseType: string;

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, protected applicationId: string, window?: Window) {
        super(logger, window);

        this.http = new TransportHttp(logger, { method: 'get' });
        this.subject = new Subject();
        this.params.set('state', RandomUtil.randomString());
        this.params.set('display', 'popup');

        OAuthBrowserPropertiesSet(this);
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected getRedirectUri(): string {
        return !_.isNil(this.redirectUri) ? this.redirectUri : `${this.originUrl}/oauth`;
    }

    protected getParams(): URLSearchParams {
        let item = super.getParams();
        item.append('client_id', this.applicationId);
        item.append('redirect_uri', this.getRedirectUri());
        item.append('response_type', this.responseType);
        return item;
    }

    protected parseMessageData(item: any): IOAuthDto {
        return {
            codeOrToken: item.oAuthCodeOrToken,
            redirectUri: this.getRedirectUri()
        }
    }

    protected isMessageError(item: any): boolean {
        return !_.isNil(item.oAuthError);
    }

    protected parseMessageError(item: any): ExtendedError {
        return new ExtendedError(item.oAuthError, item.oAuthErrorDescription);
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

    public parse(item: any): void {
        super.popUpMessageParse(item);
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();

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

    public get state(): string {
        return !_.isNil(this.params) ? this.params.get('state') : null;
    }
}

export interface IOAuthDto {
    codeOrToken: string;
    redirectUri: string;
}

export interface IOAuthPopUpDto {
    oAuthError?: string;
    oAuthCodeOrToken?: string;
    oAuthErrorDescription?: string;
}

export interface IOAuthToken {
    expiresIn: number;
    accessToken: string;

    state?: string;
    scope?: string;
    userId?: number;

    idToken?: string;
    tokenType?: string;

    refreshToken?: string;
    refreshExpiresIn?: string;
}