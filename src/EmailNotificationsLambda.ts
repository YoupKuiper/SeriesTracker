const axios = require('axios').default;
import aws from "aws-sdk";
const ses = new aws.SES({ region: process.env.AWS_REGION });


export const handler = async (event: any, context: any)=> {
  console.log(`Incoming event body: ${JSON.stringify(event.body)}`)

    // Hardcoded list of tv shows to track
    const TVShowsToTrack = [202740, 133985, 107116, 205118]

    try {
        // Call movieDB to get todays airing tv shows
        const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=1`);

        let promises = [];

        console.log(`Total pages of tv shows airing today: ${response.data.total_pages}`)

        for (let pageNumber = 1; pageNumber < response.data.total_pages+1; pageNumber++){
            promises.push(getTVShowsFor(pageNumber))
        }

        const allTVShowsAiringTodayPaged = await Promise.all(promises);
        const allTVShowsAiringToday = Array.prototype.concat.apply([], allTVShowsAiringTodayPaged);

        const trackedTVShowsAiringToday = allTVShowsAiringToday.filter(TVShow => {
            return TVShowsToTrack.includes(TVShow.id)
        })
        
        console.log(`Tracked tv shows found: ${JSON.stringify(trackedTVShowsAiringToday)}`)

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

      } catch (error) {
        console.error(error);
      }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world',
        }),
    };
};


const getTVShowsFor = async (pageNumber: number) => {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=${pageNumber}`)
    return response.data.results;
}
