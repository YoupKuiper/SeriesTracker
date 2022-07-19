import aws from "aws-sdk";
import { isCorrectPassword } from "./lib/passwordHelper";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
import { signTokenFor } from "./lib/tokenHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

    try {
        // Get user from DynamoDB by EmailAddress
        const user = await dynamoDB.getItem({
            Key: aws.DynamoDB.Converter.marshall({
                "emailAddress": event.body.emailAddress
            }),
            TableName: process.env.USER_TABLE_NAME || '',
        }).promise()

        if(!user.Item){
            return sendErrorResponse('Invalid credentials');
        }

        const { hashedPassword, ...parsedUser } = aws.DynamoDB.Converter.unmarshall(user.Item)

        // Check if password is correct
        if(await isCorrectPassword(event.body.password, hashedPassword)){
            // Endcode a JWT token and return
            if(process.env.JWT_SECRET){
                const token = signTokenFor(parsedUser.emailAddress)
                
                return sendOKResponse({ token, parsedUser });
            }
            throw new Error(`Environment variable for JWT secret required`);
        }
        
        return sendErrorResponse('Invalid credentials');
    } catch (error) {
        console.error(error)
        return sendErrorResponse('Failed log in user')
    }

}
