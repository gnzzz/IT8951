[it8951](README.md) › [Globals](globals.md)

# it8951

# it8951

it8951 is a node.js module written in typescript for the IT8951 e-paper controller.

## Hardware compatibility

In theory, the package is compatible with any version of Raspberry Pi or similar boards with a BCM2835 chip. The package is tested on a Raspberry Pi 4.
It should be compatible with a generic IT8951 setup, but has only been tested on a [WaveShare e-paper HAT](https://www.waveshare.com/wiki/10.3inch_e-Paper_HAT_(D)).

## Examples

Displaying an image on the screen requires you to first have written the image to the buffer. In general it's also a good idea to put the display to sleep after you're done as long term usage in the active power state can damage the screen. 

```
async function displayImage(image: Buffer){
    const screen = new it8935(1500); // Change voltage to what is suggested on your e-paper
    screen.run(); // Wake up screen
    await screen.waitForDisplayReady(); // Wait for screen to be ready

    screen.writePixels( // Write to image buffer
        0, // Top corner
        0, // Left corver
        info.width, // Image width, in this case use full screen size
        info.height, // Image width, in this case use full screen size
        image, // Image buffer
        PIXELS.BPP8 // Bits per pixel in image
    );
    
    screen.displayArea( // Display from image buffer
        0, // Top corner
        0, // Left corner
        info.width, // Image width, in this case use full screen size
        info.height, // Image width, in this case use full screen size
        mode // Refresh mode
    );

    screen.sleep(); // Put display to sleep
}
```

There are further examples in the [examples directory](examples/).

## Documentation

Full documentation found [here](docs/modules/_it8951_.md).

## License note

This package includes a copy of the [C library for Broadcom BCM 2835 by Mike McCauley](https://www.airspayce.com/mikem/bcm2835/) under open source use. Commercial use requires a license for bcm2835.
