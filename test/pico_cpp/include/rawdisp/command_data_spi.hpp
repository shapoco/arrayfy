#pragma once

#include <hardware/spi.h>

#include "rawdisp/command_data_bus.hpp"
#include "rawdisp/gpio.hpp"

namespace rawdisp {

class CommandDataSpi : public CommandDataBus {
 public:
  spi_inst_t *spi;
  const int CS_PORT;
  const int DC_PORT;

  CommandDataSpi(spi_inst_t *spi, int csPort, int dcPort)
      : spi(spi), CS_PORT(csPort), DC_PORT(dcPort) {}

  void init() override {
    CommandDataBus::init();
    gpio::initMulti((1 << CS_PORT) | (1 << DC_PORT));
    gpio::writeMulti((1 << CS_PORT) | (1 << DC_PORT), ~0);
    gpio::setDirMulti((1 << CS_PORT) | (1 << DC_PORT), true);
  }

  void writeBytes(const uint8_t *data, size_t length) override {
    spi_write_blocking(spi, data, length);
  }

  void writeStart(bool command) override {
    if (command) {
      gpio::write(DC_PORT, false);
    } else {
      gpio::write(DC_PORT, true);
    }
    gpio::write(CS_PORT, false);
  }

  void writeEnd() override {
    gpio::writeMulti((1 << CS_PORT) | (1 << DC_PORT), ~0);
  }

  void writeCommand(uint8_t cmd, const uint8_t *params, size_t size) override {
    writeStart(true);
    writeBytes(&cmd, 1);
    writeStart(false);
    writeBytes(params, size);
    writeEnd();
  }
};

}  // namespace rawdisp