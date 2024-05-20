import Vibrant from "node-vibrant";
import axios from "axios";
import { createCanvas, loadImage, registerFont } from "canvas";

import { SimilarMoviesInfo } from "../module/bestSimilar/search";
import { join } from "path";

const fonts = [

    {
        family: 'Source Sans Pro',
        weight: 'normal',
        path: join(__dirname, '../../assets/fonts/source-sans-pro/SourceSansPro-Regular.ttf')
    },
    {
        family: 'Source Sans Pro',
        weight: 'bold',
        path: join(__dirname, '../../assets/fonts/source-sans-pro/SourceSansPro-Bold.ttf')
    },
    {
        family: 'Source Sans Pro',
        weight: 'light',
        path: join(__dirname, '../../assets/fonts/source-sans-pro/SourceSansPro-Light.ttf')
    },
    {
        family: 'Source Sans Pro',
        weight: 'extralight',
        path: join(__dirname, '../../assets/fonts/source-sans-pro/SourceSansPro-ExtraLight.ttf')
    },
    {
        family: 'Bebas Neue',
        weight: 'normal',
        path: join(__dirname, '../../assets/fonts/BebasNeue-Regular.ttf')
    }

]

fonts.forEach(font => registerFont(font.path, { family: font.family, weight: font.weight }));


const canvasWidth = 1080 * 2
const canvasHeight = canvasWidth;

