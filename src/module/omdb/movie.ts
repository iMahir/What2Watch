import axios from "axios";
import { config } from "../../config";

export interface OMDB_MovieData {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Language: string;
    Country: string;
    Awards: string;
    Poster: string;
    Ratings: {
        Source: string;
        Value: string;
    }[];
    Metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    DVD: string;
    BoxOffice: string;
    Production: string;
    Website: string;
    Response: string;
}

export const getMovieByTitle_OMDB = async (title: string, year: string | number) => {
    const response = await axios.get(`http://www.omdbapi.com/?t=${title}&y=${year}&apikey=${config.apiKey.omdb}`);
    const data: OMDB_MovieData = await response.data;
    if (data.Response === "True") return data;
    else return null;
}