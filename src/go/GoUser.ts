import { OAuthUser } from "../OAuthUser";

export class GoUser extends OAuthUser {

    //--------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    //--------------------------------------------------------------------------

    protected parse(item: any): void {
        this.id = item.sub;
        this.name = item.name;
        this.email = item.email;
        this.locale = item.locale;
        this.picture = item.picture;
    }
}