import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { isValid } from "./lib/tokenHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    const { token } = parsedEvent

    try {
        // Check if token is valid
        const decodedToken = isValid(token);
        
        const trackedTVShows = await new DynamoDBClient().getTVShowsByEmailAddress(decodedToken.data.emailAddress)

        if(!trackedTVShows){
            // No TV shows found, return empty list
            return sendOKResponse({
                trackedTvShows: []
            });
        }

        return sendOKResponse(trackedTVShows)     
    } catch (error) {
        console.error(error)
        return sendErrorResponse('Failed log in user')
    }

}
