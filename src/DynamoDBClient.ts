import aws from "aws-sdk";
const docClient = new aws.DynamoDB.DocumentClient({region: process.env.AWS_REGION, apiVersion: '2012-08-10'});


export class DynamoDBClient {

    getAllEmailAddressesAndTrackedShows = async () => {
        const response = await docClient.scan({ TableName: process.env.TV_SHOWS_TABLE_NAME || ''}).promise()
        if(!response.Items){
            console.error('NO TRACKED TV SHOWS FOUND AT ALL')
        }

        console.log(`RESPONSE: ${JSON.stringify(response.Items)}`)

        return response.Items
    }

    getTVShowsByEmailAddress = async (emailAddress: string) => {
        // Get TVShows from DynamoDB by EmailAddress
        const tvShows = await docClient.get({
            Key: aws.DynamoDB.Converter.marshall({
                "emailAddress": emailAddress
            }),
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        if(!tvShows.Item){
            // No TV shows found, return empty list
            return []
        }

        return tvShows.Item.trackedTVShows
    }

    
}