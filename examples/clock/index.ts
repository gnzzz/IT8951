import { IT8951 } from 'it8951';
import { SystemInfo } from 'it8951';
import { PIXELS } from 'it8951';
import { ROTATE } from 'it8951';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as sharp from 'sharp';

let screen: IT8951;
let keepRunning = true;
async function main() {
    screen = new IT8951(1500);

    const info = screen.systemInfo();
    await updateTime(screen, info, 2);
    while (keepRunning) {
        await updateTime(screen, info);
    }
}

async function updateTime(screen: IT8951, info: SystemInfo, mode = 2) {
    await screen.run();
    await screen.waitForDisplayReady();

    const image = await convertTo2BPP(await getimage(info.width, info.height));
    screen.writePixels(
        0,
        0,
        info.width,
        info.height,
        image,
        PIXELS.BPP2,
        ROTATE.ROTATE_180
    );
    screen.displayArea(0, 0, info.width, info.height, mode);
    await screen.sleep();
}

async function convertTo2BPP(image: Buffer) {
    const buffer = new Uint8Array(image.length / 2);
    let c = 0;
    for (let i = 0; i < image.length; i += 4) {
        buffer[c++] =
            (image[i] & 0xf0) |
            ((image[i + 1] & 0xf0) >> 2) |
            ((image[i + 2] & 0xf0) >> 4) |
            ((image[i + 3] & 0xf0) >> 6);
    }
    return Buffer.from(buffer);
}

async function cleanup() {
    keepRunning = false;
    await screen.sleep();
    // eslint-disable-next-line no-process-exit
    process.exit();
}

async function getimage(width: number, height: number): Promise<Buffer> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Write "Awesome!"
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 150pt Menlo';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText(new Date().toLocaleTimeString(), width / 2, height / 2);

    const png = canvas.toBuffer('image/png');
    return new Promise(resolve => {
        sharp(png)
            // .resize(width, height)
            .grayscale()
            .raw()
            .toBuffer((err, data) => {
                // data is a Buffer containing uint8 values (0-255)
                // with each byte representing one pixel
                resolve(data);
            });
    });
}

process.on('SIGINT', cleanup);
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);
process.on('uncaughtException', cleanup);

main();
