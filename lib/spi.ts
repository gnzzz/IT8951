/**
 * Internal class for SPI connection
 * @internal
 * @packageDocumentation
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const it8951 = require('../build/Release/spi'); // eslint-disable-line node/no-unpublished-require

/**
 * Pin asignments for the non SPI pins in use. As long as bcm2835 is used these are hardware pins.
 *
 * @enum {number}
 */
enum PINS {
  /**
   * Chip select.
   */
  CS = 8,
  /**
   * Ready pin. Pulls high when it8951 is ready to recieve communication.
   */
  READY = 24, // HRDY
  /**
   * Reset pin, pull low to reset controller.
   */
  RESET = 17,
}

/**
 * Possible pin values when using {@link setPin} or {@link readPin}
 *
 * @enum {number}
 */
export enum PIN_VALUE {
  /**
   * Pin low, i.e. no voltage.
   */
  LOW = 0,
  /**
   * Pin high, i.e. 3.3v on specified pin.
   */
  HIGH = 1,
}

/**
 * The SPI class is a convenience class for sending data over SPI. In practice, it only exposes the methods needed for the main {@link IT8951} class.
 *
 * @export
 * @class SPI
 */
export class SPI {
  /**
   * Creates an instance of SPI.
   *
   * This will initialise the c++ code, then set chip select pin high and trigger a controller reset.
   */
  constructor() {
    it8951.init();
    this.setPin(PINS.CS, PIN_VALUE.HIGH);
    this.reset();
  }

  /**
   * Reset the controller.
   */
  public reset() {
    return it8951.reset();
  }

  /**
   * Write the words in `data` over the SPI interface.
   *
   * @param data Array of words to write.
   */
  public writeWords(data: Uint16Array) {
    this.setPin(PINS.CS, PIN_VALUE.LOW);
    this.waitForReady();
    it8951.writeWords(data);
    this.setPin(PINS.CS, PIN_VALUE.HIGH);
  }

  /**
   * Reads `length` number of words from the SPI interface.
   *
   * @param length Number of words to read.
   */
  public readWords(length: number): Uint16Array {
    const data = new Uint16Array(length);
    this.setPin(PINS.CS, PIN_VALUE.LOW);
    this.waitForReady();
    const response = it8951.readWords(data, length);
    this.setPin(PINS.CS, PIN_VALUE.HIGH);
    return response;
  }

  /**
   * Writes a sequence of bytes over the SPI interface.
   *
   * @param data Array of bytes to write.
   */
  public writeBytes(data: Uint8Array) {
    this.setPin(PINS.CS, PIN_VALUE.LOW);
    this.waitForReady();
    it8951.writeBytes(data);
    this.setPin(PINS.CS, PIN_VALUE.HIGH);
  }

  /**
   * Read pin `pin`.
   *
   * @param pin Hardware pin number to read
   */
  public readPin(pin: number): PIN_VALUE {
    return it8951.readPin(pin);
  }

  /**
   * Set pin `pin` to `value`.
   *
   * @param pin Hardware pin number to set
   * @param value Value to set
   */
  public setPin(pin: number, value: PIN_VALUE) {
    it8951.setPin(pin, value);
  }

  /**
   * Synchronously blocks until the SPI is ready for new messages.
   */
  public waitForReady() {
    it8951.waitForReady();
  }
}
