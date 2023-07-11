import { OAuthBase } from '../OAuthBase';
import { popUpOpener } from '../PopUpBase';
import * as _ from 'lodash';

export const OAuthBrowserPropertiesSet = (item: OAuthBase): void => {
    item.popUpOpener = popUpOpener;
    item.popUpMessageEventParser = popUpMessageEventParser;
    item.isRejectWhenPopUpClosed = true;
}

function popUpMessageEventParser(event: MessageEvent): any {
    return !_.isNil(event.data.oauthError) || !_.isNil(event.data.oauthCodeOrToken) ? event.data : null;
}