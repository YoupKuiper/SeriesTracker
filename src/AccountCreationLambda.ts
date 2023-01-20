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
		const user = await new DynamoDBClient().createUserAccount(
			parsedEvent.emailAddress,
			parsedEvent.password,
			parsedEvent.mobile
		);

		// Send verification email
		const htmlEmail = fs
			.readFileSync(__dirname + "/user-registration-email-template.html")
			.toString()
			.replace(/{EMAILADDRESS}/g, encodeURIComponent(user.emailAddress))
			.replace(/{VERIFYEMAILTOKEN}/g, encodeURIComponent(user.verifyEmailAddressToken))
			.replace(/{MOBILEREGISTRATION}/g, encodeURIComponent(user.mobileRegistration));

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

		return sendOKResponse({ message: "Account created" });
	} catch (error) {
		console.error(error);
		return sendErrorResponse({ message: "Account creation failed" });
	}
};
