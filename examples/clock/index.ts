import { IT8951 } from 'it8951';
import { SystemInfo } from 'it8951';
import { PIXEL_PACKING } from 'it8951';
import { IMAGE_ROTATION } from 'it8951';
import { WAVEFORM } from 'it8951';
import { ENDIANNESS } from 'it8951';
import { createCanvas } from 'canvas';
import * as sharp from 'sharp';

let screen: IT8951;
let keepRunning = true;
async function main() {
    screen = new IT8951(1500);

    const info = screen.systemInfo();
    await updateTime(screen, info, WAVEFORM.INIT);
    while (keepRunning) {
        await updateTime(screen, info, WAVEFORM.GC16);
    }
}

async function updateTime(screen: IT8951, info: SystemInfo, mode: WAVEFORM) {
    screen.run();
    await screen.waitForDisplayReady();

    const image = await convertTo2BPP(await getimage(info.width, info.height));
    screen.writePixels(
        0,
        0,
        info.width,
        info.height,
        image,
        PIXEL_PACKING.BPP2,
        IMAGE_ROTATION.ROTATE_180,
        ENDIANNESS.BIG
    );
    screen.displayArea(0, 0, info.width, info.height, mode);
    screen.sleep();
}

async function convertTo2BPP(image: Buffer) {
    const buffer = new Uint8Array(image.length / 2);
    let c = 0;
    for (let i = 0; i < image.length; i += 4) {
        buffer[c++] =
            (image[i] & 0xc0) |
            ((image[i + 1] & 0xc0) >> 2) |
            ((image[i + 2] & 0xc0) >> 4) |
            ((image[i + 3] & 0xc0) >> 6);
    }
    return Buffer.from(buffer);
}

async function cleanup() {
    keepRunning = false;
    screen.sleep();
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
