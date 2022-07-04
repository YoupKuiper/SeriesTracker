const axios = require('axios').default;

export const handler = async (event: any, context: any)=> {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    // Call movieDB to get todays airing series

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=1`);
        console.log(response);
      } catch (error) {
        console.error(error);
      }

    // Call SNS To send Email?

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world',
        }),
    };
};