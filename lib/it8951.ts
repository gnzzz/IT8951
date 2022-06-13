/**
 * Class to controll IT8951. Implemented based on waveshare [documentation]{@link https://www.waveshare.com/wiki/6inch_HD_e-Paper_HAT}, [specification]{@link https://www.waveshare.com/w/upload/c/c4/E-paper-mode-declaration.pdf} and [IT8951 datasheet]{@link https://www.waveshare.net/w/upload/1/18/IT8951_D_V0.2.4.3_20170728.pdf}.
 * @packageDocumentation
 */
import { SPI } from './spi';
import { TextDecoder } from 'util';

/**
 * Return object for system information call.
 *
 * @export
 */
export interface SystemInfo {
  /**
   * Width of screen in pixels.
   */
  width: number;
  /**
   * Height of screen in pixels.
   */
  height: number;
  /**
   * Internal image buffer address.
   */
  imbufferadr: number;
  /**
   * Firmware version.
   */
  firmware: string;
  /**
   * LUT loaded.
   */
  lut: string;
}

/**
 * Preamble words for SPI communication
 *
 * @enum {number}
 */
enum SPI_PREAMBLE {
  /**
   * Command preamble
   */
  CMD = 0x6000,
  /**
   * Write preamble
   */
  WRITE = 0x0000,
  /**
   * Read preamble
   */
  READ = 0x1000,
}

enum IT8951_COMMANDS {
  /**
   * System running command ( enable all clocks and go to active state )
   */
  SYS_RUN = 0x0001,
  /**
   * Standby command ( gate off clocks and go to standby state )
   */
  STANDBY = 0x0002,
  /**
   * Skeep command ( disable all clocks and go to sleep state)
   */
  SLEEP = 0x0003,
  /**
   * Read register command
   */
  REG_RD = 0x0010,
  /**
   * Write register command
   */
  REG_WR = 0x0011,
  /**
   * Memory burst read trigger command.
   *
   * This command will trigger internal FIFO to read data from memory.
   */
  MEM_BST_RD_T = 0x0012,
  /**
   * Memory burst read start command.
   *
   * This is only a data read command. It will read data from internal FIFO. So, this command should be issued after MEM_BST_RD_T command.
   */
  MEM_BST_RD_S = 0x0013,
  /**
   * Memory burst read write command
   */
  MEM_BST_WR = 0x0014,
  /**
   * End memory burst cycle
   */
  MEM_BST_END = 0x0015,
  /**
   * Load full image command. Data that follows must be equal to full display size.
   */
  LD_IMG = 0x0020,
  /**
   * Load partial image area command. Data that follows must equal size specified in the argument parameters.
   */
  LD_IMG_AREA = 0x0021,
  /**
   * End load image.
   */
  LD_IMG_END = 0x0022,
}

/**
 * User defined commands. These might be specific to waveshare firmware.
 *
 * @enum {number}
 */
enum USDEF_I80_CMD {
  /**
   * Display loaded image area.
   */
  DPY_AREA = 0x0034,
  /**
   * Get dev info.
   */
  GET_DEV_INFO = 0x0302,
  /**
   * Display buffer area.
   */
  DPY_BUF_AREA = 0x0037,
  /**
   * Set vcom command.
   */
  CMD_VCOM = 0x0039,
}

/** Base address for the display control register */
const DISPLAY_REG_BASE = 0x1000;
/**
 * Display control register addresses
 *
 * @enum {number}
 */
enum DISPLAY_REG {
  /** LUT0 Engine Width Height Reg */
  LUT0EWHR = DISPLAY_REG_BASE + 0x00,
  /** LUT0 XY Reg */
  LUT0XYR = DISPLAY_REG_BASE + 0x40,
  /** LUT0 Base Address Reg */
  LUT0BADDR = DISPLAY_REG_BASE + 0x80,
  /** LUT0 Mode and Frame number Reg */
  LUT0MFN = DISPLAY_REG_BASE + 0xc0,
  /** LUT0 and LUT1 Active Flag Reg */
  LUT01AF = DISPLAY_REG_BASE + 0x114,
  /** Update Parameter0 Setting Reg */
  UP0SR = DISPLAY_REG_BASE + 0x134,
  /** Update Parameter1 Setting Reg */
  UP1SR = DISPLAY_REG_BASE + 0x138,
  /** LUT0 Alpha blend and Fill rectangle Value */
  LUT0ABFRV = DISPLAY_REG_BASE + 0x13c,
  /** Update Buffer Base Address */
  UPBBADDR = DISPLAY_REG_BASE + 0x17c,
  /** LUT0 Image buffer X/Y offset Reg */
  LUT0IMXY = DISPLAY_REG_BASE + 0x180,
  /** LUT Status Reg (status of All LUT Engines) */
  LUTAFSR = DISPLAY_REG_BASE + 0x224,
  /** Bitmap (1bpp) image color table */
  BGVR = DISPLAY_REG_BASE + 0x250,
}

