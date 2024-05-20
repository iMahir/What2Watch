import axios from "axios";
import { load } from "cheerio";
import { getMovieById, getMovieByTitle } from "../tmdb/movie";
import { OMDB_MovieData, getMovieByTitle_OMDB } from "../omdb/movie";
import { TMDB_Movie, TMDB_Movie_Search_Response } from "../tmdb/types";

const baseUrl = "https://bestsimilar.com";

interface SearchMovieResponse {
    id: string;
    label: string;
    thumb: string;
    url: string;
};

interface SimilarMovie {
    title: string;
    year: string;
    rating: string;
    similarity: string;
};

export const searchMovie = async (title: string, year: string | number) => {
    const search = await axios.get(`${baseUrl}/movies/autocomplete?term=${title}`);
    const searchRes: SearchMovieResponse[] = search.data;

    const targetMovie = searchRes.find((movie) => movie.label.toLowerCase() === `${title} (${year})`.toLowerCase());

    if (!targetMovie) {
        return null;
    }

    return targetMovie;
};

const similarMovies = async (id: string) => {

    const moviePage = await axios.get(`${baseUrl}/movies/${id}`);
    const $ = load(moviePage.data);

    const movies: SimilarMovie[] = [];

    $('#movie-rel-list .item-small').each((index, element) => {
        const fullTitle = $(element).find('.item-name .name').text().trim();
        const title = fullTitle.replace(/\s*\(\d{4}\)$/, ''); // Remove the year from the title

        const year = fullTitle.match(/\((\d{4})\)$/)?.[1] || '';
        const rating = $(element).find('.rat-rating span[title="rating"]').text().trim();
        const similarity = $(element).find('.smt-value').text().trim();

        movies.push({ title, year, rating, similarity });
    });

    return movies;
}


const convertBestSimilarToTMDB = async (bestSimilarMovie: SimilarMovie) => {
    const tmdbMovie = await getMovieByTitle(bestSimilarMovie.title, bestSimilarMovie.year);
    const tmdbId = tmdbMovie?.results![0]?.id;
    if (tmdbId) return await getMovieById(tmdbId);
    else return null;
}

const convertBestSimilarToOMDB = async (bestSimilarMovie: SimilarMovie) => {
    const omdbMovie = await getMovieByTitle_OMDB(bestSimilarMovie.title, bestSimilarMovie.year);
    return omdbMovie;
}

export interface SimilarMoviesInfo {
    tmdb: TMDB_Movie;
    omdb: OMDB_MovieData;
    bestSimilar: SimilarMovie;
};

export interface SimilarMoviesData {
    movie: TMDB_Movie;
    similar: SimilarMoviesInfo[]
};


export const getSimilarMovies = async (title: string, year?: string | number): Promise<SimilarMoviesData | null> => {

    const targetMovie = await getMovieByTitle(title, year);
    // console.log(targetMovie);
    if (!targetMovie?.results![0]) {
        return null;
    }

    const movieData = await getMovieById(targetMovie.results![0].id);

    const movie = await searchMovie(movieData.title, movieData.release_date.split("-")[0]);
    if (!movie) {
        return null;
    }
    const bestSimilarMovies = await similarMovies(movie.id);

    const movies = await Promise.all(bestSimilarMovies.map(async (movie) => {
        const tmdb = await convertBestSimilarToTMDB(movie);
        const omdb = await convertBestSimilarToOMDB(movie);
        if (tmdb && omdb) return { tmdb, omdb, bestSimilar: movie };
        else return null;
    }));

    return {
        movie: movieData,
        similar: movies as unknown as SimilarMoviesData["similar"]
    }
};

export const getMovieStats = async (title: string, year?: string | number) => {
    const searchMovie = await getMovieByTitle(title, year);
    if (!searchMovie) return null;

    const tmdb = await getMovieById(searchMovie.results![0].id);

    const dummyData = {
        title: tmdb.title,
        year: tmdb.release_date.split("-")[0],
        rating: tmdb.vote_average.toString(),
        similarity: "100"
    }

    const omdb = await convertBestSimilarToOMDB(dummyData);

    return {
        tmdb,
        omdb,
        bestSimilar: null as any
    } as SimilarMoviesInfo
};