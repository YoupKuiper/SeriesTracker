import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { isValid } from "./lib/tokenHelper";
import jwt from 'jsonwebtoken';
import { TVShow } from "./lib/types";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    const { token, searchString } = parsedEvent

    try {
        // Check if token is valid
        const decodedToken = isValid(token);
        
        const user = await new DynamoDBClient().getUserByEmailAddress(decodedToken.data.emailAddress)

        if(!user.trackedTVShows){
            console.log(`No tv shows found, returning: []}`)
            // No TV shows found, return empty list
            return sendOKResponse([]);
        }

        const showsToReturn = user.trackedTVShows.filter((tvShow: TVShow) => tvShow.name.toLowerCase().includes(searchString.toLowerCase()))

        console.log(`Returning found tv shows: ${JSON.stringify(showsToReturn)}`)
        return sendOKResponse(showsToReturn)     
    } catch (error) {
        console.error(error)
        if(error instanceof jwt.TokenExpiredError) {
            return sendErrorResponse('Failed log in user')
        }
        return sendErrorResponse('Failed to get tracked TV Shows')
    }

}
