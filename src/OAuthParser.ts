import * as _ from 'lodash';
import { IOAuthPopUpDto } from './OAuthBase';

export class OAuthParser {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public static NAMES: Array<string> = ['code', 'access_token'];
    public static ERRORS: Array<string> = ['error_description', 'error'];

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public static parse(params: any, fragment: string): IOAuthPopUpDto {
        let item = new URLSearchParams();

        _.forIn(params, (value, key) => item.append(key, value));
        new URLSearchParams(fragment).forEach((value, key) => item.append(key, value));

        let oAuthError = null;
        let oAuthCodeOrToken = null;
        item.forEach((value, key) => {
            if (OAuthParser.NAMES.includes(key)) {
                oAuthCodeOrToken = value;
            }
            else if (OAuthParser.ERRORS.includes(key)) {
                oAuthError = value;
            }
            if (!_.isEmpty(oAuthCodeOrToken) || !_.isEmpty(oAuthError)) {
                return { oAuthCodeOrToken, oAuthError };
            }
        });
        return null;
    }
}