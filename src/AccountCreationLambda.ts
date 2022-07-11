import aws from "aws-sdk";
import { createPasswordHash } from "./lib/passwordHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${event.body}`)
    
    try {
        // Create hash from password
        const hashedPassword = await createPasswordHash(event.body.password);

        // Save unverified user to dynamodb
        const record = {
            Item: aws.DynamoDB.Converter.marshall({
                "EmailAddress":  event.body.username,
                "HashedPassword": hashedPassword,
                "EmailAddressVerified": false,
                "Settings": {
                    "WantsEmailNotifications": false,
                    "TrackedTVShows": [] 
                }
            }),
            ReturnConsumedCapacity: "TOTAL", 
            TableName: process.env.USER_TABLE_NAME || ''
        };


            await dynamoDB.putItem(record).promise()
    } catch (error) {
        console.log(error)
    }



    // Send verification email
}
