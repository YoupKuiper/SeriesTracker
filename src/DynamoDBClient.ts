import aws from "aws-sdk";
const dynamoDB = new aws.DynamoDB({ region: process.env.AWS_REGION });

export class DynamoDBClient {

    getUserFromDynamoDBByEmailAddress = async (emailAddress: string) => {
        // Get user from DynamoDB by EmailAddress
        const user = await dynamoDB.getItem({
            Key: aws.DynamoDB.Converter.marshall({
                "emailAddress": emailAddress
            }),
            TableName: process.env.USER_TABLE_NAME || '',
        }).promise()

        if(!user.Item){
            return null
        }

        return aws.DynamoDB.Converter.unmarshall(user.Item);
    }
}