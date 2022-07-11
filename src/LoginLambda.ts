import aws from "aws-sdk";
import { isCorrectPassword } from "./lib/passwordHelper";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

    try {
        // Get user from DynamoDB by EmailAddress
        const user = await dynamoDB.getItem({
            Key: aws.DynamoDB.Converter.marshall({
                "EmailAddress": event.body.username
            }),
            TableName: process.env.USER_TABLE_NAME || '',
        }).promise() || {}

        console.log(`USER: ${JSON.stringify(user)}`)
        const parsedUser = aws.DynamoDB.Converter.unmarshall(user.Item ? user.Item : {})
        console.log(`UNMARSHALLED USER: ${JSON.stringify(parsedUser)}`)

        // // Check if password is correct
        // if(await isCorrectPassword(event.body.password, user.Item?.hashedPassword)){
        //     // Endcode a JWT token and return
        // }
    } catch (error) {
        console.log(error)
    }

}
