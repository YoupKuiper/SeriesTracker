import aws from "aws-sdk";
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
        
        // Get TVShows from DynamoDB by EmailAddress
        const tvShows = await dynamoDB.getItem({
            Key: aws.DynamoDB.Converter.marshall({
                "emailAddress": decodedToken.data.emailAddress
            }),
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        if(!tvShows.Item){
            // No TV shows found, return empty list
            return sendOKResponse({
                trackedTvShows: []
            });
        }

        console.log(`Found item: ${JSON.stringify(tvShows.Item)}`)

        return sendOKResponse(aws.DynamoDB.Converter.unmarshall(tvShows.Item).trackedTvShows)     
    } catch (error) {
        console.error(error)
        return sendErrorResponse('Failed log in user')
    }

}
