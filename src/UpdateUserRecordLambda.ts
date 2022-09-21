import { DynamoDBClient } from "./DynamoDBClient";
import { createPasswordHash } from "./lib/passwordHelper";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { createRandomString, isValid } from "./lib/tokenHelper";
import { UserUpdateObject } from "./lib/types";
import { createDynamoDBUpdateParams } from "./lib/updateRecordHelper";

export const handler = async (event: any, context: any) => {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);
    const dynamoDBClient = new DynamoDBClient()

    try {
        let updateObject: any = {}
        const isUnsubscribeFromEmailsRequest = parsedEvent.emailAddress && parsedEvent.unsubscribeEmailToken
        const isResetPasswordRequest = parsedEvent.emailAddress && parsedEvent.newPassword && parsedEvent.resetPasswordToken

        if (isUnsubscribeFromEmailsRequest) {
            updateObject = {
                wantsEmailNotifications: false,
                unsubscribeEmailToken: createRandomString()
            }
            const params = createDynamoDBUpdateParams(updateObject, parsedEvent.emailAddress, updateObject.unsubscribeEmailToken, 'unsubscribeEmailToken')
            await dynamoDBClient.updateUser(params);
            return sendOKResponse('Great success!')
        }

        if (isResetPasswordRequest) {
            updateObject = {
                hashedPassword: await createPasswordHash(parsedEvent.newPassword),
                resetPasswordToken: createRandomString()
            }

            const params = createDynamoDBUpdateParams(updateObject, parsedEvent.emailAddress, updateObject.resetPasswordToken, 'resetPasswordToken')
            await dynamoDBClient.updateUser(params);
            return sendOKResponse('Great success!')
        }

        // Check if token is valid
        const decodedToken = isValid(parsedEvent.token);
        updateObject = UserUpdateObject.parse(parsedEvent.updateObject)
        const params = createDynamoDBUpdateParams(parsedEvent.updateObject, decodedToken['data']['emailAddress'])
        const updatedUser = await dynamoDBClient.updateUser(params);
        if (!updatedUser) {
            return sendErrorResponse('Failed to update user data')
        }
        // Return user without sensitive data
        const { hashedPassword, unsubscribeEmailToken, resetPasswordToken, ...userWithoutPassword } = updatedUser;

        console.log(`Updated item: ${JSON.stringify(userWithoutPassword)}`)
        return sendOKResponse(userWithoutPassword)

    } catch (error) {
        console.error(error)
        return sendErrorResponse('Failed to update user data')
    }
}


