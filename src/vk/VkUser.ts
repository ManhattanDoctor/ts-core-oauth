import { OAuthUser } from "../OAuthUser";
import * as _ from 'lodash';

export class VkUser extends OAuthUser {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public params: string;

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected parse(item: any): void {
        this.id = item.id;
        this.vk = `https://vk.com/id${item.id}`;
        this.name = `${item.first_name} ${item.last_name}`;
        this.picture = item.photo_200;

        this.city = _.get(item, 'city.title');
        this.country = _.get(item, 'country.title');

        if (!_.isNil(item.sex) && item.sex !== 0) {
            this.isMale = item.sex === 2;
        }

        if (!_.isNil(item.about)) {
            this.description = item.about;
        }
        else if (!_.isNil(item.status)) {
            this.description = item.status;
        }

        if (!_.isNil(item.bdate)) {
            let array = String(item.bdate).split('.');
            if (array.length === 3) {
                this.birthday = new Date(Number(array[2]), Number(array[1]) - 1, Number(array[0]));
            }
            else if (array.length === 2) {
                this.birthday = new Date(1900, Number(array[1]) - 1, Number(array[0]));
            }
        }
    }
}