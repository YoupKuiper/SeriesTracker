import aws from "aws-sdk";
import { isCorrectPassword } from "./lib/passwordHelper";
import jwt from 'jsonwebtoken';
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
            return {
                statusCode: '400',
                body: 'Invalid credentials'
            }
        }

        const parsedUser = aws.DynamoDB.Converter.unmarshall(user.Item)

        // Check if password is correct
        if(await isCorrectPassword(event.body.password, parsedUser.hashedPassword)){
            // Endcode a JWT token and return
            if(process.env.JWT_SECRET){
                const token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (60 * 60), //expire after 1 hour
                    data: { emailAddress: parsedUser.emailAddress }
                  }, process.env.JWT_SECRET);

                  return {
                    statusCode: '200',
                    body: JSON.stringify({token})
                  }
            }
            throw new Error(`Environment variable for JWT secret required`);
        }
    } catch (error) {
        console.log(error)
    }

}
