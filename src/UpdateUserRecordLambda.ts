import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { isValid } from "./lib/tokenHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any) => {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);
    const dynamoDBClient = new DynamoDBClient()

    try {
        if (parsedEvent.emailAddress && parsedEvent.unsubscribeEmailToken) {
            const user = await dynamoDBClient.getUserByEmailAddress(parsedEvent.emailAddress);
            if (user.unsubscribeEmailToken !== parsedEvent.unsubscribeEmailToken){
                return sendErrorResponse('Invalid token')
            }
            const unsubscribeEditParams = {
                "TableName": "TVShowsTable",
                "Key": {
                    "emailAddress": parsedEvent.emailAddress
                },
                "ExpressionAttributeValues": {
                    ":settings": {
                        "emailAddressVerified": true,
                        "wantsEmailNotifications": false
                    },
                },
                "ExpressionAttributeNames": {
                    "#settings": "settings"
                },
                "UpdateExpression": "set #settings = :settings",
                "ReturnValues": "ALL_NEW"
            }
            await new DynamoDBClient().updateUser(unsubscribeEditParams)
            return sendOKResponse('Great success!')
        }
        // Check if token is valid
        const decodedToken = isValid(parsedEvent.token);

        // If valid user record data, put to DB
        let params = {
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
            Key: {},
            ExpressionAttributeValues: {},
            ExpressionAttributeNames: {},
            UpdateExpression: "",
            ReturnValues: "ALL_NEW"
        };

        const idAttributeName = 'emailAddress'
        params["Key"][idAttributeName] = decodedToken["data"][idAttributeName];

        let prefix = "set ";
        const updateParams = parsedEvent.updateObject
        console.log(`Update params: ${JSON.stringify(updateParams)}`)
        let attributes = Object.keys(updateParams);

        for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];
            // Prevent emailAddress, password and token to be updated
            if (attribute != idAttributeName && attribute != 'hashedPassword' && attribute != 'unsubscribeEmailToken') {
                params["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute;
                params["ExpressionAttributeValues"][":" + attribute] = parsedEvent.updateObject[attribute];
                params["ExpressionAttributeNames"]["#" + attribute] = attribute;
                prefix = ", ";
            }
        }

        console.log(`Params after running through loop ${JSON.stringify(params)}`)

        const updatedUser = await dynamoDBClient.updateUser(params);
        if (!updatedUser) {
            return sendErrorResponse('Failed to update user data')
        }

        const { hashedPassword, unsubscribeEmailToken, ...userWithoutPassword } = updatedUser;


        console.log(`Updated item: ${JSON.stringify(userWithoutPassword)}`)
        return sendOKResponse(userWithoutPassword)

    } catch (error) {
        console.error(error)
        return sendErrorResponse('Failed to update user data')
    }
}
