import { IT8951 } from 'it8951';
import { PIXEL_PACKING } from 'it8951';
import { IMAGE_ROTATION } from 'it8951';
import { WAVEFORM } from 'it8951';
import { ENDIANNESS } from 'it8951';

let screen: IT8951;
async function main() {
    screen = new IT8951(1500);
    screen.run();

    const info = screen.systemInfo();
    await screen.waitForDisplayReady();
    screen.displayArea(0, 0, info.width, info.height, WAVEFORM.INIT);

    await screen.waitForDisplayReady();

    const image = createImage(info.width, info.height);
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
    screen.displayArea(0, 0, info.width, info.height, WAVEFORM.GC16);

    screen.sleep();
}

function createImage(width: number, height: number) {
    const uint8array = new Uint8Array((width * height) / 2);
    let i = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 4) {
            uint8array[i++] =
                ((Math.sin(Math.pow(x / 100, 2)) > 0 ? 0 : 0b11) << 6) |
                ((Math.sin(Math.pow((x + 1) / 100, 2)) > 0 ? 0 : 0b11) << 4) |
                ((Math.sin(Math.pow((x + 2) / 100, 2)) > 0 ? 0 : 0b11) << 2) |
                (Math.sin(Math.pow((x + 3) / 100, 2)) > 0 ? 0 : 0b11);
        }
    }

    return Buffer.from(uint8array);
}

async function cleanup() {
    screen.sleep();
    // eslint-disable-next-line no-process-exit
    process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);
process.on('uncaughtException', cleanup);

main();
