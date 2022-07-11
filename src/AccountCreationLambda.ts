import aws from "aws-sdk";
import { createPasswordHash } from "./lib/passwordHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`)
    
    try {
        // Create hash from password
        const hashedPassword = await createPasswordHash(event.body.password);

        // Save unverified user to dynamodb
        const record = {
            Item: aws.DynamoDB.Converter.marshall({
                "emailAddress":  event.body.username,
                "hashedPassword": hashedPassword,
                "emailAddressVerified": false,
                "settings": {
                    "wantsEmailNotifications": false,
                    "trackedTVShows": [] 
                }
            }),
            ReturnConsumedCapacity: "TOTAL", 
            TableName: process.env.USER_TABLE_NAME || '',
            ConditionExpression: 'attribute_not_exists(emailAddress)'
        };

        await dynamoDB.putItem(record).promise()

        // Send verification email
        var verificationParams = {
            EmailAddress: event.body.username
        };
        await ses.verifyEmailIdentity(verificationParams).promise();

    } catch (error) {
        console.log(error)
    }
}
