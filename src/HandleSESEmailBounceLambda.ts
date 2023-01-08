import { sendOKResponse } from "./lib/responseHelper";

export const handler = async (event: any, context: any) => {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);
    
    try {
        const parsedMessage = JSON.parse(parsedEvent.Message)
        console.log(parsedMessage)
        if(parsedMessage.bounce.bounceType === 'Permanent'){
            // We never want to email this person again, remove from DB (add to blocklist??)
        }else{
            // Update the amount of soft bounces for this email address

            // If the soft bounce count is over x, unsubscribe the email address
            
        }
    } catch (error) {
        console.log(error)
    }

    return sendOKResponse('Done!')
}


