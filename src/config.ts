export const config = { 
    apiKey: {
        tmdb: process.env.TMDB_API_KEY,
        omdb: process.env.OMDB_API_KEY
    },
    clients: {
        twitter: {
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET
        },
        instagram: {
            username: process.env.INSTAGRAM_USERNAME,
            password: process.env.INSTAGRAM_PASSWORD
        }
    }
}