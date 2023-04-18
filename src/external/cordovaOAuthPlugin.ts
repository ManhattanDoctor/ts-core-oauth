import { IOAuthPopUpDto, OAuthBase } from '../OAuthBase';
import { OAuthParser } from '../OAuthParser';
import * as _ from 'lodash';

// "cordova-plugin-oauth": "^4.0.1"
export const OAuthCordovaOAuthPluginPropertiesSet = (item: OAuthBase, packageName: string): void => {
    item.popUpTarget = 'oauth:cordova';
    item.popUpOpener = popUpOpener;
    item.popUpMessageParser = popUpMessageParser;

    item.redirectUri = `${packageName}://oauth_callback`;
    item.isRejectWhenPopUpClosed = false;
}
function popUpOpener<T extends OAuthBase>(item: T, window: Window): Window {
    let top = (window.screen.height - item.popUpHeight) / 2;
    let left = (window.screen.width - item.popUpWidth) / 2;
    let popUp = window.open(item.getPopUpUrl(), item.popUpTarget, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`);
    if (!_.isNil(popUp)) {
        return popUp;
    }
    let fake = { close: () => { fake.closed = true }, closed: false };
    return fake as any;
}
function popUpMessageParser<T extends OAuthBase>(item: T, event: MessageEvent): IOAuthPopUpDto {
    let data = event.data;
    let prefix = 'oauth::';
    return _.isString(data) && data.includes(prefix) ? OAuthParser.parse(JSON.parse(data.substring(prefix.length)), '') : null;
}