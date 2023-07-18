import { PopUpBase, popUpOpener } from '../PopUpBase';
import * as _ from 'lodash';

export const OAuthBrowserPropertiesSet = <U>(item: PopUpBase<U>): void => {
    item.popUpOpener = popUpOpener;
    item.popUpMessageEventParser = popUpMessageEventParser;
    item.isRejectWhenPopUpClosed = true;
}

function popUpMessageEventParser(event: MessageEvent): any {
    return !_.isNil(event.data.oAuthError) || !_.isNil(event.data.oAuthCodeOrToken) ? event.data : null;
}