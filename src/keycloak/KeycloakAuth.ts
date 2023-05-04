
import { ExtendedError, ILogger, RandomUtil } from "@ts-core/common";
import { IOAuthDto, IOAuthToken, OAuthBase } from "../OAuthBase";
import { KeycloakUser } from "./KeycloakUser";
import * as _ from 'lodash';

export class KeycloakAuth<T extends KeycloakUser = KeycloakUser> extends OAuthBase<T> {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    protected _settings: IKeycloakAuthSettings;

    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, settings: IKeycloakAuthSettings, window?: Window) {
        super(logger, settings.applicationId, window);
        this._settings = settings;

        this.urlParams.set('scope', 'openid');
        this.urlParams.set('state', RandomUtil.randomString(10));
        this.urlParams.set('response_mode', 'query');
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected getBaseUrl(): string {
        return `${this.settings.url}/realms/${this.settings.realm}/protocol/openid-connect`;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public getPopUpUrl(): string {
        return `${this.getBaseUrl()}/auth?${this.getUrlParams().toString()}`;
    }

    public async getProfile(token: string): Promise<T> {
        let item = new KeycloakUser();
        item.parse(await this.http.call(`${this.getBaseUrl()}/userinfo`, { headers: { Authorization: `Bearer ${token}` } }));
        return item as T;
    }

    public async getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken> {
        let item = await this.http.call(`${this.getBaseUrl()}/token`, {
            data: new URLSearchParams({
                code: dto.codeOrToken,
                client_id: this.applicationId,
                client_secret: secret,
                redirect_uri: dto.redirectUri,
                grant_type: 'authorization_code'
            }),
            method: 'post',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        if (!_.isNil(item.error_description)) {
            throw new ExtendedError(item.error_description);
        }

        return {
            scope: item.scope,
            state: item.session_state,
            tokenType: item.token_type,
            expiresIn: item.expires_in,
            accessToken: item.access_token,
            refreshToken: item.refresh_token,
            refreshExpiresIn: item.refresh_expires_in,
        };
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();
        this._settings = null;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Properties
    //
    //--------------------------------------------------------------------------

    public get settings(): IKeycloakAuthSettings {
        return this._settings;
    }
}

export interface IKeycloakAuthSettings {
    url: string;
    realm: string;
    applicationId: string;
}