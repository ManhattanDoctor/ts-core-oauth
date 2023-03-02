
import * as _ from 'lodash';
import { GoUser } from './GoUser';
import { IOAuthDto, IOAuthToken, OAuthBase } from '../OAuthBase';
import { ILogger } from '@ts-core/common';

export class GoAuth<T extends GoUser = GoUser> extends OAuthBase<T> {
    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, applicationId: string, window?: Window) {
        super(logger, applicationId, window);
        this.urlParams.set('scope', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email');
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public getPopUpUrl(): string {
        return `https://accounts.google.com/o/oauth2/v2/auth?${this.getUrlParams().toString()}`;
    }

    public async getProfile(token: string): Promise<T> {
        let item = new GoUser();
        item.parse(await this.http.call('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { 'Authorization': `Bearer ${token}` } }));
        return item as T;
    }

    public async getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken> {
        let item = await this.http.call('https://oauth2.googleapis.com/token', {
            data: {
                code: dto.codeOrToken,
                client_id: this.applicationId,
                client_secret: secret,
                redirect_uri: dto.redirectUri,
                grant_type: 'authorization_code'
            },
            method: 'post'
        });
        return {
            expiresIn: item.expires_in,
            accessToken: item.access_token,
            tokenType: item.token_type,
            idToken: item.id_token,
            scope: item.scope
        };
    }
}