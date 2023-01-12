import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { createPasswordHash } from "./lib/passwordHelper";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { sendEmail } from "./lib/sendEmailHelper";
import fs from "fs";
import { createRandomString } from "./lib/tokenHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any) => {
	console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

	const parsedEvent = JSON.parse(event.body);
	console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

	try {
		// Create hash from password
		const user = {
			emailAddress: parsedEvent.emailAddress.toLowerCase(),
			hashedPassword: await createPasswordHash(parsedEvent.password),
			unsubscribeEmailToken: createRandomString(),
			resetPasswordToken: createRandomString(),
			verifyEmailAddressToken: createRandomString(),
			wantsEmailNotifications: true,
			wantsMobileNotifications: true,
			emailAddressVerified: false,
		};

		await new DynamoDBClient().createUserAccount(user);

		// Send verification email
		const htmlEmail = fs
			.readFileSync(__dirname + "/user-registration-email-template.html")
			.toString()
			.replace("{EMAILADDRESS}", encodeURIComponent(user.emailAddress))
			.replace("{VERIFYEMAILTOKEN}", encodeURIComponent(user.verifyEmailAddressToken));

		console.log(`Email after replacements: ${htmlEmail}`);
		if (!process.env.VERIFY_EMAIL_ADDRESS_FROM_EMAIL_ADDRESS) {
			throw "ENV var for email address missing";
		}
		await sendEmail(
			process.env.VERIFY_EMAIL_ADDRESS_FROM_EMAIL_ADDRESS,
			user.emailAddress,
			"Email address verification",
			htmlEmail,
			""
		);

		return sendOKResponse("Account created");
	} catch (error) {
		console.error(error);
		return sendErrorResponse("Account creation failed");
	}
};
