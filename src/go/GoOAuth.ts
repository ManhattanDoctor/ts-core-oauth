
import * as _ from 'lodash';
import { GoUser } from './GoUser';
import { IOAuthDto, IOAuthToken, OAuthBase } from '../OAuthBase';

export class GoOAuth<T extends GoUser = GoUser> extends OAuthBase<T> {
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
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public async getProfile(token: string): Promise<T> {
        let item = await this.http.call('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { 'Authorization': `Bearer ${token}` } });
        return new GoUser(item) as T;
    }

    public async getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken> {
        let item = await this.http.call('https://oauth2.googleapis.com/token', {
            method: 'post',
            data: {
                code: dto.codeOrToken,
                client_id: this.applicationId,
                client_secret: secret,
                redirect_uri: dto.redirectUri,
                grant_type: 'authorization_code'
            }
        });
        return { userId: item.user_id, expiresIn: item.expires_in, accessToken: item.access_token };
    }
}