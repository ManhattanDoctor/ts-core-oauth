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

    public static parse(params: any, fragment?: string): IOAuthPopUpDto {
        let item = new Object()

        _.forIn(params, (value, key) => item[key] = value);
        if (!_.isEmpty(fragment)) {
            new URLSearchParams(fragment).forEach((value, key) => item[key] = value);
        }

        let oAuthError = null;
        let oAuthCodeOrToken = null;

        for (let key in item) {
            let value = item[key];
            if (OAuthParser.NAMES.includes(key)) {
                oAuthCodeOrToken = value;
            }
            else if (OAuthParser.ERRORS.includes(key)) {
                oAuthError = value;
            }
            if (!_.isEmpty(oAuthCodeOrToken) || !_.isEmpty(oAuthError)) {
                return { oAuthCodeOrToken, oAuthError };
            }
        };
        return null;
    }
}