import { OAuthUser } from "../OAuthUser";

export class KeyCloakUser extends OAuthUser {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    public givenName: string;
    public familyName: string;
    public isEmailVerified: boolean;
    public preferredUsername: string;

    //--------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    //--------------------------------------------------------------------------

    public parse(item: any): void {
        this.id = item.sub;
        this.name = item.name;
        this.email = item.email;
        this.isEmailVerified = item.email_verified;
        this.preferredUsername = item.preferred_username;

        this.givenName = item.given_name;
        this.familyName = item.family_name;
    }
}

