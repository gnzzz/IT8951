import { IT8951 } from 'it8951';
import { SystemInfo } from 'it8951';
import { PIXELS } from 'it8951';
import { ROTATE } from 'it8951';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as sharp from 'sharp';

async function main() {
    let screen = new IT8951(1500);
    
    const info = screen.systemInfo();
    await updateTime(screen, info, 2);
    while(true){
        await updateTime(screen, info);
    }
}

async function updateTime(screen: IT8951, info: SystemInfo, mode = 2){
    await screen.waitForDisplayReady();

    let image = await convertTo2BPP(await getimage(info.width, info.height));
    screen.writePixels(0, 0, info.width, info.height, image, PIXELS.BPP2, ROTATE.ROTATE_180);
    screen.displayArea(0, 0, info.width, info.height, mode);
}

async function convertTo2BPP(image: Buffer){
    let buffer = new Uint8Array(image.length/2);
    let c = 0;
    for(let i = 0; i < image.length; i+=4){
        buffer[c++] = (image[i] & 0xF0 ) | ((image[i+1] & 0xF0) >> 2) | ((image[i+2] & 0xF0) >> 4) | ((image[i+3] & 0xF0) >> 6)
    }
    return Buffer.from(buffer);
}

async function getimage(width: number, height: number): Promise<Buffer>{
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    
    // Write "Awesome!"
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,width,height)

    ctx.font = 'bold 150pt Menlo'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'black';
    ctx.fillText(new Date().toLocaleTimeString(), width/2, height/2)

    const png = canvas.toBuffer('image/png');
    fs.writeFileSync('image.png', png);
    
    let data = canvas.toBuffer('raw');

    return new Promise((resolve, reject) => {
        sharp(png)
            // .resize(width, height)
            .grayscale()
            .raw()
            .toBuffer(function(err, data) {
                // data is a Buffer containing uint8 values (0-255)
                // with each byte representing one pixel
                resolve(data);
            });
    });
}


main();