/** Base address for the system register */
const SYS_REG_BASE = 0x0000;

/**
 * System register addresses
 *
 * @enum {number}
 */
enum SYS_REG {
  /** Address of System Registers */
  I80CPCR = SYS_REG_BASE + 0x04,
}

/** Memory converter base register addresses */
const MCSR_BASE_ADDR = 0x0200;

/**
 * Memory converter register addresses.
 *
 * @enum {number}
 */
enum MCSR_REG {
  /**
   * Memory converter register address.
   */
  MCSR = MCSR_BASE_ADDR,
  /**
   * Load image buffer address.
   */
  LISAR = MCSR_BASE_ADDR + 0x0008,
}

//Rotate mode
/**
 * Image rotation. All rotations are clockwise from the base of the screen.
 *
 * @export
 * @enum {number}
 */
export enum IMAGE_ROTATION {
  /**
   * Rotate zero degrees. Default rotation in methods supporting rotation.
   */
  ROTATE_0 = 0,
  /**
   * Rotate 90 degrees.
   */
  ROTATE_90 = 1,
  /**
   * Rotate 180 degress.
   */
  ROTATE_180 = 2,
  /**
   * Rotate 270 degrees.
   */
  ROTATE_270 = 3,
}

/**
 * Pixel packaging mode.
 *
 * @export
 * @enum {number}
 */
export enum PIXEL_PACKING {
  /**
   * Two bits per pixel
   */
  BPP2 = 0,
  /**
   * Three bits per pixel
   */
  BPP3 = 1,
  /**
   * Four bits per pixel
   */
  BPP4 = 2,
  /**
   * Eight bits per pixel
   */
  BPP8 = 3,
}

//Endian Type
/**
 * Endianness of the image data. Only relevant when sending data less than 8BPP.
 *
 * @export
 * @enum {number}
 */
export enum ENDIANNESS {
  /**
   * Data is packed with little endian order.
   */
  LITTLE = 0,
  /**
   * Data is packed with big endian order.
   */
  BIG = 1,
}

/**
 * Waveform mode used when updating the display. Further information is available in the [mode declaration]{@link https://www.waveshare.com/w/upload/c/c4/E-paper-mode-declaration.pdf}.
 *
 * @export
 */
