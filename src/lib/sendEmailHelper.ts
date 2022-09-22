import aws from "aws-sdk";
const ses = new aws.SES({ region: process.env.AWS_REGION });

export const sendEmail = async (fromAddress: string, toAddress: string, subject: string, htmlContent: string, textContent: string) => {
    const params = {
        Destination: {
            ToAddresses: [toAddress],
        },
        Message: {
            Body: {
                Text: { Data: textContent },
                Html: {
                    Data: htmlContent
                },
            },
            Subject: { Data: subject },
        },
        Source: fromAddress,
    };
    await ses.sendEmail(params).promise()
}