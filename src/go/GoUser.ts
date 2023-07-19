import { OAuthUser } from "../OAuthUser";
import * as _ from 'lodash';

export class GoUser extends OAuthUser {

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public givenName: string;
    public familyName: string;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public parse(item: any): void {
        this.id = item.sub;
        this.name = item.name;
        this.email = item.email;
        this.locale = item.locale;
        this.picture = item.picture;

        this.givenName = item.given_name;
        this.familyName = item.family_name;
    }

    public parsePerson(item: any): void {
        if (!_.isEmpty(item.genders)) {
            this.isMale = _.first<any>(item.genders).value === 'male';
        }
        if (!_.isEmpty(item.birthdays)) {
            for (let value of item.birthdays) {
                if (!_.isNil(value.date) && !_.isNil(value.date.year) && !_.isNil(value.date.month) && !_.isNil(value.date.day)) {
                    this.birthday = new Date(value.date.year, value.date.month - 1, value.date.day);
                    break;
                }
            }
        }
    }
}