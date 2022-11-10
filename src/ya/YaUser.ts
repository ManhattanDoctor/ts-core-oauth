import { OAuthUser } from "../OAuthUser";
import * as _ from 'lodash';

export class YaUser extends OAuthUser {

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public login: string;
    public psuid: string;
    public emails: Array<string>;
    public clientId: string;
    public realName: string;
    public displayName: string;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public parse(item: any): void {
        this.id = item.id;
        this.name = item.display_name;
        this.login = item.login;
        this.psuid = item.psuid;
        this.email = item.default_email;
        this.phone = _.get(item, 'default_phone.number')

        this.emails = item.emails;
        this.clientId = item.client_id;
        this.realName = item.real_name;
        this.displayName = item.display_name;

        if (!_.isNil(item.sex)) {
            this.isMale = item.sex === 'male';
        }

        if (!item.is_avatar_empty) {
            this.picture = `https://avatars.yandex.net/get-yapic/${item.default_avatar_id}/islands-200`;
        }

        if (!_.isNil(item.birthday)) {
            let array = String(item.birthday).split('-');
            if (array.length === 3) {
                this.birthday = new Date(Number(array[0]), Number(array[1]) - 1, Number(array[2]));
            }
        }
    }

}