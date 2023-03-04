import { ExtendedError, ILogger, RandomUtil } from "@ts-core/common";
import { IOAuthDto, IOAuthToken, OAuthBase } from "../OAuthBase";
import { MaUser } from "./MaUser";
import * as _ from 'lodash';

export class MaAuth<T extends MaUser = MaUser> extends OAuthBase<T> {

    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, applicationId: string, window?: Window) {
        super(logger, applicationId, window);
        this.urlParams.set('scope', 'userinfo');
        this.urlParams.set('state', RandomUtil.randomString(43));
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public getPopUpUrl(): string {
        return `https://oauth.mail.ru/login?${this.getUrlParams().toString()}`;
    }

    public async getProfile(token: string): Promise<T> {
        let item = new MaUser();
        item.parse(await this.http.call('https://oauth.mail.ru/userinfo', { data: { access_token: token } }));
        return item as T;
    }

    public async getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken> {
        let item = await this.http.call('https://oauth.mail.ru/token', {
            data: {
                code: dto.codeOrToken,
                client_id: this.applicationId,
                client_secret: secret,
                redirect_uri: dto.redirectUri,
                grant_type: 'authorization_code'
            },
            method: 'post',
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (!_.isNil(item.error_description)) {
            throw new ExtendedError(item.error_description);
        }

        return {
            tokenType: item.token_type,
            expiresIn: item.expires_in,
            accessToken: item.access_token,
            refreshToken: item.refresh_token,
        };
    }
}
