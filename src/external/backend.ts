import { IOAuthPopUpDto, OAuthBase } from '../OAuthBase';
import { DateUtil } from '@ts-core/common';
import { delay, takeUntil } from 'rxjs';
import * as _ from 'lodash';

export const OAuthBackendPropertiesSet = (item: OAuthBase, redirectUri: string, method: IOAuthBackendMethod, timeout: number = DateUtil.MILLISECONDS_SECOND): void => {
    item.redirectUri = redirectUri;
    item.popUpIsCheckClose = false;
    item.popUpOpened.pipe(delay(timeout), takeUntil(item.destroyed)).subscribe(async () => item.parsePopUpResult(await method.call(this, item.state)));
}

export type IOAuthBackendMethod = (state: string) => Promise<IOAuthPopUpDto>;