export enum WAVEFORM {
  /**
   * The initialization (INIT) mode is used to completely erase the display and leave it in the white state. It is
   * useful for situations where the display information in memory is not a faithful representation of the optical
   * state of the display, for example, after the device receives power after it has been fully powered down. This
   * waveform switches the display several times and leaves it in the white state.
   *
   * **Usage:** Display initialization
   *
   * **Ghosting:** N/A
   *
   * **Typical update time:** 2000ms
   */
  INIT = 0,
  /**
   * The direct update (DU) is a very fast, non-flashy update. This mode supports transitions from any graytone
   * to black or white only. It cannot be used to update to any graytone other than black or white. The fast
   * update time for this mode makes it useful for response to touch sensor or pen input or menu selection
   * indictors.
   *
   * **Usage:** Monochrome menu, text input, and touch screen/pen input
   *
   * **Ghosting:** Low
   *
   * **Typical update time:** 260ms
   */
  DU = 1,
  /**
   * The grayscale clearing (GC16) mode is used to update the full display and provide a high image quality.
   * When GC16 is used with Full Display Update the entire display will update as the new image is written. If a
   * Partial Update command is used the only pixels with changing graytone values will update. The GC16 mode
   * has 16 unique gray levels.
   *
   * **Usage:** High quality images
   *
   * **Ghosting:** Very low
   *
   * **Typical update time:** 450ms
   */
  GC16 = 2,
  /**
   * The GL16 waveform is primarily used to update sparse content on a white background, such as a page of
   * anti-aliased text, with reduced flash. The GL16 waveform has 16 unique gray levels.
   *
   * **Usage:** Text with white background
   *
   * **Ghosting:** Medium
   *
   * **Typical update time:** 450ms
   */
  GL16 = 3,
  /**
   * The GLR16 mode is used in conjunction with an image preprocessing algorithm to update sparse content on
   * a white background with reduced flash and reduced image artifacts. The GLR16 mode supports 16
   * graytones. If only the even pixel states are used (0, 2, 4, … 30), the mode will behave exactly as a traditional
   * GL16 waveform mode. If a separately-supplied image preprocessing algorithm is used, the transitions
   * invoked by the pixel states 29 and 31 are used to improve display quality. For the AF waveform, it is
   * assured that the GLR16 waveform data will point to the same voltage lists as the GL16 data and does not
   * need to be stored in a separate memory.
   *
   * **Usage:** Text with white background
   *
   * **Ghosting:** Low
   *
   * **Typical update time:** 450ms
   */
  GLR16 = 4,
  /**
   * The GLD16 mode is used in conjunction with an image preprocessing algorithm to update sparse content
   * on a white background with reduced flash and reduced image artifacts. It is recommended to be used only
   * with the full display update. The GLD16 mode supports 16 graytones. If only the even pixel states are used
   * (0, 2, 4, … 30), the mode will behave exactly as a traditional GL16 waveform mode. If a separately-supplied
   * image preprocessing algorithm is used, the transitions invoked by the pixel states 29 and 31 are used to
   * refresh the background with a lighter flash compared to GC16 mode following a predetermined pixel map
   * as encoded in the waveform file, and reduce image artifacts even more compared to the GLR16 mode. For
   * the AF waveform, it is assured that the GLD16 waveform data will point to the same voltage lists as the
   * GL16 data and does not need to be stored in a separate memory.
   *
   * **Usage:** Text and graphics with white background
   *
   * **Ghosting:** Low
   *
   * **Typical update time:** 450ms
   */
  GLD16 = 5,
  /**
   * The A2 mode is a fast, non-flash update mode designed for fast paging turning or simple black/white
   * animation. This mode supports transitions from and to black or white only. It cannot be used to update to
   * any graytone other than black or white. The recommended update sequence to transition into repeated A2
   * updates is shown in Figure 1. The use of a white image in the transition from 4-bit to 1-bit images will
   * reduce ghosting and improve image quality for A2 updates.
   *
   * **Usage:** Fast page flipping at reduced contrast
   *
   * **Ghosting:** Medium
   *
   * **Typical update time:** 120ms
   */
  A2 = 6,
  /**
   * The DU4 is a fast update time (similar to DU), non-flashy waveform. This mode supports transitions from
   * any gray tone to gray tones 1,6,11,16 represented by pixel states [0 10 20 30]. The combination of fast
   * update time and four gray tones make it useful for anti-aliased text in menus. There is a moderate increase
   * in ghosting compared with GC16.
   *
   * **Usage:** Anti-aliased text in menus / touch and screen/pen input
   *
   * **Ghosting:** Medium
   *
   * **Typical update time:** 290ms
   */
  DU4 = 7,
}

export class IT8951 {
  private info: SystemInfo;
  private spi: SPI;

  /**
     * Creates an instance of IT8951. If the voltage is omitted then the controller default of -1.5v is used.

     * @param vcom Set the voltage of the display.
     */
  constructor(vcom?: number) {
    this.spi = new SPI();
    this.setRegister(SYS_REG.I80CPCR, 0x0001);
    this.info = this.systemInfo();

    if (vcom !== undefined) {
      this.vcom = vcom;
    }
  }

