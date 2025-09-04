#pragma once

#include <hardware/i2c.h>

#include "rawdisp/command_data_bus.hpp"
#include "rawdisp/gpio.hpp"

namespace rawdisp {

class CommandDataI2c : public CommandDataBus {
 public:
  i2c_inst_t *i2c;
  uint8_t devAddr;

  CommandDataI2c(i2c_inst_t *i2c, uint8_t devAddr)
      : i2c(i2c), devAddr(devAddr) {}

  void init() override { CommandDataBus::init(); }

  void writeStart(bool command) override {
    uint8_t firstByte = command ? 0x80 : 0x40;
    i2c_write_burst_blocking(i2c, devAddr, &firstByte, 1);
  }

  void writeBytes(const uint8_t *data, size_t length) override {
    i2c_write_burst_blocking(i2c, devAddr, data, length);
  }

  void writeEnd() override {
    i2c_write_blocking(i2c, devAddr, nullptr, 0, false);
  }

  void writeCommand(uint8_t cmd, const uint8_t *params, size_t size) override {
    writeStart(true);
    writeBytes(&cmd, 1);
    writeBytes(params, size);
    writeEnd();
  }
};

}  // namespace rawdisp