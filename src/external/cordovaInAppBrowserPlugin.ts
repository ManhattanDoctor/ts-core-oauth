import { IOAuthPopUpDto, OAuthBase } from '../OAuthBase';
import { takeUntil } from 'rxjs';
import * as _ from 'lodash';
import { ExtendedError } from '@ts-core/common';

// "cordova-plugin-inappbrowser": "^5.0.0"
export const OAuthCordovaInAppBrowserPluginPropertiesSet = (item: OAuthBase, redirectUri: string, method: IOAuthBackendMethod): void => {
    item.redirectUri = redirectUri;
    item.popUpOpener = popUpOpener;

    item.popUpOpened.pipe(takeUntil(item.destroyed)).subscribe(async (popUp) => {
        let popUpClosedHandler = (): void => {
            popUp.removeEventListener('exit', popUpClosedHandler);
            popUp.removeEventListener('loadstop', popUpLoadedHandler);
            item.close();
        }
        let popUpLoadedHandler = async (event): Promise<void> => {
            if (!event.url.includes(item.redirectUri)) {
                return;
            }
            let data = null;
            try {
                data = await method(item.state);
                if (_.isEmpty(data)) {
                    data = { oAuthError: OAuthBase.ERROR_WINDOW_CLOSED, oAuthCodeOrToken: null };
                }
            }
            catch (error) {
                data = { oAuthError: error.toString(), oAuthCodeOrToken: null };
            }
            item.parseResponse(data);
        }
        popUp.addEventListener('exit', popUpClosedHandler, false);
        popUp.addEventListener('loadstop', popUpLoadedHandler, false);
    });
}
function popUpOpener<T extends OAuthBase>(item: T, window: Window): Window {
    let top = (window.screen.height - item.popUpHeight) / 2;
    let left = (window.screen.width - item.popUpWidth) / 2;

    let cordova = window['cordova'];
    if (_.isNil(cordova) || _.isNil(cordova.InAppBrowser)) {
        throw new ExtendedError(`Cordova InAppBrowser undefined, please check installed plugins`)
    }
    return cordova.InAppBrowser.open(item.getPopUpUrl(), item.popUpTarget, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`);
}
export type IOAuthBackendMethod = (state: string) => Promise<IOAuthPopUpDto>;