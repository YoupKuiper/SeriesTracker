const axios = require('axios').default;
var aws = require("aws-sdk");
var ses = new aws.SES({ region: process.env.AWS_REGION });

export const handler = async (event: any, context: any)=> {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    // Hardcoded list of series to track
    const seriesToTrack = [202740, 133985, 107116, 205118]

    try {
        // Call movieDB to get todays airing series
        const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=1`);

        let promises = [];

        console.log(`Total pages of series airing today: ${response.data.total_pages}`)

        for (let pageNumber = 1; pageNumber < response.data.total_pages+1; pageNumber++){
            promises.push(getSeriesFor(pageNumber))
        }

        const allSeriesAiringTodayPaged = await Promise.all(promises);
        const allSeriesAiringToday = Array.prototype.concat.apply([], allSeriesAiringTodayPaged);

        const trackedSeriesAiringToday = allSeriesAiringToday.filter(series => {
            return seriesToTrack.includes(series.id)
        })
        
        console.log(`Tracked series found: ${JSON.stringify(trackedSeriesAiringToday)}`)

        let trackedSeriesNames = '';
        for (let [index, series] of trackedSeriesAiringToday.entries()) {
          trackedSeriesNames = index === trackedSeriesAiringToday.length - 1 ? `${series.name.toUpperCase()}` : `${series.name.toUpperCase()}, `
        }
        // Send emails for every tracked series thats airing today
        var params = {
            Destination: {
              ToAddresses: [process.env.VERIFIED_EMAIL_ADDRESS],
            },
            Message: {
              Body: {
                Text: { Data: `Maybe posters will be shown in this email at some point` },
              },
        
              Subject: { Data: `Airing today: ${trackedSeriesNames}` },
            },
            Source: process.env.VERIFIED_EMAIL_ADDRESS,
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


const getSeriesFor = async (pageNumber: number) => {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=${pageNumber}`)
    return response.data.results;
}