export type UserRecord = {
    emailAddress:  string;
    hashedPassword: string;
    emailAddressVerified: boolean;
    settings: {
        wantsEmailNotifications: boolean;
        trackedTVShows: number[] 
    }
}