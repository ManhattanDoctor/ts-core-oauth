import * as _ from 'lodash';
import { IOAuthPopUpDto } from './OAuthBase';

export class OAuthParser {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public static NAMES: Array<string> = ['code', 'access_token'];
    public static ERRORS: Array<string> = ['error', 'error_description'];

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public static parse(params: any, fragment?: string): IOAuthPopUpDto {
        let item = new Object() as any;

        _.forIn(params, (value, key) => item[key] = value);
        if (!_.isEmpty(fragment)) {
            new URLSearchParams(fragment).forEach((value, key) => item[key] = value);
        }

        let oauthError = null;
        let oauthCodeOrToken = null;

        for (let key in item) {
            let value = item[key];
            if (OAuthParser.NAMES.includes(key)) {
                oauthCodeOrToken = value;
            }
            else if (OAuthParser.ERRORS.includes(key)) {
                oauthError = value;
            }
            if (!_.isEmpty(oauthCodeOrToken)) {
                return { oauthCodeOrToken };
            }
            else if (!_.isEmpty(oauthError)) {
                return { oauthErrorDescription: item.error_description, oauthError };
            }
        };
        return null;
    }
}