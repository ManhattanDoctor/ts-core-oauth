import { OAuthUser } from "../OAuthUser";
import * as _ from 'lodash';

export class MaUser extends OAuthUser {

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public clientId: string;
    public lastName: string;
    public nickname: string;
    public firstName: string;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public parse(item: any): void {
        this.id = item.id;
        this.name = item.name;
        this.email = item.email;
        this.locale = item.locale;
        this.picture = item.image;

        this.clientId = item.clientId;
        this.nickname = item.nickname;
        this.lastName = item.last_name;
        this.firstName = item.first_name;

        if (!_.isNil(item.gender)) {
            this.isMale = item.gender === 'm';
        }

        if (!_.isNil(item.birthday)) {
            let array = String(item.birthday).split('.');
            if (array.length === 3) {
                this.birthday = new Date(Number(array[2]), Number(array[1]) - 1, Number(array[0]));
            }
        }
    }
}
