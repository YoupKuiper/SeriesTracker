import aws from "aws-sdk";
const docClient = new aws.DynamoDB.DocumentClient({ region: process.env.AWS_REGION, apiVersion: '2012-08-10' });

const ALREADY_SENT_NOTIFICATIONS_RECORD_ID = 'ALREADY_SENT_NOTIFICATIONS_RECORD'

export class DynamoDBClient {

    createUserAccount = async (user) => {
        await docClient.put({
            Item: user,
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
            ConditionExpression: 'attribute_not_exists(emailAddress)'
        }).promise()
    }

    getAllUsersAndTrackedShows = async () => {
        const response = await docClient.scan({ TableName: process.env.TV_SHOWS_TABLE_NAME || '' }).promise()
        if (!response.Items) {
            console.error('NO TRACKED TV SHOWS FOUND AT ALL')
        }

        console.log(`RESPONSE: ${JSON.stringify(response.Items)}`)

        return response.Items
    }

    getTVShowsByEmailAddress = async (emailAddress: string) => {
        // Get TVShows from DynamoDB by EmailAddress
        const { Item } = await docClient.get({
            Key: { emailAddress },
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        if (!Item) {
            // No record found, return empty list
            console.log(`DB record not found`)
            return []
        }

        return Item.trackedTVShows
    }

    getAlreadySentNotificationIds = async () => {
        // Get already sent notification record from DynamoDB by EmailAddress
        const { Item } = await docClient.get({
            Key: { emailAddress: ALREADY_SENT_NOTIFICATIONS_RECORD_ID },
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        if (!Item) {
            // No record found, return empty list
            console.log(`DB record not found`)
            return []
        }

        return Item.idList
    }

    putAlreadySentNotificationIds = async (idList: number[]) => {
        await docClient.put({
            Item: { emailAddress: ALREADY_SENT_NOTIFICATIONS_RECORD_ID, idList },
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()
    }
}