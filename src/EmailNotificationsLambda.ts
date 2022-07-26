const axios = require('axios').default;
import aws from "aws-sdk";
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });


export const handler = async (event: any, context: any) => {
  console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

  try {

    const allTrackedShowsForAllUsers = await new DynamoDBClient().getAllEmailAddressesAndTrackedShows()

    if (!allTrackedShowsForAllUsers) {
      return;
    }

    const allTVShowsAiringToday = await getAllTVShowsAiringToday();
    let promises: Promise<any>[] = []

    for (const user of allTrackedShowsForAllUsers) {
      if (!user.trackedTVShows) {
        continue;
      }

      const trackedTVShowsAiringTodayForUser = user.trackedTVShows.filter((trackedShow) => allTVShowsAiringToday.find(airingToday => trackedShow.id === airingToday.id));
      if (!trackedTVShowsAiringTodayForUser) {
        continue;
      }

      let trackedTVShowsNames = '';
      for (let [index, TVShow] of trackedTVShowsAiringTodayForUser.entries()) {
        trackedTVShowsNames = index === trackedTVShowsAiringTodayForUser.length - 1 ? `${TVShow.name.toUpperCase()}` : `${TVShow.name.toUpperCase()}, `
      }

      if(trackedTVShowsNames){
        promises.push(sendEmailNotificationTo(user.emailAddress, trackedTVShowsNames))
      }
    }

    await Promise.allSettled(promises);

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

const getAllTVShowsAiringToday = async () => {
  // Call movieDB to get todays airing tv shows
  const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=1`);

  let promises: Promise<any>[] = []
  console.log(`Total pages of tv shows airing today: ${response.data.total_pages}`)

  for (let pageNumber = 1; pageNumber < response.data.total_pages + 1; pageNumber++) {
    promises.push(getTVShowsFor(pageNumber))
  }

  const allTVShowsAiringTodayPaged = await Promise.all(promises);
  return Array.prototype.concat.apply([], allTVShowsAiringTodayPaged);
}

const sendEmailNotificationTo = async (emailAddress: string, trackedTVShowsNames: string) => {
  const params = {
    Destination: {
      ToAddresses: [emailAddress],
    },
    Message: {
      Body: {
        Text: { Data: `Maybe posters will be shown in this email at some point` },
      },

      Subject: { Data: `Airing today: ${trackedTVShowsNames}` },
    },
    Source: emailAddress,
  };
  await ses.sendEmail(params).promise()
}
