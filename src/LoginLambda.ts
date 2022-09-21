import aws from "aws-sdk";
import { isCorrectPassword } from "./lib/passwordHelper";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { signTokenFor } from "./lib/tokenHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    const { password, emailAddress } = parsedEvent

    console.log(`Email address: ${emailAddress}`)

    try {
        // Get user from DynamoDB by EmailAddress
        const userDto = await dynamoDB.getItem({
            Key: aws.DynamoDB.Converter.marshall({
                "emailAddress": emailAddress
            }),
            TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        }).promise()

        if(!userDto.Item){
            console.log(`Invalid credentials`)
            return sendErrorResponse('Invalid credentials');
        }

        const { hashedPassword, unsubscribeEmailToken, resetPasswordToken, ...user } = aws.DynamoDB.Converter.unmarshall(userDto.Item)

        // Check if password is correct
        if(await isCorrectPassword(password, hashedPassword)){
            // Endcode a JWT token and return
            if(process.env.JWT_SECRET){
                const token = signTokenFor(user.emailAddress, user.wantsEmailNotifications)
                
                console.log(`Login successful`)
                return sendOKResponse({ token, user });
            }
            throw new Error(`Environment variable for JWT secret required`);
        }
        
        console.log(`Invalid credentials`)
        return sendErrorResponse('Invalid credentials');
    } catch (error) {
        console.error(error)
        return sendErrorResponse('Failed log in user')
    }

}
