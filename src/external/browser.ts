import { OAuthBase } from '../OAuthBase';
import * as _ from 'lodash';
import { PopUpBase } from '../PopUpBase';

export const OAuthBrowserPropertiesSet = (item: OAuthBase): void => {
    item.popUpOpener = popUpOpener;
    item.popUpMessageEventParser = popUpMessageEventParser;
    item.isRejectWhenPopUpClosed = true;
}

export function popUpOpener<T extends PopUpBase<U>, U>(popUp: T, window: Window): Window {
    let top = (window.screen.height - popUp.popUpHeight) / 2;
    let left = (window.screen.width - popUp.popUpWidth) / 2;
    return window.open(popUp.popUpUrl(), popUp.popUpTarget, `scrollbars=yes,width=${popUp.popUpWidth},height=${popUp.popUpHeight},top=${top},left=${left}`);
}

export function popUpMessageEventParser(event: MessageEvent): any {
    return !_.isNil(event.data.oauthError) || !_.isNil(event.data.oauthCodeOrToken) ? event.data : null;
}