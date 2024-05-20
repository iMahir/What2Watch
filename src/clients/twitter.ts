import { EDirectMessageEventTypeV1, ETwitterStreamEvent, TwitterApi } from "twitter-api-v2";
import { SimilarMoviesData } from "../module/bestSimilar/search";
import { config } from "../config";
import { createMainPoster } from "../image/mainPoster";
import { createRatingPoster } from "../image/ratingPoster";

const twitterClient = new TwitterApi({
    appKey: config.clients.twitter.appKey ?? "",
    appSecret: config.clients.twitter.appSecret ?? "",
    accessToken: config.clients.twitter.accessToken ?? "",
    accessSecret: config.clients.twitter.accessSecret ?? "",
});


export const postToTwitter = async (data: SimilarMoviesData) => {

    const mainPoster = await createMainPoster(data.movie);

    const mainText = `Best movies like: ${data.movie.title} (${data.movie.release_date.split("-")[0]})\n\n\n🧵 A thread...`;

    const mainMediaId = await twitterClient.v1.uploadMedia(Buffer.from(mainPoster, "base64"), { mimeType: "image/jpeg" });

    const followUpTweets = await Promise.all(data.similar.slice(0, 10).map(async (movie) => {
        const poster = await createRatingPoster(movie);
        const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(poster, "base64"), { mimeType: "image/jpeg" });
        return { media: { media_ids: [mediaId] }, text: `${movie.tmdb.title} (${movie.tmdb.release_date.split("-")[0]})` }
    }));

    const mainTweet = await twitterClient.v2.tweetThread([
        {
            text: mainText,
            media: { media_ids: [mainMediaId] }
        },
        ...followUpTweets
    ])


    console.log("Main tweet posted: ", mainTweet);

}