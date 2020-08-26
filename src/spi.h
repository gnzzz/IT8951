#ifndef SPI_H
#define SPI_H

#include <napi.h>
#include <bcm2835.h>
#include <unistd.h>

// Pin definitions
#define CS 				8
#define READY 	        24
#define RESET 	        17

#define PREAMBLE_WRITE 0x0000
#define PREAMBLE_READ 0x1000
#define PREAMBLE_CMD 0x6000

Napi::Value WriteBytes(const Napi::CallbackInfo& info);
Napi::Value WriteWords(const Napi::CallbackInfo& info);
Napi::Value ReadWords(const Napi::CallbackInfo& info);
Napi::Value SetPin(const Napi::CallbackInfo& info);
Napi::Value ReadPin(const Napi::CallbackInfo& info);
Napi::Value WaitForReady(const Napi::CallbackInfo& info);
Napi::Value Initialise(const Napi::CallbackInfo& info);

static Napi::Object Init(Napi::Env env, Napi::Object exports);

#endif
