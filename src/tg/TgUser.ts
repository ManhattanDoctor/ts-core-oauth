import { Type } from 'class-transformer';
import { DateUtil } from '@ts-core/common';
import { OAuthUser } from '../OAuthUser';
import * as _ from 'lodash';

export class TgUser extends OAuthUser {
    //--------------------------------------------------------------------------
    //
    // 	Static Methods
    //
    //--------------------------------------------------------------------------

    public static toCheckString<T = any>(item: TgUser | T): string {
        let raw = item instanceof TgUser ? item.raw : item;
        return Object.keys(raw).sort().filter((k) => raw[k]).filter((k) => !['hash'].includes(k)).map(k => (`${k}=${raw[k]}`)).join('\n');
    }

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    @Type(() => Date)
    public date: Date;
    public hash: string;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public parse(item: any): void {
        super.parse(item);

        this.id = item.id.toString();
        this.hash = item.hash;
        this.name = `${item.first_name} ${item.last_name}`;
        this.date = DateUtil.getDate(item.auth_date * DateUtil.MILLISECONDS_SECOND);
        this.picture = item.photo_url;
        this.nickname = item.username;
        this.telegram = `https://t.me/${item.nickname}`;
    }

    public toCheckString(): string {
        return TgUser.toCheckString(this)
    }
}