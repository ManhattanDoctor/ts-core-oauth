import { ExtendedError, ILogger } from '@ts-core/common';
import * as _ from 'lodash';
import { IOAuthDto, IOAuthToken, OAuthBase } from "../OAuthBase";
import { VkUser } from "./VkUser";

export class VkAuth<T extends VkUser = VkUser> extends OAuthBase<T> {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public v: string = '5.131';
    private email: string;

    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, applicationId: string, window?: Window) {
        super(logger, applicationId, window);
        this.urlParams.set('scope', 'status,email');
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected getUrl(): string {
        return `https://oauth.vk.com/authorize?${this.getUrlParams().toString()}`;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public async getProfile(token: string, fields?: string): Promise<T> {
        if (_.isNil(fields)) {
            fields = 'photo_200,bdate,sex,city,country,status,about';
        }
        let { response } = await this.http.call('https://api.vk.com/method/users.get', { data: { access_token: token, v: this.v, fields } });
        let item = new VkUser();
        item.parse(response[0]);
        if (_.isNil(item.email)) {
            item.email = this.email;
        }
        return item as T;
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

        if (!_.isNil(item.error_description)) {
            throw new ExtendedError(item.error_description);
        }

        if (!_.isNil(item.email)) {
            this.email = item.email;
        }
        return {
            userId: item.user_id,
            expiresIn: item.expires_in,
            accessToken: item.access_token,
        };
    }
}
