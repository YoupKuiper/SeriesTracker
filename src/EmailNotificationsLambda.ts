const axios = require('axios').default;
import aws from "aws-sdk";
import fs from 'fs';
import { DynamoDBClient } from "./DynamoDBClient";
import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
const ses = new aws.SES({ region: process.env.AWS_REGION });


export const handler = async (event: any, context: any) => {
  console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

  try {

    if(event.debug){
      console.log('debugging..')
      return sendEmailNotificationTo('youpkuiper@gmail.com', 
      'HOUSE OF THE DRAGON, SOUTH PARK', 
      `<img src="https://image.tmdb.org/t/p/w300/iiCY2QIGSnmtVkIdjkKAfwDs0KF.jpg" alt="$HOUSE OF THE DRAGON">&nbsp;<img src="https://image.tmdb.org/t/p/w300/iiCY2QIGSnmtVkIdjkKAfwDs0KF.jpg" alt="$HOUSE OF THE DRAGON">`, true)
    }
    const dynamoDBClient = new DynamoDBClient()
    const allTrackedShowsForAllUsers = await dynamoDBClient.getAllEmailAddressesAndTrackedShows()

    // Get shows that notifications have already been sent for, 
    const alreadySentNotificationIds = await dynamoDBClient.getAlreadySentNotificationIds()
    console.log(`Already sent notifications: ${JSON.stringify(alreadySentNotificationIds)}`)

    if (!allTrackedShowsForAllUsers) {
      return;
    }

    const allTVShowsAiringToday = await getAllTVShowsAiringToday();
    const allTVShowsAiringTodayNotNotifiedYet = allTVShowsAiringToday.filter((trackedShow) => !alreadySentNotificationIds.includes(trackedShow.id))
    console.log(`All airing not notified yet: ${JSON.stringify(allTVShowsAiringTodayNotNotifiedYet)}`)

    const allNotifiedIds: number[] = [];
    let promises: Promise<any>[] = []

    for (const user of allTrackedShowsForAllUsers) {
      if (!user.trackedTVShows) {
        continue;
      }

      const trackedTVShowsAiringTodayForUser = user.trackedTVShows.filter((trackedShow) => allTVShowsAiringTodayNotNotifiedYet.find(airingToday => trackedShow.id === airingToday.id));
      if (!trackedTVShowsAiringTodayForUser) {
        continue;
      }

      let trackedTVShowsNames = '';
      let trackedTVShowsPosters = '';
      for (let [index, TVShow] of trackedTVShowsAiringTodayForUser.entries()) {
        allNotifiedIds.push(TVShow.id)
        const tvShowName = TVShow.name.toUpperCase()
        trackedTVShowsNames += index === trackedTVShowsAiringTodayForUser.length - 1 ? `AND ${tvShowName}` : `${tvShowName}, `
        trackedTVShowsPosters += `<img src="https://image.tmdb.org/t/p/w300${TVShow.poster_path}" alt="${tvShowName}">&nbsp;`
      }

      if (trackedTVShowsNames) {
        console.log(`Pushing task to send email to: ${user.emailAddress} for airing shows: ${trackedTVShowsNames}`)
        promises.push(sendEmailNotificationTo(user.emailAddress, trackedTVShowsNames, trackedTVShowsPosters))
      }
    }

    alreadySentNotificationIds ?
      promises.push(dynamoDBClient.putAlreadySentNotificationIds(allNotifiedIds)) :
      promises.push(dynamoDBClient.putAlreadySentNotificationIds([]))

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

const sendEmailNotificationTo = async (emailAddress: string, trackedTVShowsNames: string, trackedTVShowsPostersHTML: string, debug: boolean = false) => {
  if (!process.env.FROM_EMAIL_ADDRESS) {
    console.error('From email address was not set')
    return sendErrorResponse('From email address was not set')
  }

  const htmlEmail = fs.readFileSync(__dirname+'/email-template.html').toString()
    .replace(/{TVSHOWNAMES}/gi, trackedTVShowsNames)
    .replace('{POSTERS}', trackedTVShowsPostersHTML);
  const params = {
    Destination: {
      ToAddresses: [emailAddress],
    },
    Message: {
      Body: {
        Text: { Data: `Maybe posters will be shown in this email at some point` },
        Html: {
          Data: htmlEmail
        },
      },
      Subject: { Data: `Airing today: ${trackedTVShowsNames}` },
    },
    Source: process.env.FROM_EMAIL_ADDRESS,
  };
  if(debug){
    const ses = new aws.SES({ region: process.env.AWS_REGION });
    return await ses.sendEmail(params).promise()
  }
  await ses.sendEmail(params).promise()
}
