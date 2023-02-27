import { IOAuthPopUpDto, OAuthBase } from '../OAuthBase';
import { OAuthParser } from '../OAuthParser';
import * as _ from 'lodash';

// "cordova-plugin-oauth": "^4.0.1"
export const OAuthCordovaPropertiesSet = (item: OAuthBase, packageName: string): void => {
    item.popUpTarget = 'oauth:cordova';
    item.redirectUri = `${packageName}://oauth_callback`;
    item.popUpIsCheckClose = false;
    item.popUpMessageParser = cordovaPopUpMessageParser;
}
function cordovaPopUpMessageParser(event: MessageEvent): IOAuthPopUpDto {
    let data = event.data;
    let prefix = 'oauth::';
    return _.isString(data) && data.includes(prefix) ? OAuthParser.parse(JSON.parse(data.substring(prefix.length)), '') : null;
}