import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { isCorrectPassword } from "./lib/passwordHelper";
import { OAuth2Client } from "google-auth-library";
import {
	sendErrorResponse,
	sendOKResponse,
	sendTokenErrorResponse,
	sendVerifyEmailFirstResponse,
} from "./lib/responseHelper";
import { isValid, signTokenFor } from "./lib/tokenHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any) => {
	console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

	const parsedEvent = JSON.parse(event.body);
	console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

	try {
		const isLoginWithTokenRequest = !!parsedEvent.token;
		console.log(parsedEvent.googleIdToken);
		const isLoginWithGoogleRequest = !!parsedEvent.googleIdToken;
		console.log(isLoginWithGoogleRequest);
		const dynamoClient = new DynamoDBClient();
		if (isLoginWithTokenRequest) {
			// Check if valid token
			const decodedToken = isValid(parsedEvent.token);
			const emailAddress = decodedToken["data"]["emailAddress"];
			const userDto = await dynamoClient.getUserByEmailAddress(emailAddress);
			if (!userDto) {
				console.error(`User for ${emailAddress} not found`);
				return sendErrorResponse({ message: "User not found" });
			}
			const { wantsEmailNotifications, wantsMobileNotifications } = userDto;
			return sendOKResponse({
				emailAddress,
				wantsEmailNotifications,
				wantsMobileNotifications,
			});
		}

		if (isLoginWithGoogleRequest) {
			const clientId = process.env.FIREBASE_GOOGLE_OAUTH_CLIENT_ID;
			if (!clientId) {
				throw "FIREBASE CLIENT ID ENV VAR NOT PRESENT";
			}
			const client = new OAuth2Client(clientId);
			const ticket = await client.verifyIdToken({
				idToken: parsedEvent.googleIdToken,
				audience: clientId, // Specify the CLIENT_ID of the app that accesses the backend
				// Or, if multiple clients access the backend:
				//[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
			});
			const payload = ticket.getPayload();
			if (!payload || !payload.email) {
				console.error("Failed to verify google id token");
				return sendErrorResponse({ message: "Failed to verify google id token" });
			}
			const emailAddress = payload.email;

			const user = await dynamoClient.getUserByEmailAddress(emailAddress);
			if (user) {
				return sendOKResponse(user);
			}

			// Create user and return fresh one
			await dynamoClient.createUserAccount(emailAddress);
			const token = signTokenFor(emailAddress, true, true);

			console.log(`Login successful`);
			return sendOKResponse({
				token,
				emailAddress: emailAddress,
				wantsEmailNotifications: true,
				wantsMobileNotifications: true,
			});
		}

		const { password, emailAddress } = parsedEvent;
		console.log(`Email address: ${emailAddress}`);

		// Get user from DynamoDB by EmailAddress
		const userDto = await dynamoDB
			.getItem({
				Key: aws.DynamoDB.Converter.marshall({
					emailAddress: emailAddress,
				}),
				TableName: process.env.TV_SHOWS_TABLE_NAME || "",
			})
			.promise();

		if (!userDto.Item) {
			console.log(`Invalid credentials`);
			return sendErrorResponse({ message: "Invalid credentials" });
		}

		const { hashedPassword, unsubscribeEmailToken, resetPasswordToken, ...user } =
			aws.DynamoDB.Converter.unmarshall(userDto.Item);

		// Check if password is correct
		if (await isCorrectPassword(password, hashedPassword)) {
			if (!user.emailAddressVerified) {
				return sendVerifyEmailFirstResponse();
			}
			// Endcode a JWT token and return
			const token = signTokenFor(user.emailAddress, user.wantsEmailNotifications, user.wantsMobileNotifications);

			console.log(`Login successful`);
			return sendOKResponse({
				token,
				emailAddress: user.emailAddress,
				wantsEmailNotifications: user.wantsEmailNotifications,
				wantsMobileNotifications: user.wantsMobileNotifications,
			});

			throw new Error(`Environment variable for JWT secret required`);
		}

		console.log(`Invalid credentials`);
		return sendErrorResponse({ message: "Invalid credentials" });
	} catch (error) {
		console.error(error);
		return sendErrorResponse({ message: "Failed to log in user" });
	}
};
