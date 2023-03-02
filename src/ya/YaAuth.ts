
import { ExtendedError, ILogger } from "@ts-core/common";
import { IOAuthDto, IOAuthToken, OAuthBase } from "../OAuthBase";
import { YaUser } from "./YaUser";
import * as _ from 'lodash';

export class YaAuth<T extends YaUser = YaUser> extends OAuthBase<T> {
    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public getPopUpUrl(): string {
        return `https://oauth.yandex.ru/authorize?${this.getUrlParams().toString()}`;
    }

    public async getProfile(token: string): Promise<T> {
        let item = new YaUser();
        item.parse(await this.http.call('https://login.yandex.ru/info', { data: { oauth_token: token } }));
        return item as T;
    }

    public async getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken> {
        let item = await this.http.call('https://oauth.yandex.ru/token', {
            data: {
                code: dto.codeOrToken,
                client_id: this.applicationId,
                client_secret: secret,
                grant_type: 'authorization_code'
            },
            method: 'post',
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (!_.isNil(item.error_description)) {
            throw new ExtendedError(item.error_description);
        }
        

        return {
            expiresIn: item.expires_in,
            accessToken: item.access_token,
            refreshToken: item.refresh_token,
            tokenType: item.token_type,
        };
    }
}