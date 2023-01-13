const axios = require("axios").default;
import aws from "aws-sdk";
import fs from "fs";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { sendEmail } from "./lib/sendEmailHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any) => {
	console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

	try {
		const dynamoDBClient = new DynamoDBClient();
		const allTrackedShowsForAllUsers = await dynamoDBClient.getAllUsersAndTrackedShows();

		// Get shows that notifications have already been sent for,
		const alreadySentNotificationIds = await dynamoDBClient.getAlreadySentNotificationIds();
		console.log(`Already sent notifications: ${JSON.stringify(alreadySentNotificationIds)}`);

		if (!allTrackedShowsForAllUsers) {
			return;
		}

		const allTVShowsAiringToday = await getAllTVShowsAiringToday();
		const allTVShowsAiringTodayNotNotifiedYet = allTVShowsAiringToday.filter(
			(trackedShow) => !alreadySentNotificationIds.includes(trackedShow.id)
		);
		console.log(`All airing not notified yet: ${JSON.stringify(allTVShowsAiringTodayNotNotifiedYet)}`);

		const allNotifiedIds: number[] = [];
		let promises: Promise<any>[] = [];

		for (const user of allTrackedShowsForAllUsers) {
			if (!user.trackedTVShows || (!user.wantsEmailNotifications && !user.wantsMobileNotifications)) {
				continue;
			}

			const trackedTVShowsAiringTodayForUser = user.trackedTVShows.filter((trackedShow) =>
				allTVShowsAiringTodayNotNotifiedYet.find((airingToday) => {
					if (trackedShow.id === airingToday.id) {
						allNotifiedIds.push(trackedShow.id);
						return true;
					}
				})
			);

			if (!trackedTVShowsAiringTodayForUser) {
				continue;
			}

			let { trackedTVShowsNames, trackedTVShowsPosters } = getTrackedTVShowsNamesAndPosters(
				trackedTVShowsAiringTodayForUser
			);

			if (trackedTVShowsNames) {
				if (user.wantsEmailNotifications) {
					console.log(
						`Pushing task to send email to: ${user.emailAddress} for airing shows: ${trackedTVShowsNames}`
					);
					promises.push(
						sendEmailNotificationTo(
							user.emailAddress,
							trackedTVShowsNames,
							trackedTVShowsPosters,
							user.unsubscribeEmailToken
						)
					);
				}
				if (user.wantsMobileNotifications && user.mobileNotificationsToken) {
					console.log(
						`Pushing task to send mobile notification to: ${user.emailAddress} for airing shows: ${trackedTVShowsNames}`
					);
					promises.push(
						sendMobileNotificationTo(user.emailAddress, user.mobileNotificationsToken, trackedTVShowsNames)
					);
				}
			}
		}

		alreadySentNotificationIds
			? promises.push(dynamoDBClient.putAlreadySentNotificationIds(allNotifiedIds))
			: promises.push(dynamoDBClient.putAlreadySentNotificationIds([]));

		await Promise.allSettled(promises);

		return sendOKResponse("Notifications sent successfully");
	} catch (error) {
		console.error(error);
		return sendErrorResponse("Failed to send email");
	}
};

const getTVShowsFor = async (pageNumber: number) => {
	const response = await axios.get(
		`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=${pageNumber}`
	);
	return response.data.results;
};

const getAllTVShowsAiringToday = async () => {
	// Call movieDB to get todays airing tv shows
	const response = await axios.get(
		`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=1`
	);

	let promises: Promise<any>[] = [];
	console.log(`Total pages of tv shows airing today: ${response.data.total_pages}`);

	for (let pageNumber = 1; pageNumber < response.data.total_pages + 1; pageNumber++) {
		promises.push(getTVShowsFor(pageNumber));
	}

	const allTVShowsAiringTodayPaged = await Promise.all(promises);
	return Array.prototype.concat.apply([], allTVShowsAiringTodayPaged);
};

const sendEmailNotificationTo = async (
	emailAddress: string,
	trackedTVShowsNames: string,
	trackedTVShowsPostersHTML: string,
	unsubscribeToken: string,
	debug: boolean = false
) => {
	if (!process.env.FROM_EMAIL_ADDRESS) {
		console.error("From email address was not set");
		return sendErrorResponse("From email address was not set");
	}

	const htmlEmail = fs
		.readFileSync(__dirname + "/email-template.html")
		.toString()
		.replace(/{TVSHOWNAMES}/gi, trackedTVShowsNames)
		.replace("{POSTERS}", trackedTVShowsPostersHTML)
		.replace("{EMAILADDRESS}", encodeURIComponent(emailAddress))
		.replace("{UNSUBSCRIBETOKEN}", encodeURIComponent(unsubscribeToken));

	console.log(`Email after replacements: ${htmlEmail}`);

	await sendEmail(
		process.env.FROM_EMAIL_ADDRESS,
		emailAddress,
		`Airing today: ${trackedTVShowsNames}`,
		htmlEmail,
		`New episodes airing for ${trackedTVShowsNames}`
	);
};

const sendMobileNotificationTo = async (emailAddress, userDeviceToken, trackedTVShowsNames) => {
	try {
		await axios.post(
			`https://fcm.googleapis.com/fcm/send`,
			{
				to: userDeviceToken,
				notification: {
					title: `NEW EPISODE: ${trackedTVShowsNames}`,
					body: "Enjoy!",
				},
			},
			{
				headers: {
					Authorization: `key=${process.env.FIREBASE_NOTIFICATION_KEY_ANDROID}`,
				},
			}
		);
	} catch (error) {
		console.log(`Failed to send mobile notification to user ${emailAddress} with token: ${userDeviceToken}`);
		console.log(error);
	}
};

const getTrackedTVShowsNamesAndPosters = (trackedTVShowsAiringTodayForUser: any) => {
	let trackedTVShowsNames = "";
	let trackedTVShowsPosters = "";
	for (let [index, TVShow] of trackedTVShowsAiringTodayForUser.entries()) {
		const tvShowName = TVShow.name.toUpperCase();

		if (trackedTVShowsAiringTodayForUser.length === 1) {
			trackedTVShowsNames += `${tvShowName}`;
			trackedTVShowsPosters += `<img src="https://image.tmdb.org/t/p/w300${TVShow.poster_path}" alt="${tvShowName}">&nbsp;`;
			break;
		}
		trackedTVShowsNames +=
			index === trackedTVShowsAiringTodayForUser.length - 1 ? `AND ${tvShowName}` : `${tvShowName}, `;
		trackedTVShowsPosters += `<img src="https://image.tmdb.org/t/p/w300${TVShow.poster_path}" alt="${tvShowName}">&nbsp;`;
	}
	return { trackedTVShowsNames, trackedTVShowsPosters };
};
