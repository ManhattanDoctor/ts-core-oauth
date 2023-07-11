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
        let item = mergeUrlParamsAndFragment(params, fragment);

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
            if (!_.isEmpty(oAuthCodeOrToken)) {
                return { oAuthCodeOrToken };
            }
            else if (!_.isEmpty(oAuthError)) {
                return { oAuthErrorDescription: item.error_description, oAuthError };
            }
        };
        return null;
    }
}

export function mergeUrlParamsAndFragment(params: any, fragment?: string): Record<string, any> {
    let item = new Object() as Record<string, any>;
    _.forIn(params, (value, key) => item[key] = value);
    if (!_.isEmpty(fragment)) {
        new URLSearchParams(fragment).forEach((value, key) => item[key] = value);
    }
    return item;
}