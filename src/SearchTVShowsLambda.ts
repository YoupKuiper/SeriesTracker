import { sendErrorResponse, sendOKResponse } from "./lib/responseHelper";
const axios = require('axios').default;

export const handler = async (event: any, context: any)=> {
    console.log(`Incoming event body: ${JSON.stringify(event.body)}`);

    const parsedEvent = JSON.parse(event.body);
    console.log(`Parsed event body: ${JSON.stringify(parsedEvent)}`);

    try {

        let tvShowsToReturn: any[] = []
        if(parsedEvent.getDetails && parsedEvent.tvShowsIds){
            const tvShowsIds = parsedEvent.tvShowsIds;
            let promises: Promise<any>[] = [];
            for (let i = 0; i < parsedEvent.tvShowsIds.length; i++) {
                promises.push(getDetailsForTVShow(tvShowsIds[i]))
            }
            const tvShowsDetailsForIds = await Promise.allSettled(promises);
            return sendOKResponse(tvShowsDetailsForIds);
        }
        if(parsedEvent.searchString){
            tvShowsToReturn = await searchTVShows(parsedEvent.searchString);
        }else{
            //Empty search string, get popular
            let promises: Promise<any>[] = []
            for (let i = 1; i < 6; i++) {
                promises.push(getPopularTVShowsForPageNumber(i))
            }
            const allFetchedPopularTVShowsPaged = await Promise.all(promises);
            const allFetchedPopularTVShows = Array.prototype.concat.apply([], allFetchedPopularTVShowsPaged);
            const allEnglishSpokenTVShows = allFetchedPopularTVShows.filter((tvShow) => tvShow.original_language === 'en')
            const allTVShowsSorted = allEnglishSpokenTVShows.sort((a,b) => b.popularity - a.popularity)
            tvShowsToReturn = allTVShowsSorted.slice(0, 20);
        }
        console.log(`Returning found tv shows: ${JSON.stringify(tvShowsToReturn)}`)
        return sendOKResponse(tvShowsToReturn)     
    } catch (error) {
        console.error(JSON.stringify(error))
        return sendErrorResponse('Failed to get searched TV Shows')
    }

}

const getPopularTVShowsForPageNumber = async (number: number) => {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${process.env.THE_MOVIE_DB_TOKEN}&language=en-US&page=${number}`)
    return response.data.results;
}

const searchTVShows = async (title: number) => {
    const response = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.THE_MOVIE_DB_TOKEN}&query=${encodeURIComponent(title)}`)
    return response.data.results;
}

const getDetailsForTVShow = async (id: number) => {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.THE_MOVIE_DB_TOKEN}`)
    return response.data;
}
