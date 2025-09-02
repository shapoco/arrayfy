#pragma once

// #define ILI9488_RGB111
// #define ILI9488_RGB565

#include <stdint.h>

#include "rawdisp/command_data_display.hpp"
#include "rawdisp/command_data_spi.hpp"
#include "rawdisp/gpio.hpp"

namespace rawdisp {

class ST7789 : public CommandDataDisplay {
 public:
  enum class Command : uint8_t {
    NOP = 0x00,
    SOFTWARE_RESET = 0x01,
    READ_DISP_ID = 0x04,
    READ_ERROR_DSI = 0x05,
    READ_DISP_STATUS = 0x09,
    READ_DISP_POWER_MODE = 0x0A,
    READ_DISP_MADCTRL = 0x0B,
    READ_DISP_PIXEL_FORMAT = 0x0C,
    READ_DISP_IMAGE_MODE = 0x0D,
    READ_DISP_SIGNAL_MODE = 0x0E,
    READ_DISP_SELF_DIAGNOSTIC = 0x0F,
    ENTER_SLEEP_MODE = 0x10,
    SLEEP_OUT = 0x11,
    PARTIAL_MODE_ON = 0x12,
    NORMAL_DISP_MODE_ON = 0x13,
    DISP_INVERSION_OFF = 0x20,
    DISP_INVERSION_ON = 0x21,
    PIXEL_OFF = 0x22,
    PIXEL_ON = 0x23,
    DISPLAY_OFF = 0x28,
    DISPLAY_ON = 0x29,
    COLUMN_ADDRESS_SET = 0x2A,
    PAGE_ADDRESS_SET = 0x2B,
    MEMORY_WRITE = 0x2C,
    MEMORY_READ = 0x2E,
    PARTIAL_AREA = 0x30,
    VERT_SCROLL_DEFINITION = 0x33,
    TEARING_EFFECT_LINE_OFF = 0x34,
    TEARING_EFFECT_LINE_ON = 0x35,
    MEMORY_ACCESS_CONTROL = 0x36,
    VERT_SCROLL_START_ADDRESS = 0x37,
    IDLE_MODE_OFF = 0x38,
    IDLE_MODE_ON = 0x39,
    INTERFACE_PIXEL_FORMAT = 0x3A,
    MEMORY_WRITE_CONTINUE = 0x3C,
    MEMORY_READ_CONTINUE = 0x3E,
    SET_TEAR_SCANLINE = 0x44,
    GET_SCANLINE = 0x45,
    WRITE_DISPLAY_BRIGHTNESS = 0x51,
    READ_DISPLAY_BRIGHTNESS = 0x52,
    WRITE_CTRL_DISPLAY = 0x53,
    READ_CTRL_DISPLAY = 0x54,
    WRITE_CONTENT_ADAPT_BRIGHTNESS = 0x55,
    READ_CONTENT_ADAPT_BRIGHTNESS = 0x56,
    WRITE_MIN_CAB_LEVEL = 0x5E,
    READ_MIN_CAB_LEVEL = 0x5F,
    READ_ABC_SELF_DIAG_RES = 0x68,
    READ_ID1 = 0xDA,
    READ_ID2 = 0xDB,
    READ_ID3 = 0xDC,
    INTERFACE_MODE_CONTROL = 0xB0,
    FRAME_RATE_CONTROL_NORMAL = 0xB1,
    FRAME_RATE_CONTROL_IDLE_8COLOR = 0xB2,
    FRAME_RATE_CONTROL_PARTIAL = 0xB3,
    DISPLAY_INVERSION_CONTROL = 0xB4,
    BLANKING_PORCH_CONTROL = 0xB5,
    DISPLAY_FUNCTION_CONTROL = 0xB6,
    ENTRY_MODE_SET = 0xB7,
    BACKLIGHT_CONTROL_1 = 0xB9,
    BACKLIGHT_CONTROL_2 = 0xBA,
    HS_LANES_CONTROL = 0xBE,
    POWER_CONTROL_1 = 0xC0,
    POWER_CONTROL_2 = 0xC1,
    POWER_CONTROL_NORMAL_3 = 0xC2,
    POWER_CONTROL_IDEL_4 = 0xC3,
    POWER_CONTROL_PARTIAL_5 = 0xC4,
    VCOM_CONTROL_1 = 0xC5,
    CABC_CONTROL_1 = 0xC6,
    CABC_CONTROL_2 = 0xC8,
    CABC_CONTROL_3 = 0xC9,
    CABC_CONTROL_4 = 0xCA,
    CABC_CONTROL_5 = 0xCB,
    CABC_CONTROL_6 = 0xCC,
    CABC_CONTROL_7 = 0xCD,
    CABC_CONTROL_8 = 0xCE,
    CABC_CONTROL_9 = 0xCF,
    NVMEM_WRITE = 0xD0,
    NVMEM_PROTECTION_KEY = 0xD1,
    NVMEM_STATUS_READ = 0xD2,
    READ_ID4 = 0xD3,
    ADJUST_CONTROL_1 = 0xD7,
    READ_ID_VERSION = 0xD8,
    POSITIVE_GAMMA_CORRECTION = 0xE0,
    NEGATIVE_GAMMA_CORRECTION = 0xE1,
    DIGITAL_GAMMA_CONTROL_1 = 0xE2,
    DIGITAL_GAMMA_CONTROL_2 = 0xE3,
    SET_IMAGE_FUNCTION = 0xE9,
    ADJUST_CONTROL_2 = 0xF2,
    ADJUST_CONTROL_3 = 0xF7,
    ADJUST_CONTROL_4 = 0xF8,
    ADJUST_CONTROL_5 = 0xF9,
    SPI_READ_COMMAND_SETTING = 0xFB,
    ADJUST_CONTROL_6 = 0xFC,
    ADJUST_CONTROL_7 = 0xFF,
  };

