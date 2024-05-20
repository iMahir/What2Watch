import Vibrant from "node-vibrant";
import axios from "axios";
import { createCanvas, loadImage, registerFont } from "canvas";

import { TMDB_Movie } from "../module/tmdb/types";
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


const canvasWidth = 1080 * 2;
const canvasHeight = 566 * 2;

export async function createMainPoster(movieData: TMDB_Movie, options?: { moviesLikeText?: false }) {

    // Load base image
    const baseImageUrl = `https://image.tmdb.org/t/p/original/${movieData.backdrop_path}`;
    const baseImageBuffer = await axios.get(baseImageUrl, {
        responseType: 'arraybuffer'
    });
    const baseImage = await loadImage(Buffer.from(baseImageBuffer.data, 'binary'));

    // Load poster image
    const posterImageUrl = `https://image.tmdb.org/t/p/original/${movieData.poster_path}`;
    const posterImageBuffer = await axios.get(posterImageUrl, {
        responseType: 'arraybuffer'
    });
    const posterImage = await loadImage(Buffer.from(posterImageBuffer.data, 'binary'));

    // Create canvas for dominant color layer
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Get the most dominant color from the poster image
    const vibrant = new Vibrant(Buffer.from(posterImageBuffer.data));
    const swatch = await vibrant.getPalette();
    const dominantColor = swatch.Muted?.hex ?? "black";

    // Define the gradient from left to right
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `${dominantColor}FF`);
    gradient.addColorStop(0.2, `${dominantColor}CC`);
    gradient.addColorStop(0.4, `${dominantColor}99`);
    gradient.addColorStop(0.6, `${dominantColor}66`);
    gradient.addColorStop(0.8, `${dominantColor}33`);
    gradient.addColorStop(1, `${dominantColor}00`);

    // Fill the canvas with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set global alpha to 0.3 for semi-transparency
    ctx.globalAlpha = 0.3;

    // Draw the layer on top of the base image
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // Set global alpha back to 1
    ctx.globalAlpha = 1;

    // Define poster position and size
    const posterWidth = (27.78 * canvasWidth) / 100; // 27.78% of the canvas width
    const posterHeight = (posterImage.height / posterImage.width) * posterWidth; // Maintain aspect ratio
    const posterX = (12.96 * canvasWidth) / 100; // 12.96% of the canvas width
    const posterY = canvas.height / 2 - posterHeight / 2;

    let titleFontSize = (3.70 * canvasWidth) / 100;
    ctx.font = `bold ${titleFontSize}px Source Sans Pro`;

    // Movie title
    const title = movieData.title;
    const titleWidth = ctx.measureText(title).width;
    if (titleWidth > (46.30 * canvasWidth) / 100) {
        titleFontSize = titleFontSize * 0.8;
    }

    ctx.font = `bold ${titleFontSize}px Source Sans Pro`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(title, (46.30 * canvasWidth) / 100, posterY + titleFontSize);

    // Movie year after the title ({year})
    const year = new Date(movieData.release_date).getFullYear();
    ctx.font = `extralight ${titleFontSize}px Source Sans Pro`;
    ctx.fillStyle = "grey";
    ctx.textAlign = 'left';
    ctx.fillText(`  (${year})`, (46.30 * canvasWidth) / 100 + titleWidth, posterY + titleFontSize);

    // Movie info (lang, release date, runtime, genres)
    const releaseDate = new Date(movieData.release_date);
    const infoString = `${releaseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • ${movieData.runtime} min • ${movieData.genres.map(genre => genre.name).join(', ')}`
    ctx.font = `light ${(titleFontSize * 0.5)}px Source Sans Pro`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(infoString, (46.30 * canvasWidth) / 100, posterY + titleFontSize + (titleFontSize * 0.7));


    // Movie overview, dynamically adjust font size to fit the text in a box
    const overview = movieData.overview;
    const overviewFontSize = (1.85 * canvasWidth) / 100;
    ctx.font = `light ${overviewFontSize}px Source Sans Pro`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    const overviewX = (46.30 * canvasWidth) / 100;
    const overviewY = posterY + titleFontSize + (titleFontSize * 0.7) * 2 + titleFontSize;
    const maxWidth = (46.30 * canvasWidth) / 100;
    const lineHeight = overviewFontSize * 1.5;
    let words = overview.split(' ');
    let line = '';
    let y = overviewY;
    let maxLineWidth = 0;
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && n > 0) {
            const lineLength = ctx.measureText(line).width;
            if (lineLength > maxLineWidth) maxLineWidth = lineLength;
            ctx.fillText(line, overviewX, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, overviewX, y);


    // Add a line separator
    ctx.beginPath();
    ctx.moveTo(overviewX, posterY + titleFontSize + (titleFontSize * 0.7) * 2);
    ctx.lineTo(overviewX + maxLineWidth - (maxLineWidth * 0.03), posterY + titleFontSize + (titleFontSize * 0.7) * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();


    if (options?.moviesLikeText) {
        ctx.save();
        ctx.translate(0, canvas.height);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `${(15 * canvasHeight) / 100}px Bebas Neue`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('MOVIES LIKE', canvas.height / 2, (posterX - (15 * canvasHeight) / 100) * 2);
        ctx.restore();
    }

    // Border around the canvas
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Round the corners of the poster
    const radius = 20; // Curve radius
    roundRect(ctx, posterX, posterY, posterWidth, posterHeight, radius);
    ctx.globalAlpha = 0.8; // Lower the opacity of poster image
    ctx.drawImage(posterImage, posterX, posterY, posterWidth, posterHeight);


    // Save the canvas as JPG
    const outputBuffer = canvas.toBuffer('image/jpeg');

    return Buffer.from(outputBuffer).toString('base64');
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