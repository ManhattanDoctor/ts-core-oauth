import { ExtendedError, ILogger, LoggerWrapper, PromiseHandler } from "@ts-core/common";
import { TgUser } from "./TgUser";
import { PopUpBase } from "../PopUpBase";
import { ITgApiLoader } from "./TgApiLoader";
import * as _ from 'lodash';

export class TgAuth extends LoggerWrapper {
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
