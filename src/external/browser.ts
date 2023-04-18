import { IOAuthPopUpDto, OAuthBase } from '../OAuthBase';
import * as _ from 'lodash';
import { ObjectUtil } from '@ts-core/common';

export const OAuthBrowserPropertiesSet = (item: OAuthBase): void => {
    item.popUpOpener = popUpOpener;
    item.popUpMessageParser = popUpMessageParser;

    item.isRejectWhenPopUpClosed = true;
}
function popUpOpener<T extends OAuthBase>(item: T, window: Window): Window {
    let top = (window.screen.height - item.popUpHeight) / 2;
    let left = (window.screen.width - item.popUpWidth) / 2;
    return window.open(item.getPopUpUrl(), item.popUpTarget, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`);
}
function popUpMessageParser<T extends OAuthBase>(item: T, event: MessageEvent<IOAuthPopUpDto>): IOAuthPopUpDto {
    if (event.origin !== item.getOriginUrl()) {
        return null;
    }
    let data = event.data;
    if (!_.isObject(data)) {
        return null;
    }
    if (!ObjectUtil.hasOwnProperty(data, 'oAuthCodeOrToken') && !ObjectUtil.hasOwnProperty(data, 'oAuthError')) {
        return null;
    }
    return data;
}