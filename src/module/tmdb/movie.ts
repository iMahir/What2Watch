import { config } from "../../config";
import { TMDB_Movie, TMDB_Search_Response } from "./types";

export const getMovieById = async (id: string | number) => {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?append_to_response=images&include_image_language=en,null`, {
        headers: {
            'Authorization': `Bearer ${config.apiKey.tmdb}`
        }
    });
    const data: TMDB_Movie = await response.json();
    return data;
}

export const getMovieByTitle = async (title: string, year?: string | number) => {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${title}${year ? `&year=${year}` : ""}`, {
        headers: {
            'Authorization': `Bearer ${config.apiKey.tmdb}`
        }
    });
    const data: TMDB_Search_Response = await response.json();
    return data;
}