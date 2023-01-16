import { sendOKResponse } from "./lib/responseHelper";
import { createDynamoDBUpdateParams } from "./lib/updateRecordHelper";
import { DynamoDBClient } from "./DynamoDBClient";

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
			const params = createDynamoDBUpdateParams(
				{
					wantsEmailNotifications: false,
				},
				recipient
			);
			promises.push(dynamoDBClient.updateUser(params));
		}

		await Promise.allSettled(promises);
	} catch (error) {
		console.error(error);
	}

	return sendOKResponse({ message: "Done!" });
};
