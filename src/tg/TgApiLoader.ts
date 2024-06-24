import { Destroyable } from "@ts-core/common";
import * as _ from 'lodash';

export class TgApiLoader extends Destroyable implements ITgApiLoader {

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    protected settings: ITgApiLoaderSettings;

    //--------------------------------------------------------------------------
    //
    // 	Constructor
    //
    //--------------------------------------------------------------------------

    constructor(settings: ITgApiLoaderSettings) {
        super();
        this.settings = settings;
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    public async getApi(): Promise<any> {
        await this.settings.script.load();
        let item = !_.isNil(this.settings.window) ? this.settings.window : window;
        return item['Telegram'];
    }
}

export interface ITgApiLoaderSettings {
    script: IScriptLoader;
    window?: Window;
}

export interface ITgApiLoader {
    getApi(): Promise<any>;
}

export interface IScriptLoader {
    load(): Promise<void>;
}