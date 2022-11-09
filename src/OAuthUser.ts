import * as _ from 'lodash';
import { Type } from 'class-transformer';

export abstract class OAuthUser {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public id: string | number;
    public name: string;
    public city?: string;
    public phone?: string;
    public email?: string;
    public status?: string;
    public isMale?: boolean;
    public locale?: string;
    public country?: string;
    public picture?: string;
    public latitude?: number;
    public longitude?: number;
    public description?: string;

    public vk?: string;
    public facebook?: string;
    public telegram?: string;
    public instagram?: string;

    @Type(() => Date)
    public birthday?: Date;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    constructor(item?:any) {
        if(!_.isNil(item)) {
            this.parse(item);
        }
    }

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected abstract parse(item:any):void;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public get location(): string {
        let items = new Array();
        if (!_.isEmpty(this.country)) {
            items.push(this.country);
        }
        if (!_.isEmpty(this.city)) {
            items.push(this.city);
        }
        return !_.isEmpty(items)? items.join(', '): null;
    }

}