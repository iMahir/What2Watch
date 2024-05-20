import { IgApiClient } from "instagram-private-api";
import { config } from "../config";
import { withRealtime, IgApiClientRealtime, withFbns, GraphQLSubscriptions, SkywalkerSubscriptions, IgApiClientExt, IgApiClientFbns } from "instagram_mqtt";
import { promisify } from 'util';
import { writeFile, readFile, exists } from 'fs';
import qs from "querystring";
import { getMovieStats, getSimilarMovies } from "../module/bestSimilar/search";
import { createRatingPoster } from "../image/ratingPoster";
import { createMainPoster } from "../image/mainPoster";


const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);



export const instagramHandler = async () => {
    console.log("Instagram handler");

    const ig: IgApiClientFbns = withFbns(new IgApiClient());
    ig.state.generateDevice(config.clients.instagram.username ?? "");

    await readState(ig);

    await loginToInstagram(ig);

    // you received a notification
    ig.fbns.on('push', async (data) => {
        console.log(data);

        if (data.actionPath !== "direct_v2") return;

        const threadId = (data.actionParams as { id?: string; x?: string })?.id;
        if (!threadId) return;

        const thread = ig.entity.directThread(threadId);

        if (data.pushCategory === "direct_v2_pending") {
            await ig.directThread.approve(threadId);
        }

        const text = extractMessage(data.message ?? "");
        console.log("Received message", text);

        const message = text.message.toLowerCase();
        const username = text.username;

        if (message.startsWith("hello") || message.startsWith("hi") || message.startsWith("hey") || message.startsWith("help")) {
            thread.broadcastText(`Hey ${bold(username)}! 👋 Ready to discover awesome movies?\n\nJust send "Movies like" and your favorite movie title (e.g., "Movies like Inception").\n\nWant ratings? Send "Rating for" and the movie title (e.g., "Rating for Inception"). 🍿\n\nFor super accurate suggestions, add the movie year (e.g., "Movies like Inception 2010").\n\nEnjoy your movie marathon! 🎬`);
        }

        else if (message.startsWith("movies like") || message.startsWith("movie like") || message.startsWith("similar movies") || message.startsWith("similar movie")) {
            try {
                const { movieName, year } = parseMovieInfo(message.replace("movies like", "").trim());
                console.log("Movie name:", movieName, "Year:", year);
                await thread.broadcastText(`Searching for movies like ${bold(movieName)}... 🕵️‍♂️`);

                const similarMovies = await getSimilarMovies(movieName, year);
                if (!similarMovies) {
                    await thread.broadcastText(`Sorry, I couldn't find any movies like ${bold(movieName)}. 🤖`);
                    return;
                }

                const response = `Here are some movies like ${bold(similarMovies.movie.title)} (${new Date(similarMovies.movie.release_date).getFullYear()}):`;
                await thread.broadcastText(response);

                const targetMovies = similarMovies.similar.filter((m) => m !== null && m.tmdb !== null).slice(0, 10);

                let targetMoviePosters = await Promise.all(targetMovies.map(async movie => {
                    return await createMainPoster(movie.tmdb);
                }));

                targetMoviePosters = targetMoviePosters.filter(poster => poster !== null)

                for (let i = 0; i < targetMovies.length; i++) {
                    const movie = targetMovies[i];
                    const resText = `${i + 1}. ${bold(movie.bestSimilar.title)} (${movie.bestSimilar.year})`;

                    await thread.broadcastText(resText);

                    await thread.broadcastPhoto({
                        file: Buffer.from(targetMoviePosters[i], 'base64'),
                        allowFullAspectRatio: false
                    })
                }

            } catch (error) {
                thread.broadcastText(`Sorry, I couldn't understand that. Please try again with a valid movie name. 🤖`).catch(() => {
                    console.log("Error sending message");
                });
                console.log(error);
            }
        }

        else if (message.startsWith("rating of") || message.startsWith("ratings of") || message.startsWith("rating for") || message.startsWith("ratings for")) {

            const { movieName, year } = parseMovieInfo(message.replace("ratings of", "").replace("rating of", "").replace("rating for", "").trim());
            await thread.broadcastText(`Getting ratings of ${bold(movieName)}... 🕵️‍♂️`);

            const targetMovie = await getMovieStats(movieName, year);
            if (!targetMovie) {
                await thread.broadcastText(`Sorry, I couldn't find any movies like ${bold(movieName)}. 🤖`);
                return;
            }

            await thread.broadcastText(`Here's the movie rating for ${bold(targetMovie.tmdb.title)} (${new Date(targetMovie.tmdb.release_date).getFullYear()}):`)

            const ratingPoster = await createRatingPoster(targetMovie);

            await thread.broadcastPhoto({
                file: Buffer.from(ratingPoster, 'base64'),
                allowFullAspectRatio: false
            });
        }


    });

    // the client received auth data
    // the listener has to be added before connecting
    ig.fbns.on('auth', async auth => {
        console.log("Instagram auth successful")
        return;
        await saveState(ig);
    });

    // 'error' is emitted whenever the client experiences a fatal error
    ig.fbns.on('error', logEvent('error'));
    // 'warning' is emitted whenever the client errors but the connection isn't affected
    ig.fbns.on('warning', logEvent('warning'));

    await ig.fbns.connect();
}

async function saveState(ig: IgApiClientExt) {
    return writeFileAsync('state.json', await ig.exportState(), { encoding: 'utf8' });
}

async function readState(ig: IgApiClientExt) {
    return;
    if (!await existsAsync('state.json'))
        return;
    await ig.importState(await readFileAsync('state.json', { encoding: 'utf8' }));
}

async function loginToInstagram(ig: IgApiClientExt) {
    ig.request.end$.subscribe(() => {
        // saveState(ig);
    });
    await ig.account.login(config.clients.instagram.username ?? "", config.clients.instagram.password ?? "");
}

/**
 * A wrapper function to log to the console
 * @param name
 * @returns {(data) => void}
 */
function logEvent(name: string) {
    return (data: any) => console.log(name, data);
}

function extractMessage(inputString: string) {
    const regex = /^(.*?):\s*([\s\S]*)/;
    const match = inputString.match(regex);

    if (match && match[1] && match[2]) {
        const username = match[1].trim();
        const message = match[2].trim();
        return { username, message };
    } else {
        return { username: '', message: '' };
    }
}

function bold(text: string): string {
    const boldCharacters: { [key: string]: string } = {
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘',
        'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
        'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢',
        'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
        'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬',
        'Z': '𝗭',
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲',
        'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
        'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼',
        'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
        'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆',
        'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰',
        '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        if (boldCharacters.hasOwnProperty(char)) {
            result += boldCharacters[char];
        } else {
            result += char;
        }
    }

    return result;
}

function parseMovieInfo(input: string) {

    const regex = /^(.+?)\s*(?:\d{4})?\s*(?:,?\s*(\d{4}))?$/;
    const match = input.match(regex);

    if (!match) {
        throw new Error('Invalid movie format');
    }

    const movieName = match[1].trim();
    const year = match[2] ? match[2].trim() : '';

    return {
        movieName: movieName,
        year: year === "" ? undefined : year
    };
}