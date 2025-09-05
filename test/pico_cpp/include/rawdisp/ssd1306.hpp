#pragma once

#include <stdint.h>

#include "rawdisp/command_data_display.hpp"
#include "rawdisp/command_data_i2c.hpp"
#include "rawdisp/gpio.hpp"

namespace rawdisp {

class SSD1306 : public CommandDataDisplay {
 public:
  enum Command : uint8_t {
    SET_MEM_MODE = 0x20,
    SET_COL_ADDR = 0x21,
    SET_PAGE_ADDR = 0x22,
    SET_HORIZ_SCROLL = 0x26,
    SET_SCROLL = 0x2E,
    SET_DISP_START_LINE = 0x40,
    SET_CONTRAST = 0x81,
    SET_CHARGE_PUMP = 0x8D,
    SET_SEG_REMAP = 0xA0,
    SET_ENTIRE_ON = 0xA4,
    SET_ALL_ON = 0xA5,
    SET_ALL_ON_RESUME = 0xA4,
    SET_NORM_DISP = 0xA6,
    SET_INV_DISP = 0xA7,
    SET_MUX_RATIO = 0xA8,
    SET_DISP = 0xAE,
    SET_COM_OUT_DIR = 0xC0,
    SET_DISP_OFFSET = 0xD3,
    SET_DISP_CLK_DIV = 0xD5,
    SET_PRECHARGE = 0xD9,
    SET_COM_PIN_CFG = 0xDA,
    SET_VCOM_DESEL = 0xDB,
  };

  const int rotation;

  SSD1306(const DisplayConfig& cfg, CommandDataI2c& bus, int rotation)
      : CommandDataDisplay(bus, cfg), rotation(rotation) {}

  inline void writeCommand(Command cmd, const uint8_t* data, size_t size) {
    uint8_t cmdByte = static_cast<uint8_t>(cmd);
    bus.writeStart(true);
    bus.writeBytes(&cmdByte, 1);
    bus.writeEnd();
    for (size_t i = 0; i < size; i++) {
      bus.writeStart(true);
      bus.writeBytes(&data[i], 1);
      bus.writeEnd();
    }
  }

  inline void writeCommand(Command cmd) { writeCommand(cmd, nullptr, 0); }

  inline void writeCommand(Command cmd, uint8_t p0) {
    writeCommand(cmd, &p0, 1);
  }

  inline void writeCommand(Command cmd, uint8_t p0, uint8_t p1) {
    uint8_t params[] = {p0, p1};
    writeCommand(cmd, params, sizeof(params));
  }

  inline Command commandOr(Command cmd, uint8_t mask) {
    return static_cast<Command>(static_cast<uint8_t>(cmd) | mask);
  }

  void init() override {
    CommandDataDisplay::init();

    writeCommand(Command::SET_DISP);
    writeCommand(Command::SET_MUX_RATIO, height - 1);
    writeCommand(Command::SET_DISP_OFFSET, 0);
    writeCommand(Command::SET_DISP_START_LINE);
    writeCommand(Command::SET_MEM_MODE, 0x00);
    if (rotation == 0) {
      writeCommand(Command::SET_SEG_REMAP);
      writeCommand(Command::SET_COM_OUT_DIR);
    } else {
      writeCommand(commandOr(Command::SET_SEG_REMAP, 0x01));
      writeCommand(commandOr(Command::SET_COM_OUT_DIR, 0x08));
    }
    writeCommand(Command::SET_VCOM_DESEL, 0x10);
    writeCommand(Command::SET_ALL_ON_RESUME);
    writeCommand(Command::SET_SCROLL);

    if (width == 128 && height == 64) {
      writeCommand(Command::SET_COM_PIN_CFG, 0x12);
    } else {
      writeCommand(Command::SET_COM_PIN_CFG, 0x02);
    }

    writeCommand(Command::SET_CONTRAST, 0xFF);
    writeCommand(Command::SET_ENTIRE_ON);
    writeCommand(Command::SET_NORM_DISP);
    writeCommand(Command::SET_CHARGE_PUMP, 0x14);

    writeCommand(commandOr(Command::SET_DISP, 0x01));
  }

  void setWindow(int x, int y, int w, int h) override {
    writeCommand(Command::SET_COL_ADDR, x, x + w - 1);
    writeCommand(Command::SET_PAGE_ADDR, y / 8, (y + h - 1) / 8);
  }

  void writePixels(const void* data, size_t length, int plane = -1) override {
    bus.writeStart(false);
    bus.writeBytes(static_cast<const uint8_t*>(data), length);
    bus.writeEnd();
  }
};

}  // namespace rawdisp