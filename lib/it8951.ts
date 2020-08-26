import { SPI } from './spi';
import { TextDecoder } from 'util';

export interface SystemInfo {
    width: number;
    height: number;
    imbufferadr: number;
    firmware: string;
    lut: string;
}

enum SPI_PREAMBLE {
    CMD = 0x6000,
    WRITE = 0x0000,
    READ = 0x1000,
}

enum IT8951_COMMANDS {
    SYS_RUN = 0x0001,
    STANDBY = 0x0002,
    SLEEP = 0x0003,
    REG_RD = 0x0010,
    REG_WR = 0x0011,
    MEM_BST_RD_T = 0x0012,
    MEM_BST_RD_S = 0x0013,
    MEM_BST_WR = 0x0014,
    MEM_BST_END = 0x0015,
    LD_IMG = 0x0020,
    LD_IMG_AREA = 0x0021,
    LD_IMG_END = 0x0022,
}

enum USDEF_I80_CMD {
    DPY_AREA = 0x0034,
    GET_DEV_INFO = 0x0302,
    DPY_BUF_AREA = 0x0037,
    CMD_VCOM = 0x0039,
}

const DISPLAY_REG_BASE = 0x1000;
enum DISPLAY_REG {
    LUT0EWHR = DISPLAY_REG_BASE + 0x00, //LUT0 Engine Width Height Reg
    LUT0XYR = DISPLAY_REG_BASE + 0x40, //LUT0 XY Reg
    LUT0BADDR = DISPLAY_REG_BASE + 0x80, //LUT0 Base Address Reg
    LUT0MFN = DISPLAY_REG_BASE + 0xc0, //LUT0 Mode and Frame number Reg
    LUT01AF = DISPLAY_REG_BASE + 0x114, //LUT0 and LUT1 Active Flag Reg
    //Update Parameter Setting Register
    UP0SR = DISPLAY_REG_BASE + 0x134, //Update Parameter0 Setting Reg

    UP1SR = DISPLAY_REG_BASE + 0x138, //Update Parameter1 Setting Reg
    LUT0ABFRV = DISPLAY_REG_BASE + 0x13c, //LUT0 Alpha blend and Fill rectangle Value
    UPBBADDR = DISPLAY_REG_BASE + 0x17c, //Update Buffer Base Address
    LUT0IMXY = DISPLAY_REG_BASE + 0x180, //LUT0 Image buffer X/Y offset Reg
    LUTAFSR = DISPLAY_REG_BASE + 0x224, //LUT Status Reg (status of All LUT Engines)

    BGVR = DISPLAY_REG_BASE + 0x250, //Bitmap (1bpp) image color table
}

//-------System Registers----------------
const SYS_REG_BASE = 0x0000;

enum SYS_REG {
    I80CPCR = SYS_REG_BASE + 0x04, //Address of System Registers
}

//-------Memory Converter Registers----------------
const MCSR_BASE_ADDR = 0x0200;

enum MCSR_REG {
    MCSR = MCSR_BASE_ADDR,
    LISAR = MCSR_BASE_ADDR + 0x0008,
}

//Rotate mode
export enum ROTATE {
    ROTATE_0 = 0,
    ROTATE_90 = 1,
    ROTATE_180 = 2,
    ROTATE_270 = 3,
}

//Pixel mode , BPP - Bit per Pixel
export enum PIXELS {
    BPP2 = 0,
    BPP3 = 1,
    BPP4 = 2,
    BPP8 = 3,
}

//Waveform Mode
enum WAVEFORM {
    MODE_0 = 0,
    MODE_1 = 1,
    MODE_2 = 2,
    MODE_3 = 3,
    MODE_4 = 4,
}

//Endian Type
export enum ENDIAN {
    LITTLE = 0,
    BIG = 1,
}

//Auto LUT
enum AUTO_LUT {
    DIS = 0, // disabled?
    EN = 1, // enabled?
}

//LUT Engine Status
const IT8951_ALL_LUTE_BUSY = 0xffff;

export class IT8951 {
    private info: SystemInfo;
    private spi: SPI;

    constructor(vcom?: number) {
        this.spi = new SPI();
        this.setRegister(SYS_REG.I80CPCR, 0x0001);
        this.info = this.systemInfo();

        if (vcom !== undefined) {
            this.vcom = vcom;
        }
    }

    public systemInfo(): SystemInfo {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, USDEF_I80_CMD.GET_DEV_INFO])
        );
        const data = this.spi.readWords(new Uint16Array(20), 20);
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

    public get vcom(): number {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, USDEF_I80_CMD.CMD_VCOM])
        );
        this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, 0]));

        // it8951.writeWord(SPI_PREAMBLE.CMD, USDEF_I80_CMD.CMD_VCOM);
        // it8951.writeWord(SPI_PREAMBLE.WRITE, 0);
        const data = this.spi.readWords(new Uint16Array(1), 1) as Uint16Array;
        return data[0];
    }

    public set vcom(vcom: number) {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, USDEF_I80_CMD.CMD_VCOM])
        );
        this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, 1]));
        this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, vcom]));
    }

    public setRegister(address: number, value: number) {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.REG_WR])
        );
        this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, address]));
        this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, value]));
    }

    public readRegister(address: number): number {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.REG_RD])
        );
        this.spi.writeWords(Uint16Array.from([SPI_PREAMBLE.WRITE, address]));
        const data = this.spi.readWords(new Uint16Array(1), 1);
        return data[0];
    }

    public writePixels(
        x: number,
        y: number,
        width: number,
        height: number,
        image: Buffer,
        bpp: PIXELS,
        rotate: ROTATE = ROTATE.ROTATE_0,
        endianism: ENDIAN = ENDIAN.BIG
    ) {
        this.setRegister(
            MCSR_REG.LISAR + 2,
            (this.info.imbufferadr >> 16) & 0x0000ffff
        );
        this.setRegister(MCSR_REG.LISAR, this.info.imbufferadr & 0x0000ffff);

        //Setting Argument for Load image start
        const settings =
            (endianism << 8) | // byte packings
            (bpp << 4) | // pixel format
            rotate; // rotation

        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.LD_IMG_AREA])
        );
        this.spi.writeWords(
            Uint16Array.from([
                SPI_PREAMBLE.WRITE,
                settings,
                x,
                y,
                width,
                height,
            ])
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

    public displayArea(
        x: number,
        y: number,
        width: number,
        height: number,
        mode: number
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

    public run() {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.SYS_RUN])
        );
    }

    public standby() {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.STANDBY])
        );
    }

    public sleep() {
        this.spi.writeWords(
            Uint16Array.from([SPI_PREAMBLE.CMD, IT8951_COMMANDS.SLEEP])
        );
    }

    public waitForDisplayReady() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                const regval = this.readRegister(DISPLAY_REG.LUTAFSR);
                if (regval === 0) {
                    clearInterval(interval);
                    resolve();
                }
            }, 10);
        });
    }
}
