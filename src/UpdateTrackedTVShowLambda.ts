import aws from "aws-sdk";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { isValid } from "./lib/tokenHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any) => {
	console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

	const parsedEvent = JSON.parse(event.body);
	console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

	const { token, tvShowsList } = parsedEvent;

	try {
		// Check if token is valid
		const decodedToken = isValid(token);

		// TODO: Prevent this from overwriting user data, use update?
		await dynamoDB
			.putItem({
				Item: aws.DynamoDB.Converter.marshall({
					emailAddress: decodedToken.data.emailAddress,
					trackedTVShows: tvShowsList,
				}),
				TableName: process.env.TV_SHOWS_TABLE_NAME || "",
			})
			.promise();

		return sendOKResponse(tvShowsList);
	} catch (error) {
		console.error(error);
		return sendErrorResponse({ message: "Failed log in user" });
	}
};
