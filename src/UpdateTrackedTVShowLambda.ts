import aws from "aws-sdk";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { isValid } from "./lib/tokenHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    const { token, tvShowsList } = parsedEvent

    try {
        // Check if token is valid
        const decodedToken = isValid(token);
        
        // Get TVShows from DynamoDB by EmailAddress
        const newListOfTrackedTVShows = await dynamoDB.putItem({
            Item: aws.DynamoDB.Converter.marshall({
                "emailAddress": decodedToken.data.emailAddress,
                "trackedTVShows": tvShowsList
            }),
            ReturnValues: "ALL_NEW",
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        console.log(`New list of tracked TV Shows: ${JSON.stringify(newListOfTrackedTVShows)}`)

        if(!newListOfTrackedTVShows.Attributes){
            // No TV shows found, return empty list
            return sendOKResponse({
                trackedTvShows: []
            });
        }

        return sendOKResponse(aws.DynamoDB.Converter.unmarshall(newListOfTrackedTVShows.Attributes).trackedTvShows)     
    } catch (error) {
        console.error(error)
        return sendErrorResponse('Failed log in user')
    }

}