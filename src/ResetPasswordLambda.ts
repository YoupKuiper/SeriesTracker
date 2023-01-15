import aws from "aws-sdk";
import { string } from "zod";
import fs from "fs";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { sendEmail } from "./lib/sendEmailHelper";

export const handler = async (event: any, context: any) => {
	console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

	const parsedEvent = JSON.parse(event.body);
	console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

	const { emailAddress } = parsedEvent;

	console.log(`Email address: ${emailAddress}`);

	try {
		// Check if email address exists
		const user = await new DynamoDBClient().getUserByEmailAddress(emailAddress);
		if (!user) {
			return sendOKResponse({
				message: "An email with a reset password link has been sent to your email address",
			});
		}
		// Create html email content
		const htmlEmail = fs
			.readFileSync(__dirname + "/reset-password-email-template.html")
			.toString()
			.replace("{EMAILADDRESS}", encodeURIComponent(emailAddress))
			.replace("{RESETPASSWORDTOKEN}", encodeURIComponent(user.resetPasswordToken));

		console.log(`Email after replacements: ${htmlEmail}`);
		// Send email with password reset link if exists
		if (!process.env.RESET_PASSWORD_FROM_EMAIL_ADDRESS) {
			throw "ENV var for email address missing";
		}
		await sendEmail(
			process.env.RESET_PASSWORD_FROM_EMAIL_ADDRESS,
			user.emailAddress,
			"Password reset request",
			htmlEmail,
			""
		);
		return sendOKResponse({ message: "An email with a reset password link has been sent to your email address" });
	} catch (error) {
		console.error(error);
		return sendErrorResponse({ message: "Failed log in user" });
	}
};
