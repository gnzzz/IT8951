const it8951 = require('../build/Release/spi');

enum PINS {
    CS = 8,
    READY = 24, // HRDY
    RESET = 17
}

const LOW = 0x0;
const HIGH = 0x1;

export class SPI {
    constructor(){
        it8951.init();
        this.setPin(PINS.CS, HIGH);

        this.setPin(PINS.RESET, LOW);
        this.setPin(PINS.RESET, HIGH);
    }

    public writeWords(data: Uint16Array){
        this.setPin(PINS.CS, LOW);
        this.waitForReady();
        it8951.writeWords(data);
        this.setPin(PINS.CS, HIGH);
    }

    public readWords(data: Uint16Array, length: number): Uint16Array{
        this.setPin(PINS.CS, LOW);
        this.waitForReady();
        const response = it8951.readWords(data, length);
        this.setPin(PINS.CS, HIGH);
        return response;
    }

    public writeBytes(data: Uint8Array){
        this.setPin(PINS.CS, LOW);
        this.waitForReady();
        it8951.writeBytes(data);
        this.setPin(PINS.CS, HIGH);
    }

    public readPin(pin: Number): Number {
        return it8951.readPin(pin);
    }

    public setPin(pin: Number, value: Number){
        it8951.setPin(pin, value);
    }

    public waitForReady(){
        it8951.waitForReady();
    }
}