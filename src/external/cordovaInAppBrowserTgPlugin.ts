import { ExtendedError } from '@ts-core/common';
import { PopUpBase } from '../PopUpBase';
import type { TgAuth } from '../tg/TgAuth';
import { TgUser } from '../tg/TgUser';
import * as _ from 'lodash';

// "cordova-plugin-inappbrowser": "^5.0.0"
export const TgAuthCordovaInAppBrowserPluginPropertiesSet = (item: TgAuth, options: ITgAuthCordovaInAppBrowserOptions): void => {
    let returnUrl = options.returnUrl;
    let origin = options.origin;
    let requestAccess = options.requestAccess;
    let inAppBrowserOptions = !_.isNil(options.inAppBrowserOptions) ? options.inAppBrowserOptions : 'location=no,clearcache=yes,clearsessioncache=yes';

    item.userProvider = (botId: number): Promise<TgUser> => new Promise<TgUser>((resolve, reject) => {
        let cordova = window['cordova'];
        if (_.isNil(cordova) || _.isNil(cordova.InAppBrowser)) {
            reject(new ExtendedError(`Cordova InAppBrowser undefined, please check installed plugins`));
            return;
        }

        let url = `https://oauth.telegram.org/auth?bot_id=${botId}`
            + `&origin=${encodeURIComponent(origin)}`
            + `&return_to=${encodeURIComponent(returnUrl)}`;
        if (!_.isNil(requestAccess)) {
            url += `&request_access=${requestAccess}`;
        }

        let popUp = cordova.InAppBrowser.open(url, '_blank', inAppBrowserOptions);
        let isSettled = false;

        let cleanup = (): void => {
            popUp.removeEventListener('loadstart', onLoad);
            popUp.removeEventListener('loadstop', onLoad);
            popUp.removeEventListener('exit', onExit);
        };

        let onLoad = (event: any): void => {
            if (isSettled || _.isNil(event) || _.isNil(event.url) || event.url.indexOf(returnUrl) !== 0) {
                return;
            }
            let user = parseTgAuthResult(event.url);
            if (_.isNil(user)) {
                return;
            }
            isSettled = true;
            cleanup();
            popUp.close();
            resolve(user);
        };

        let onExit = (): void => {
            cleanup();
            if (!isSettled) {
                reject(new ExtendedError(PopUpBase.ERROR_WINDOW_CLOSED, PopUpBase.ERROR_WINDOW_CLOSED as any));
            }
        };

        popUp.addEventListener('loadstart', onLoad, false);
        popUp.addEventListener('loadstop', onLoad, false);
        popUp.addEventListener('exit', onExit, false);
    });
};

function parseTgAuthResult(url: string): TgUser {
    let raw: string = null;
    let hashIndex = url.indexOf('#');
    if (hashIndex >= 0) {
        let value = new URLSearchParams(url.substring(hashIndex + 1)).get('tgAuthResult');
        if (!_.isEmpty(value)) {
            try { raw = base64UrlDecode(value); } catch (error) { }
        }
    }

    let data: any = null;
    if (!_.isNil(raw)) {
        try { data = JSON.parse(raw); } catch (error) { return null; }
    } else {
        let qIndex = url.indexOf('?');
        if (qIndex < 0) {
            return null;
        }
        let query = new URLSearchParams(url.substring(qIndex + 1, hashIndex >= 0 ? hashIndex : undefined));
        if (_.isEmpty(query.get('hash'))) {
            return null;
        }
        data = {};
        query.forEach((v, k) => data[k] = v);
    }

    if (_.isNil(data) || _.isNil(data.hash)) {
        return null;
    }
    let user = new TgUser();
    user.parse(data);
    return user;
}

function base64UrlDecode(value: string): string {
    let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    let pad = normalized.length % 4;
    if (pad !== 0) {
        normalized += '='.repeat(4 - pad);
    }
    let binary = atob(normalized);
    let bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

export interface ITgAuthCordovaInAppBrowserOptions {
    origin: string;
    returnUrl: string;
    requestAccess?: 'write';
    inAppBrowserOptions?: string;
}
