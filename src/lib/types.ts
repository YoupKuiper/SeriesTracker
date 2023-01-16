import { z } from "zod";

export const TVShowObject = z.object({
	id: z.number(),
	name: z.string(),
	poster_path: z.string().optional().nullable(),
	genre_ids: z.array(z.number()).optional(),
	origin_country: z.array(z.string()).optional(),
	original_language: z.string().optional().nullable(),
	original_name: z.string().optional().nullable(),
	popularity: z.number(),
	first_air_date: z.string().optional().nullable(),
	overview: z.string().optional().nullable(),
	backdrop_path: z.string().optional().nullable(),
	vote_average: z.number(),
	vote_count: z.number(),
});

export const UserObject = z.object({
	emailAddress: z.string(),
	unsubscribeEmailToken: z.string(),
	resetPasswordToken: z.string(),
	emailAddressVerified: z.boolean(),
	wantsEmailNotifications: z.boolean(),
	trackedTVShows: z.array(TVShowObject),
	hashedPassword: z.string(),
});

export const UserUpdateObject = z
	.object({
		wantsEmailNotifications: z.boolean().optional(),
		mobileNotificationsToken: z.string().optional(),
		wantsMobileNotifications: z.boolean().optional(),
		trackedTVShows: z.array(TVShowObject).optional(),
	})
	.strict();

export type User = z.infer<typeof UserObject>;
export type TVShow = z.infer<typeof TVShowObject>;
