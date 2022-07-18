const axios = require('axios').default;
import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });


export const handler = async (event: any, context: any)=> {
  console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    try {

        const user = await new DynamoDBClient().getUserFromDynamoDBByEmailAddress(process.env.VERIFIED_EMAIL_ADDRESS || '');
        console.log(`USER: ${JSON.stringify(user)}`)
        if(!user){
          throw new Error(`Failed to get user from DB`);
        }

        const tvShowsToTrack = user['settings']['trackedTVShows']
        console.log(`TV Shows to track ${tvShowsToTrack}`)


        // Call movieDB to get todays airing tv shows
        const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=1`);

        let promises : Promise<any>[] = []

        console.log(`Total pages of tv shows airing today: ${response.data.total_pages}`)

        for (let pageNumber = 1; pageNumber < response.data.total_pages+1; pageNumber++){
            promises.push(getTVShowsFor(pageNumber))
        }

        const allTVShowsAiringTodayPaged = await Promise.all(promises);
        const allTVShowsAiringToday = Array.prototype.concat.apply([], allTVShowsAiringTodayPaged);

        const trackedTVShowsAiringToday = allTVShowsAiringToday.filter(TVShow => {
            return tvShowsToTrack.includes(TVShow.id)
        })
        
        console.log(`Tracked tv shows found: ${JSON.stringify(trackedTVShowsAiringToday)}`)
        if(!trackedTVShowsAiringToday){
          return sendOKResponse('No tracked shows airing today')
        }

        let trackedTVShowsNames = '';
        for (let [index, TVShow] of trackedTVShowsAiringToday.entries()) {
          trackedTVShowsNames = index === trackedTVShowsAiringToday.length - 1 ? `${TVShow.name.toUpperCase()}` : `${TVShow.name.toUpperCase()}, `
        }
        // Send emails for every tracked TVShow thats airing today
        var params = {
            Destination: {
              ToAddresses: [process.env.VERIFIED_EMAIL_ADDRESS || ''],
            },
            Message: {
              Body: {
                Text: { Data: `Maybe posters will be shown in this email at some point` },
              },
        
              Subject: { Data: `Airing today: ${trackedTVShowsNames}` },
            },
            Source: process.env.VERIFIED_EMAIL_ADDRESS || '',
          };
         
          const sendEmailResponse = await ses.sendEmail(params).promise()
          console.log(sendEmailResponse)

          return sendOKResponse('Emails sent successfully')

      } catch (error) {
        console.error(error);
        return sendErrorResponse('Failed to send email')
      }
};


const getTVShowsFor = async (pageNumber: number) => {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=${pageNumber}`)
    return response.data.results;
}
