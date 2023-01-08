import { sendOKResponse } from "./lib/responseHelper";

export const handler = async (event: any, context: any) => {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    try {
        const parsedMessage = JSON.parse(parsedEvent.Message)
        console.log(parsedMessage)
    } catch (error) {
        console.log(error)
    }

    return sendOKResponse('Done!')
}


