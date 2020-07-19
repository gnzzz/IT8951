#include "spi.h"

Napi::Value WriteBytes(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	if (info.Length() < 1) {
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return info.Env().Undefined();
	}

	if (!info[0].IsTypedArray()) {
		Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
		return info.Env().Undefined();
	}

	uint8_t* data = info[0].As<Napi::Buffer<uint8_t>>().Data();
	uint32_t length = info[0].As<Napi::Buffer<uint8_t>>().Length();

	for(uint32_t i=0;i<length;i++){
		bcm2835_spi_transfer(data[i]);
	}

	return env.Undefined();
}

Napi::Value WriteWords(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	if (info.Length() < 1) {
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return info.Env().Undefined();
	}

	if (!info[0].IsBuffer()) {
		Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
		return info.Env().Undefined();
	}

	uint16_t* data = info[0].As<Napi::TypedArrayOf<uint16_t>>().Data();
	uint32_t length = info[0].As<Napi::Buffer<uint16_t>>().Length();

	for(uint32_t i=0;i<length;i++){
		bcm2835_spi_transfer(data[i] >> 8);
		bcm2835_spi_transfer(data[i]);
	}

	return env.Undefined();
}

Napi::Value ReadWords(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	if (info.Length() < 2) {
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return env.Null();
	}

	if (!info[0].IsBuffer() || !info[1].IsNumber()) {
		Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
		return env.Null();
	}

	uint32_t length = info[1].As<Napi::Number>().Uint32Value();
	Napi::TypedArrayOf<uint16_t> words = Napi::TypedArrayOf<uint16_t>::New(env, length, napi_uint16_array);
	
	uint16_t wPreamble = PREAMBLE_READ;

	bcm2835_spi_transfer(wPreamble>>8);
	bcm2835_spi_transfer(wPreamble);
		
	// Reading the first word corresponding to the data sent
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
		
	for(uint32_t i=0;i<length;i++){
		words[i]  = bcm2835_spi_transfer(0x00) << 8;
		words[i] |= bcm2835_spi_transfer(0x00);
	}
	
	return words;
}

Napi::Value SetPin(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	if (info.Length() < 2) {
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return env.Null();
	}

	if (!info[0].IsNumber() || !info[1].IsNumber()) {
		Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
		return env.Null();
	}

	uint8_t pin = info[0].As<Napi::Number>().Uint32Value();
	uint8_t value = info[1].As<Napi::Number>().Uint32Value();
	
	bcm2835_gpio_write(pin,value);

	return env.Undefined();
}

Napi::Value ReadPin(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	if (info.Length() < 1) {
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return env.Null();
	}

	if (!info[0].IsNumber()) {
		Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
		return env.Null();
	}

	uint8_t pin = info[0].As<Napi::Number>().Uint32Value();
	
	return Napi::Number::New(env, bcm2835_gpio_lev(pin));
}

Napi::Value WaitForReady(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	uint8_t ulData = bcm2835_gpio_lev(READY);
	while(ulData == 0){
		ulData = bcm2835_gpio_lev(READY);
	}

	return env.Undefined();
}

Napi::Value Initialise(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	if (!bcm2835_init()){
		printf("bcm2835 not initialised \n");
		return Napi::Boolean::New(env, false);
	}

	bcm2835_spi_begin();
	bcm2835_spi_setBitOrder(BCM2835_SPI_BIT_ORDER_MSBFIRST);   		//default
	bcm2835_spi_setDataMode(BCM2835_SPI_MODE0);               		//default
	bcm2835_spi_setClockDivider(BCM2835_SPI_CLOCK_DIVIDER_32);		//default
	
	bcm2835_gpio_fsel(CS, BCM2835_GPIO_FSEL_OUTP);  
	bcm2835_gpio_fsel(READY, BCM2835_GPIO_FSEL_INPT);
	bcm2835_gpio_fsel(RESET, BCM2835_GPIO_FSEL_OUTP);

	return Napi::Boolean::New(env, true);
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
	exports.Set(Napi::String::New(env, "init"),
				Napi::Function::New(env, Initialise));

	exports.Set(Napi::String::New(env, "writeWords"),
				Napi::Function::New(env, WriteWords));

	exports.Set(Napi::String::New(env, "writeBytes"),
				Napi::Function::New(env, WriteBytes));

	exports.Set(Napi::String::New(env, "readWords"),
				Napi::Function::New(env, ReadWords));

	exports.Set(Napi::String::New(env, "waitForReady"),
				Napi::Function::New(env, WaitForReady));

	exports.Set(Napi::String::New(env, "readPin"),
				Napi::Function::New(env, ReadPin));

	exports.Set(Napi::String::New(env, "setPin"),
				Napi::Function::New(env, SetPin));

	return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)