export async function createRatingPoster(movieData: SimilarMoviesInfo) {

    // Load poster image
    const posterImageUrl = `https://image.tmdb.org/t/p/original/${movieData.tmdb.poster_path}`;
    const posterImageBuffer = await axios.get(posterImageUrl, {
        responseType: 'arraybuffer'
    });
    const posterImage = await loadImage(Buffer.from(posterImageBuffer.data, 'binary'));

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');


    /*
    // Get the most dominant color from the poster image
    const vibrant = new Vibrant(Buffer.from(posterImageBuffer.data));
    const swatch = await vibrant.getPalette();
    const dominantColor = swatch.Muted.hex;
 
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
 
    // Add color stops using a loop
    for (let i = 0; i <= 1; i += 0.1) {
        const alpha = Math.round(i * 255); // Convert the percentage to alpha value
        gradient.addColorStop(i, `${dominantColor}${alpha.toString(16).toUpperCase().padStart(2, '0')}`);
    }
 
    // Fill the canvas with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    */

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);



    // Poster image dimensions and position
    const posterWidth = (58.33 * canvasWidth) / 100; // 58.33% of the canvas width
    const posterHeight = (posterImage.height / posterImage.width) * posterWidth; // Maintain aspect ratio
    const posterX = (3.24 * canvasWidth) / 100; // 3.24% of the canvas width
    const posterY = canvas.height / 2 - posterHeight / 2;


    async function drawMetacriticBox(blockX: number, blockY: number, blockWidth: number, blockHeight: number) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        const metacriticLogo = await loadImage('./assets/critic-logos/metacritic.jpg');

        // const blockWidth = (30 * canvasWidth) / 100;
        // const blockHeight = (15 * canvasHeight) / 100;

        // const blockX = posterWidth + posterX + (canvasWidth - (posterWidth + posterX + blockWidth)) / 2;
        // const blockY = posterY;

        criticBox(ctx, blockX, blockY, blockWidth, blockHeight, 20);

        const logoWidth = (90 * blockWidth) / 100;
        const logoHeight = logoWidth * metacriticLogo.height / metacriticLogo.width;
        const logoX = blockX + (blockWidth - logoWidth) / 2;
        const logoY = blockY + (blockHeight - logoHeight) / 6;

        ctx.drawImage(metacriticLogo, logoX, logoY, logoWidth, logoHeight);

        const rating = movieData.omdb.Ratings.find(rating => rating.Source === 'Metacritic');

        const ratingNumber = rating ? rating.Value.split('/')[0] : '0';
        let ratingColor = '#ffffff';
        let ratingText = 'N/A';

        if (+ratingNumber >= 66) {
            ratingColor = '#00ce7a';
            if (+ratingNumber >= 81) ratingText = 'Universal Acclaim';
            else ratingText = 'Generally Favorable';

        }
        else if (+ratingNumber >= 33) {
            ratingColor = '#ffbd3f';
            ratingText = 'Mixed or Average';
        }
        else {
            ratingColor = '#ff6874';
            ratingText = 'Generally Unfavorable';
        }

        const ratingSectionX = blockX + (logoWidth / 8);
        const ratingSectionY = blockY + (blockHeight - logoHeight) + (logoHeight / 8);
        const ratingSectionWidth = (23 * blockHeight) / 100;
        const ratingSectionHeight = ratingSectionWidth;

        ctx.fillStyle = ratingColor;
        ctx.strokeStyle = ratingColor;
        criticBox(ctx, ratingSectionX, ratingSectionY, ratingSectionWidth, ratingSectionHeight, 10);
        ctx.fill();

        // Add rating text in the middle of the box
        ctx.font = `bold ${blockHeight / 7}px 'Source Sans Pro'`;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(ratingNumber, ratingSectionX + ratingSectionWidth / 2, ratingSectionY + ratingSectionHeight / 2);

        // Add rating text on the right of the score box
        ctx.font = `bold ${blockHeight / 7}px 'Source Sans Pro'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillText(ratingText, ratingSectionX + ratingSectionWidth + 10, ratingSectionY + ratingSectionHeight / 2);
    }

    async function drawRtBox(blockX: number, blockY: number, blockWidth: number, blockHeight: number) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        const rtLogo = await loadImage('./assets/critic-logos/rotten_tomatoes.png');

        criticBox(ctx, blockX, blockY, blockWidth, blockHeight, 20);

        const logoWidth = (90 * blockWidth) / 100;
        const logoHeight = logoWidth * rtLogo.height / rtLogo.width;
        const logoX = blockX + (blockWidth - logoWidth) / 2;
        const logoY = blockY + (blockHeight - logoHeight) / 6;

        ctx.drawImage(rtLogo, logoX, logoY, logoWidth, logoHeight);

        const ratingSectionX = blockX + (logoWidth / 4);
        const ratingSectionY = blockY + (blockHeight - logoHeight) + (logoHeight / 8);
        const ratingSectionWidth = (25 * blockHeight) / 100;
        const ratingSectionHeight = (25 * blockHeight) / 100;

        const rtTm = await loadImage('./assets/critic-logos/rotten_tomatoes_tm.png');

        ctx.drawImage(rtTm, ratingSectionX, ratingSectionY, ratingSectionWidth, ratingSectionHeight);

        const rating = movieData.omdb.Ratings.find(rating => rating.Source === 'Rotten Tomatoes');

        const ratingText = rating?.Value ? rating.Value : 'N/A';

        ctx.font = `bold ${blockHeight / 4}px 'Source Sans Pro'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(ratingText).width;

        ctx.fillText(ratingText, ratingSectionX + ratingSectionWidth + textWidth + (textWidth / 7), ratingSectionY + (ratingSectionHeight / 2));
    }

    async function drawTmdbBox(blockX: number, blockY: number, blockWidth: number, blockHeight: number) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        const tmdbLogo = await loadImage('./assets/critic-logos/tmdb.png');

        criticBox(ctx, blockX, blockY, blockWidth, blockHeight, 20);

        const logoWidth = (90 * blockWidth) / 100;
        const logoHeight = logoWidth * tmdbLogo.height / tmdbLogo.width;
        const logoX = blockX + (blockWidth - logoWidth) / 2;
        const logoY = blockY + (blockHeight - logoHeight) / 6;

        ctx.drawImage(tmdbLogo, logoX, logoY, logoWidth, logoHeight);

        const rating = +(movieData.tmdb.vote_average * 10).toFixed(0);

        const ratingText = rating < 10 ? `0${rating}` : rating;

        let ratingColor = '#ffffff';

        if (rating > 70) {
            ratingColor = '#21D07A';
        }
        else if (rating > 40) {
            ratingColor = '#D2D531';
        }
        else {
            ratingColor = '#D8235F';
        }


        const ratingSectionX = blockX + (logoWidth / 3);
        const ratingSectionY = blockY + (blockHeight / 2) + (blockHeight / 6);
        const ratingSectionWidth = (25 * blockHeight) / 100;
        const ratingSectionHeight = (25 * blockHeight) / 100;

        const arcRadius = 80;

        ctx.lineWidth = 10;
        ctx.strokeStyle = ratingColor;

        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(ratingSectionX, ratingSectionY, arcRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Calculate the arc angle from rating
        ctx.globalAlpha = 1;
        const angle = (rating * 360) / 100;
        ctx.beginPath();
        ctx.arc(ratingSectionX, ratingSectionY, arcRadius, -Math.PI / 2, angle * Math.PI / 180 - Math.PI / 2);
        ctx.stroke();

        // Write rating in the middle of the circle

        ctx.font = `bold ${blockHeight / (6 * 2)}px 'Source Sans Pro'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const percentageWidth = ctx.measureText(`%`).width;

        ctx.font = `bold ${blockHeight / 6}px 'Source Sans Pro'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(`${ratingText}`, ratingSectionX - percentageWidth / 2, ratingSectionY);

        ctx.font = `bold ${blockHeight / (6 * 2)}px 'Source Sans Pro'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`%`, ratingSectionX + percentageWidth / 2 + percentageWidth / 1.5, ratingSectionY - (blockHeight / 6) / 3);


        // Write the text "User Score" on the right of the circle
        ctx.font = `light ${blockHeight / 8}px 'Source Sans Pro'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillText('User Score', ratingSectionX + arcRadius * 1.5, ratingSectionY);

    }

    async function drawImdbBox(blockX: number, blockY: number, blockWidth: number, blockHeight: number) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        const imdbLogo = await loadImage('./assets/critic-logos/imdb.png');

        criticBox(ctx, blockX, blockY, blockWidth, blockHeight, 20);

        const logoWidth = (70 * blockWidth) / 100;
        const logoHeight = logoWidth * imdbLogo.height / imdbLogo.width;
        const logoX = blockX + (blockWidth - logoWidth) / 2;
        const logoY = blockY + (blockHeight - logoHeight) / 6;

        ctx.drawImage(imdbLogo, logoX, logoY, logoWidth, logoHeight);


        const starLogo = await loadImage('./assets/critic-logos/imdb_star.png');

        // Add star logo   
        const starWidth = (15 * blockWidth) / 100;
        const starHeight = starWidth * starLogo.height / starLogo.width;
        const starX = blockX + (blockWidth - starWidth) / 3;
        const starY = blockY + (blockHeight / 2) + (blockHeight / 6);

        ctx.drawImage(starLogo, starX, starY, starWidth, starHeight);

        // Add rating
        const rating = movieData.omdb.Ratings.find(rating => rating.Source === 'Internet Movie Database');
        const ratingText = rating?.Value ? rating.Value.split('/')[0] : 'N/A';

        ctx.font = `bold ${blockHeight / 8}px 'Source Sans Pro'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(ratingText).width;

        ctx.fillText(ratingText, starX + starWidth + 20, starY + starHeight / 3);

        ctx.font = `bold ${blockHeight / 10}px 'Source Sans Pro'`;
        ctx.fillStyle = 'grey';

        ctx.fillText('/10', starX + starWidth + 20 + textWidth + 10, starY + starHeight / 3);


        const imdbVotes = movieData.omdb.imdbVotes;
        const imdbVotesText = formatNumber(imdbVotes);

        ctx.font = `bold ${blockHeight / 13}px 'Source Sans Pro'`;
        ctx.fillStyle = 'grey';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillText(imdbVotesText, starX + starWidth + 20, starY + starHeight - 10);
    }


    // Metacritic box dimensions and position
    const MC_blockWidth = (30 * canvasWidth) / 100;
    const MC_blockHeight = (15.5 * canvasHeight) / 100;
    const MC_blockX = posterWidth + posterX + (canvasWidth - (posterWidth + posterX + MC_blockWidth)) / 2;
    // const MC_blockY = posterY;
    // await drawMetacriticBox(MC_blockX, MC_blockY, MC_blockWidth, MC_blockHeight);


    // Rotten Tomatoes box dimensions and position
    const RT_blockWidth = (30 * canvasWidth) / 100;
    const RT_blockHeight = (18 * canvasHeight) / 100;
    const RT_blockX = posterWidth + posterX + (canvasWidth - (posterWidth + posterX + RT_blockWidth)) / 2;
    // const RT_blockY = MC_blockY + MC_blockHeight + 50 // 23.15 * canvasHeight / 100
    // await drawRtBox(RT_blockX, RT_blockY, RT_blockWidth, RT_blockHeight);


    // TMDb box dimensions and position
    const TMDB_blockWidth = (30 * canvasWidth) / 100;
    const TMDB_blockHeight = (20 * canvasHeight) / 100;
    const TMDB_blockX = posterWidth + posterX + (canvasWidth - (posterWidth + posterX + TMDB_blockWidth)) / 2;
    // const TMDB_blockY = RT_blockY + RT_blockHeight + 50
    // await drawTmdbBox(TMDB_blockX, TMDB_blockY, TMDB_blockWidth, TMDB_blockHeight);

    // IMDB box dimensions and position
    const IMDB_blockWidth = (30 * canvasWidth) / 100;
    const IMDB_blockHeight = (20 * canvasHeight) / 100;
    const IMDB_blockX = posterWidth + posterX + (canvasWidth - (posterWidth + posterX + IMDB_blockWidth)) / 2;
    // const IMDB_blockY = TMDB_blockY + TMDB_blockHeight + 50
    // await drawImdbBox(IMDB_blockX, IMDB_blockY, IMDB_blockWidth, IMDB_blockHeight);

    // Calculate the y position of each box, and with equal spacing
    const ySpacing = (posterHeight - (MC_blockHeight + RT_blockHeight + TMDB_blockHeight + IMDB_blockHeight)) / 3;

    const MC_blockY = posterY;
    const RT_blockY = MC_blockY + MC_blockHeight + ySpacing;
    const TMDB_blockY = RT_blockY + RT_blockHeight + ySpacing;
    const IMDB_blockY = TMDB_blockY + TMDB_blockHeight + ySpacing;

    await drawMetacriticBox(MC_blockX, MC_blockY, MC_blockWidth, MC_blockHeight);
    await drawRtBox(RT_blockX, RT_blockY, RT_blockWidth, RT_blockHeight);
    await drawTmdbBox(TMDB_blockX, TMDB_blockY, TMDB_blockWidth, TMDB_blockHeight);
    await drawImdbBox(IMDB_blockX, IMDB_blockY, IMDB_blockWidth, IMDB_blockHeight);

    // Draw poster image
    roundRect(ctx, posterX, posterY, posterWidth, posterHeight, 20);
    ctx.drawImage(posterImage, posterX, posterY, posterWidth, posterHeight);


    const buffer = canvas.toBuffer('image/jpeg');
    return Buffer.from(buffer).toString('base64');
}

function roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
}

function criticBox(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.stroke();
}

function formatNumber(text: string) {
    const number = parseInt(text.replace(/,/g, ''));

    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const divisions = [Math.pow(10, 3), Math.pow(10, 6), Math.pow(10, 9), Math.pow(10, 12), Math.pow(10, 15)];

    for (let i = 0; i < suffixes.length; i++) {
        if (number < divisions[i]) {
            // Format the number with at most 3 digits before the decimal point
            const formattedNumber = `${(number / (divisions[i] / Math.pow(10, 3))).toFixed(0)}${suffixes[i]}`;
            return formattedNumber;
        }
    }
    return `${(number / Math.pow(10, 15)).toFixed(0)}T`;
}