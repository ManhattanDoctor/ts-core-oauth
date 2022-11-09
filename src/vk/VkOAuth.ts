import * as _ from 'lodash';
import { IOAuthDto, IOAuthToken, OAuthBase } from "../OAuthBase";
import { VkUser } from "./VkUser";

export class VkOAuth<T extends VkUser = VkUser> extends OAuthBase<T> {
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
        return `https://oauth.vk.com/authorize?${params.toString()}`;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public async getProfile(token: string, fields: string): Promise<T> {
        let { response } = await this.http.call('https://api.vk.com/method/users.get', { data: { access_token: token, v: '5.131', fields } });
        return new VkUser(response[0]) as T;
    }

    public async getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken> {
        let item = await this.http.call('https://oauth.vk.com/access_token', {
            data: {
                code: dto.codeOrToken,
                client_id: this.applicationId,
                redirect_uri: dto.redirectUri,
                client_secret: secret,
            }
        });
        return { userId: item.user_id, expiresIn: item.expires_in, accessToken: item.access_token };
    }
}
