import aws from "aws-sdk";
import Crypto from 'crypto';
import { DynamoDBClient } from "./DynamoDBClient";
import { createPasswordHash } from "./lib/passwordHelper";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any) => {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    try {
        // Create hash from password
        const hashedPassword = await createPasswordHash(parsedEvent.password);
        const RANDOM_STRING_SIZE = 21
        const unsubscribeEmailToken = Crypto.randomBytes(RANDOM_STRING_SIZE).toString('base64').slice(0, RANDOM_STRING_SIZE)
        // Save unverified user to dynamodb
        const user = {
            emailAddress: parsedEvent.emailAddress.toLowerCase(),
            hashedPassword: hashedPassword,
            unsubscribeEmailToken: unsubscribeEmailToken,
            settings: {
                wantsEmailNotifications: true,
                emailAddressVerified: false,
            }
        }

        await new DynamoDBClient().createUserAccount(user)

        // Send verification email
        var verificationParams = {
            EmailAddress: parsedEvent.emailAddress
        };
        await ses.verifyEmailIdentity(verificationParams).promise();

        return sendOKResponse('Account created')

    } catch (error) {
        console.error(error)
        return sendErrorResponse('Account creation failed')
    }
}
