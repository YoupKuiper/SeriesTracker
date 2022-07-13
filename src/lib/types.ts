export type UserRecord = {
    emailAddress:  string;
    emailAddressVerified: boolean;
    settings: {
        wantsEmailNotifications: boolean;
        trackedTVShows: number[] 
    }
    hashedPassword?: string;
}