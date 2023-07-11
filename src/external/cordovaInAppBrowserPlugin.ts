import { IOAuthPopUpDto, OAuthBase } from '../OAuthBase';
import { takeUntil } from 'rxjs';
import * as _ from 'lodash';
import { ExtendedError } from '@ts-core/common';
import { PopUpBase } from '../PopUpBase';

// "cordova-plugin-inappbrowser": "^5.0.0"
export const OAuthCordovaInAppBrowserPluginPropertiesSet = (item: OAuthBase, redirectUri: string, method: IOAuthBackendMethod): void => {
    item.redirectUri = redirectUri;
    item.popUpOpener = popUpOpener;

    item.opened.pipe(takeUntil(item.destroyed)).subscribe(async (popUp) => {
        let popUpClosedHandler = (): void => {
            popUp.removeEventListener('exit', popUpClosedHandler);
            popUp.removeEventListener('loadstop', popUpLoadedHandler);
            item.close();
        }
        let popUpLoadedHandler = async (event: any): Promise<void> => {
            if (!event.url.includes(item.redirectUri)) {
                return;
            }
            let data = null;
            try {
                data = await method(item.state);
                if (_.isEmpty(data)) {
                    data = { oAuthError: OAuthBase.ERROR_WINDOW_CLOSED };
                }
            }
            catch (error) {
                data = { oAuthError: error.toString() };
            }
            item.parse(data);
        }
        popUp.addEventListener('exit', popUpClosedHandler, false);
        popUp.addEventListener('loadstop', popUpLoadedHandler, false);
    });
}

function popUpOpener<T extends PopUpBase<U>, U>(popUp: T, window: Window): Window {
    let top = (window.screen.height - popUp.popUpHeight) / 2;
    let left = (window.screen.width - popUp.popUpWidth) / 2;

    let cordova = window['cordova'];
    if (_.isNil(cordova) || _.isNil(cordova.InAppBrowser)) {
        throw new ExtendedError(`Cordova InAppBrowser undefined, please check installed plugins`)
    }
    return cordova.InAppBrowser.open(popUp.popUpUrl(), popUp.popUpTarget, `scrollbars=yes,width=${this.popUpWidth},height=${this.popUpHeight},top=${top},left=${left}`);
}

export type IOAuthBackendMethod = (state: string) => Promise<IOAuthPopUpDto>;