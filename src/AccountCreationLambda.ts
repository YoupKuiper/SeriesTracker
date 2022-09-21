import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { createPasswordHash } from "./lib/passwordHelper";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { createRandomString } from "./lib/tokenHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any) => {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    try {
        // Create hash from password
        const user = {
            emailAddress: parsedEvent.emailAddress.toLowerCase(),
            hashedPassword: await createPasswordHash(parsedEvent.password),
            unsubscribeEmailToken: createRandomString(),
            resetPasswordToken: createRandomString(),
            wantsEmailNotifications: true,
            emailAddressVerified: false
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
