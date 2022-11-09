import { OAuthUser } from "../OAuthUser";

export class GoUser extends OAuthUser {

    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public givenName: string;
    public familyName: string;

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

        this.givenName = item.given_name;
        this.familyName = item.family_name;
    }
}