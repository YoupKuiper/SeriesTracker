import { sendOKResponse } from "./lib/responseHelper";
import { createDynamoDBUpdateParams } from "./lib/updateRecordHelper";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendEmail } from "./lib/sendEmailHelper";

export const handler = async (event: any, context: any) => {
	console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

	const parsedEvent = JSON.parse(event.body);
	console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

	try {
		const parsedMessage = JSON.parse(parsedEvent.Message);
		const dynamoDBClient = new DynamoDBClient();
		console.log(parsedMessage);
		const recipients = parsedMessage.mail.destination;
		let promises: Promise<any>[] = [];

		for (const recipient of recipients) {
			if (parsedMessage.bounce.bounceType === "Permanent") {
				// We never want to email this person again, unsubscribe them
				const params = createDynamoDBUpdateParams(
					{
						wantsEmailNotifications: false,
					},
					recipient
				);
				promises.push(dynamoDBClient.updateUser(params));
			} else {
				// Bounce type is not permanent, review manually
				const devEmailAddress = "youpkuiper@gmail.com";
				promises.push(
					sendEmail(
						process.env.FROM_EMAIL_ADDRESS || devEmailAddress,
						devEmailAddress,
						`Email bounced with type ${parsedMessage.bounce.bounceType} to ${recipient}`,
						"<p> Email bounce, see subject for info </p>",
						`Email bounced with type ${parsedMessage.bounce.bounceType} to ${recipient}`
					)
				);
			}
		}

		await Promise.allSettled(promises);
	} catch (error) {
		console.log(error);
	}

	return sendOKResponse({ message: "Done!" });
};
