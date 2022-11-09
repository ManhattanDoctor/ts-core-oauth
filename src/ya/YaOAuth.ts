
import { ILogger } from "@ts-core/common";
import { IOAuthDto, IOAuthToken, OAuthBase } from "../OAuthBase";
import { YaUser } from "./YaUser";
import * as _ from 'lodash';
import axios from 'axios';

export class YaOAuth<T extends YaUser = YaUser> extends OAuthBase<T> {
    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, window: Window, applicationId: string, scope?: string) {
        super(logger, window, applicationId, scope);
        this.popUpWidth = 480;
        this.popUpHeight = 520;
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected getAuthUrl(): string {
        let params = new URLSearchParams();
        params.append('display', 'popup');
        params.append('client_id', this.applicationId);
        params.append('redirect_uri', this.redirectUri);
        params.append('response_type', this.responseType);
        if (!_.isEmpty(this.scope)) {
            params.append('scope', this.scope);
        }
        return `https://oauth.yandex.ru/authorize?${params.toString()}`;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public async getProfile(token: string): Promise<T> {
        let item = await this.http.call('https://login.yandex.ru/info', { data: { oauth_token: token } });
        return new YaUser(item) as T;
    }

    public async getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken> {
        let { data } = await axios.postForm('https://oauth.yandex.ru/token', {
            code: dto.codeOrToken,
            client_id: this.applicationId,
            client_secret: secret,
            grant_type: 'authorization_code'
        })
        return {
            tokenType: data.token_type,
            expiresIn: data.expires_in,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        };
    }
}