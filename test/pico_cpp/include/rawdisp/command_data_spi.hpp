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
  const uint32_t SPI_FREQ;

  CommandDataSpi(spi_inst_t *spi, int csPort, int dcPort, uint32_t freq)
      : spi(spi), CS_PORT(csPort), DC_PORT(dcPort), SPI_FREQ(freq) {}

  void init() override {
    gpio::initMulti((1 << CS_PORT) | (1 << DC_PORT));
    gpio::writeMulti((1 << CS_PORT) | (1 << DC_PORT), ~0);
    gpio::setDirMulti((1 << CS_PORT) | (1 << DC_PORT), true);
  }

  void writeBytes(const uint8_t *data, size_t length) override {
    spi_write_blocking(spi, data, length);
  }

  void commandStart(uint8_t cmd) override {
    gpio::writeMulti((1 << CS_PORT) | (1 << DC_PORT), 0);
    spi_write_blocking(spi, &cmd, 1);
    gpio::write(DC_PORT, true);
  }

  void commandEnd() override {
    gpio::writeMulti((1 << CS_PORT) | (1 << DC_PORT), ~0);
  }
};

}  // namespace rawdisp