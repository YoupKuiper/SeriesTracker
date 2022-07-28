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
        const { Item }  = await docClient.get({
            Key: { emailAddress },
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        if(!Item){
            // No record found, return empty list
            console.log(`DB record not found`)
            return []
        }

        return Item.trackedTVShows
    }

    
}