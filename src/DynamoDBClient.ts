import aws from "aws-sdk";
import { createPasswordHash } from "./lib/passwordHelper";
import { createRandomString } from "./lib/tokenHelper";
const docClient = new aws.DynamoDB.DocumentClient({ region: process.env.AWS_REGION, apiVersion: "2012-08-10" });

const ALREADY_SENT_NOTIFICATIONS_RECORD_ID = "ALREADY_SENT_NOTIFICATIONS_RECORD";
const DEFAULT_PASSWORD = "DEFAULT_VALUE_FOR_PASSWORD";

export class DynamoDBClient {
	createUserAccount = async (emailAddress, password = null, mobile = false, isOauth = false) => {
		const passwordToSave = !!password ? await createPasswordHash(password) : DEFAULT_PASSWORD;
		const user = {
			emailAddress: emailAddress.toLowerCase(),
			hashedPassword: passwordToSave,
			unsubscribeEmailToken: createRandomString(),
			resetPasswordToken: createRandomString(),
			verifyEmailAddressToken: createRandomString(),
			wantsEmailNotifications: true,
			wantsMobileNotifications: true,
			emailAddressVerified: isOauth,
			mobileRegistration: !!mobile,
		};

		await docClient
			.put({
				Item: user,
				TableName: process.env.TV_SHOWS_TABLE_NAME || "",
				ConditionExpression: "attribute_not_exists(emailAddress)",
			})
			.promise();
		return user;
	};

	updateUser = async (updateParams) => {
		const user = await docClient.update(updateParams).promise();
		console.log(`Returning user: ${JSON.stringify(user)}`);
		return user.Attributes;
	};

	getAllUsersAndTrackedShows = async () => {
		const response = await docClient.scan({ TableName: process.env.TV_SHOWS_TABLE_NAME || "" }).promise();
		if (!response.Items) {
			console.error("NO TRACKED TV SHOWS FOUND AT ALL");
		}

		console.log(`RESPONSE: ${JSON.stringify(response.Items)}`);

		return response.Items;
	};

	getUserByEmailAddress = async (emailAddress: string) => {
		// Get TVShows from DynamoDB by EmailAddress
		const { Item } = await docClient
			.get({
				Key: { emailAddress },
				TableName: process.env.TV_SHOWS_TABLE_NAME || "",
			})
			.promise();

		if (!Item) {
			// No record found, return empty list
			console.log(`DB record not found`);
			return null;
		}

		return Item;
	};

	getAlreadySentNotificationIds = async () => {
		// Get already sent notification record from DynamoDB by EmailAddress
		const { Item } = await docClient
			.get({
				Key: { emailAddress: ALREADY_SENT_NOTIFICATIONS_RECORD_ID },
				TableName: process.env.TV_SHOWS_TABLE_NAME || "",
			})
			.promise();

		if (!Item) {
			// No record found, return empty list
			console.log(`DB record not found`);
			return [];
		}

		return Item.idList;
	};

	putAlreadySentNotificationIds = async (idList: number[]) => {
		await docClient
			.put({
				Item: { emailAddress: ALREADY_SENT_NOTIFICATIONS_RECORD_ID, idList },
				TableName: process.env.TV_SHOWS_TABLE_NAME || "",
			})
			.promise();
	};
}
