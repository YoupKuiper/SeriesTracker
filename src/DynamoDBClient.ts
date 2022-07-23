import aws from "aws-sdk";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export class DynamoDBClient {

    getTVShowsByEmailAddress = async (emailAddress: string) => {
        // Get TVShows from DynamoDB by EmailAddress
        const tvShows = await dynamoDB.getItem({
            Key: aws.DynamoDB.Converter.marshall({
                "emailAddress": emailAddress
            }),
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        if(!tvShows.Item){
            // No TV shows found, return empty list
            return []
        }

        return aws.DynamoDB.Converter.unmarshall(tvShows.Item).trackedTVShows
    }

    
}