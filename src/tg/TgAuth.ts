import { ExtendedError, ILogger, LoggerWrapper, PromiseHandler } from "@ts-core/common";
import { TgUser } from "./TgUser";
import { PopUpBase } from "../PopUpBase";
import { ITgApiLoader } from "./TgApiLoader";
import * as _ from 'lodash';

export class TgAuth extends LoggerWrapper {

    //--------------------------------------------------------------------------
    //
    // 	Static Methods
    //
    //--------------------------------------------------------------------------

    public static getUser(locationHash: string): TgUser {
        let item = new TgUser();
        item.parse(TgAuth.getInitDataUnsafe(locationHash));
        item.raw = TgAuth.getInitData(locationHash);
        return item;
    }

    public static getInitData(locationHash: string): string {
        let item = TgAuth.urlParseHashParams(locationHash);
        return item.tgWebAppData;
    }

    public static getInitDataUnsafe(locationHash: string): Record<string, any> {
        return TgAuth.urlParseQueryString(TgAuth.getInitData(locationHash));
    }

    // Based on telegram-web-app.js
    private static urlParseHashParams(locationHash: string): Record<string, any> {
        locationHash = locationHash.replace(/^#/, '');
        let params = {} as any;
        if (_.isEmpty(locationHash)) {
            return params;
        }
        if (locationHash.indexOf('=') < 0 && locationHash.indexOf('?') < 0) {
            params._path = TgAuth.urlSafeDecode(locationHash);
            return params;
        }
        let qIndex = locationHash.indexOf('?');
        if (qIndex >= 0) {
            var pathParam = locationHash.substr(0, qIndex);
            params._path = TgAuth.urlSafeDecode(pathParam);
            locationHash = locationHash.substr(qIndex + 1);
        }
        let query_params = TgAuth.urlParseQueryString(locationHash);
        for (var k in query_params) {
            params[k] = query_params[k];
        }
        return params;
    }

    private static urlParseQueryString(queryString: string): Record<string, any> {
        var params = {};
        if (!queryString.length) {
            return params;
        }
        let queryStringParams = queryString.split('&');
        let i, param, paramName, paramValue;
        for (i = 0; i < queryStringParams.length; i++) {
            param = queryStringParams[i].split(/=(.+)/)
            paramName = TgAuth.urlSafeDecode(param[0]);
            paramValue = param[1] == null ? null : TgAuth.urlSafeDecode(param[1]);
            params[paramName] = paramValue;
        }
        return params;
    }

    private static urlSafeDecode(item: string): string {
        try {
            item = item.replace(/\+/g, '%20');
            return decodeURIComponent(item);
        } catch (error) {
            return item;
        }
    }

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    protected promise: PromiseHandler<TgUser, ExtendedError>;
    protected settings: ITgAuthSettings;

    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(logger: ILogger, settings: ITgAuthSettings) {
        super(logger);
        this.settings = settings;
    }

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public async getUser(): Promise<TgUser> {
        if (!_.isNil(this.promise)) {
            return this.promise.promise;
        }
        this.promise = PromiseHandler.create();
        this.settings.api.getApi()
            .then(item => {
                item.Login.auth({ bot_id: this.settings.botId }, item => {
                    if (item === false) {
                        this.promise.reject(new ExtendedError(PopUpBase.ERROR_WINDOW_CLOSED, PopUpBase.ERROR_WINDOW_CLOSED as any));
                        this.promise = null;
                        return;
                    }
                    let user = new TgUser();
                    user.parse(item);
                    this.promise.resolve(user);
                })

            })
            .catch(error => {
                this.promise.reject(new ExtendedError(error.message));
                this.promise = null;
            })
        return this.promise.promise;
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();
        if (!_.isNil(this.promise)) {
            this.promise.reject(new ExtendedError(PopUpBase.ERROR_WINDOW_CLOSED, PopUpBase.ERROR_WINDOW_CLOSED as any));
            this.promise = null;
        }
    }
}

export interface ITgAuthSettings {
    api: ITgApiLoader;
    botId: number;
}
