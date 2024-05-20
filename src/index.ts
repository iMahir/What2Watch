import dotenv from 'dotenv';
dotenv.config();

import { config } from './config';
import axios from 'axios';
import { getSimilarMovies } from './module/bestSimilar/search';
import { getMovieById, getMovieByTitle } from './module/tmdb/movie';
import { writeFileSync } from 'fs';
import { createRatingPoster } from './image/ratingPoster';
import { createMainPoster } from './image/mainPoster';
import { postToTwitter } from './clients/twitter';
import { instagramHandler } from './clients/instagram';


(async () => {

   // const movie = await getSimilarMovies("The Prestige" , "2006");

   
    // await postToTwitter(null as any);

    instagramHandler()

})();