  ST7789(const DisplayConfig& cfg, CommandDataSpi& bus)
      : CommandDataDisplay(bus, cfg) {}

  inline void writeCommand(Command cmd) {
    bus.writeCommand(static_cast<uint8_t>(cmd));
  }

  inline void writeCommand(Command cmd, uint8_t param0) {
    bus.writeCommand(static_cast<uint8_t>(cmd), param0);
  }

  inline void writeCommand(Command cmd, const uint8_t* data, size_t size) {
    bus.writeCommand(static_cast<uint8_t>(cmd), data, size);
  }

  void init() override {
    CommandDataDisplay::init();

    if (RESET_PORT >= 0) {
      gpio::write(RESET_PORT, false);
      sleep_ms(5);
      gpio::write(RESET_PORT, true);
      sleep_ms(5);
    }

    writeCommand(Command::SOFTWARE_RESET);
    sleep_ms(200);

    writeCommand(Command::SLEEP_OUT);
    sleep_ms(200);

    switch (FORMAT) {
      case PixelFormat::RGB444:
        writeCommand(Command::INTERFACE_PIXEL_FORMAT, 0x53);
        break;
      case PixelFormat::RGB565:
        writeCommand(Command::INTERFACE_PIXEL_FORMAT, 0x55);
        break;
      case PixelFormat::RGB666:
        writeCommand(Command::INTERFACE_PIXEL_FORMAT, 0x56);
        break;
    }

    // #if 0
    //     writeCommand(Command::MEMORY_ACCESS_CONTROL, 0x48);
    // #else
    //     // writeCommand(Command::MEMORY_ACCESS_CONTROL, 0xE8);
    //     writeCommand(Command::MEMORY_ACCESS_CONTROL, 0x28);
    // #endif

    writeCommand(Command::DISP_INVERSION_ON);

    writeCommand(Command::DISPLAY_ON);
    sleep_ms(25);
  }

  void setWindow(int x, int y, int w, int h) override {
    int x_end = x + w - 1;
    int y_end = y + h - 1;
    uint8_t tmp[4];
    tmp[0] = x >> 8;
    tmp[1] = x & 0xFF;
    tmp[2] = x_end >> 8;
    tmp[3] = x_end & 0xFF;
    writeCommand(Command::COLUMN_ADDRESS_SET, tmp, 4);
    tmp[0] = y >> 8;
    tmp[1] = y & 0xFF;
    tmp[2] = y_end >> 8;
    tmp[3] = y_end & 0xFF;
    writeCommand(Command::PAGE_ADDRESS_SET, tmp, 4);
  }

  void writePixels(const void* data, size_t length) override {
    bus.commandStart(static_cast<uint8_t>(Command::MEMORY_WRITE));
    bus.writeBytes(static_cast<const uint8_t*>(data), length);
    bus.commandEnd();
  }
};

}  // namespace rawdisp