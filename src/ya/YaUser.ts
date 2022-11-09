import { OAuthUser } from "../OAuthUser";
import * as _ from 'lodash';

export class YaUser extends OAuthUser {

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected parse(item: any): void {
        this.id = item.id;
        this.name = item.display_name;
        this.email = item.default_email;
        this.phone = _.get(item, 'default_phone.number')

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