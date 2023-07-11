import { OAuthBase } from '../OAuthBase';
import { OAuthParser } from '../OAuthParser';
import { PopUpBase } from '../PopUpBase';
import * as _ from 'lodash';

// "cordova-plugin-oauth": "^4.0.1"
export const OAuthCordovaOAuthPluginPropertiesSet = (item: OAuthBase, packageName: string): void => {
    item.popUpTarget = 'oauth:cordova';
    item.popUpOpener = popUpOpener;
    item.popUpMessageEventParser = popUpMessageEventParser;

    item.redirectUri = `${packageName}://oauth_callback`;
    item.isRejectWhenPopUpClosed = false;
}
function popUpOpener<T extends PopUpBase<U>, U>(popUp: T, window: Window): Window {
    let top = (window.screen.height - popUp.popUpHeight) / 2;
    let left = (window.screen.width - popUp.popUpWidth) / 2;
    let item = window.open(popUp.popUpUrl(), popUp.popUpTarget, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`);
    if (!_.isNil(item)) {
        return item;
    }
    let fake = { close: () => { fake.closed = true }, closed: false };
    return fake as any;
}
function popUpMessageEventParser(event: MessageEvent): any {
    let data = event.data;
    let prefix = 'oauth::';
    return _.isString(data) && data.includes(prefix) ? OAuthParser.parse(JSON.parse(data.substring(prefix.length)), '') : null;
}