  /**
   * Queries the controller for the dev info.
   */
  public systemInfo(): SystemInfo {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, USDEF_I80_CMD.GET_DEV_INFO])
    );
    const data = this.spi.readWords(20);
    const decoder = new TextDecoder();

    this.info = {
      width: data[0],
      height: data[1],
      imbufferadr: data[2] | (data[3] << 16),
      firmware: decoder.decode(data.slice(4, 12)).replace(/\0*$/g, ''),
      lut: decoder.decode(data.slice(12, 20)).replace(/\0*$/g, ''),
    };

    return this.info;
  }

  /**
   * Return the voltage
   */
  public get vcom(): number {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, USDEF_I80_CMD.CMD_VCOM])
    );
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, 0]));

    const data = this.spi.readWords(1);
    return data[0];
  }

  /**
   * Sets the voltage
   */
  public set vcom(vcom: number) {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, USDEF_I80_CMD.CMD_VCOM])
    );
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, 1]));
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, vcom]));
  }

  /**
   * Sets register `address` to `value`.
   *
   * @param address Address value to set
   * @param value Value to set
   */
  public setRegister(address: number | SYS_REG, value: number) {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.REG_WR])
    );
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, address]));
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, value]));
  }

  /**
   * Reads register value at `address`
   *
   * @param address Address value to read
   */
  public readRegister(address: number | SYS_REG): number {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.REG_RD])
    );
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, address]));
    const data = this.spi.readWords(1);
    return data[0];
  }

  /**
   * Loads an image to memory without updating display.
   *
   * @param x vertical start of area to load
   * @param y horizontal start of area to load
   * @param width width of data to load
   * @param height height of data to load
   * @param image image data to transfer
   * @param bpp byte packing of image data
   * @param [rotate=IMAGE_ROTATION.ROTATE_0] rotate data for storage
   * @param [endianism=ENDIANNESS.LITTLE] image data endianness
   */
  public writePixels(
    x: number,
    y: number,
    width: number,
    height: number,
    image: Buffer,
    bpp: PIXEL_PACKING,
    rotate: IMAGE_ROTATION = IMAGE_ROTATION.ROTATE_0,
    endianism: ENDIANNESS = ENDIANNESS.LITTLE
  ) {
    this.setRegister(
      MCSR_REG.LISAR + 2,
      (this.info.imbufferadr >> 16) & 0x0000ffff
    );
    this.setRegister(MCSR_REG.LISAR, this.info.imbufferadr & 0x0000ffff);

    // Setting argument for load image start
    const settings =
      (endianism << 8) | // byte packings
      (bpp << 4) | // pixel format
      rotate; // rotation

    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.LD_IMG_AREA])
    );
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.WRITE, settings, x, y, width, height])
    );
    this.spi.writeBytes(
      Uint8Array.from(
        Buffer.concat([
          Buffer.from([SPI_PREAMBLE.WRITE >> 8, SPI_PREAMBLE.WRITE]),
          image,
        ])
      )
    );
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.LD_IMG_END])
    );
  }

  /**
   * Updates a region of the screen with a previously loaded image.
   *
   * @param x vertical start of area to dsiplay
   * @param y horizontal start of area to dsiplay
   * @param width width of data to dsiplay
   * @param height height of data to dsiplay
   * @param mode waveform mode to update display
   */
  public displayArea(
    x: number,
    y: number,
    width: number,
    height: number,
    mode: WAVEFORM
  ) {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, USDEF_I80_CMD.DPY_AREA])
    );
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, x]));
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, y]));
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, width]));
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, height]));
    this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, mode]));
  }

  /**
   * Issues the display running command.
   *
   * Enables all clocks and goes to active state.
   *
   */
  public run() {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.SYS_RUN])
    );
  }

  /**
   * Issues the display standby command.
   *
   * Gate off clocks and go to standby state.
   */
  public standby() {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.STANDBY])
    );
  }

  /**
   * Issues the display sleep command.
   *
   * Disables all clocks and goes to sleep state.
   */
  public sleep() {
    this.spi.writeWords(
      Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.SLEEP])
    );
  }

  /**
   * Returns a promise that resolves when all the lut engines are ready.
   *
   * @return {*}
   */
  public waitForDisplayReady() {
    return new Promise<void>(resolve => {
      const interval = setInterval(() => {
        const regval = this.readRegister(DISPLAY_REG.LUTAFSR);
        if (regval === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }

  /**
   * Resets the controller.
   */
  public reset() {
    return this.spi.reset();
  }
}
