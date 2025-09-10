#pragma once

#include <stdint.h>

#include "rawdisp/command_data_display.hpp"
#include "rawdisp/command_data_spi.hpp"
#include "rawdisp/gpio.hpp"

namespace rawdisp {

class SSD1680 : public CommandDataDisplay {
 public:
  enum class Command : uint8_t {
    DRIVER_OUTPUT_CTRL = 0x01,
    GATE_DRIVING_VOLTAGE_CTRL = 0x03,
    SOURCE_DRIVING_VOLTAGE_CTRL = 0x04,
    BOOSTER_SOFT_START_CTRL = 0x0C,
    DEEP_SLEEP_MODE = 0x10,
    DATA_ENTRY_MODE_SETTING = 0x11,
    SOFTWARE_RESET = 0x12,
    HV_READY_DETECTION = 0x14,
    VCI_DETECTION = 0x15,
    TEMPERATURE_SENSOR_CTRL = 0x18,
    TEMPERATURE_WRITE_REG = 0x1A,
    TEMPERATURE_READ_REG = 0x1B,
    TEMPERATURE_WRITE_CMD_EXT_SENSOR = 0x1C,
    MASTER_ACTIVATION = 0x20,
    DISPLAY_UPDATE_CTRL_1 = 0x21,
    DISPLAY_UPDATE_CTRL_2 = 0x22,
    WRITE_RAM_BLACK = 0x24,
    WRITE_RAM_RED = 0x26,
    READ_RAME = 0x27,
    VCOM_SENSE_ENTER = 0x28,
    VCOM_SENSE_DURATION = 0x29,
    PROGRAM_VCOM_OTP = 0x2A,
    WRITE_REG_VCOM_CTRL = 0x2B,
    WRITE_VCOM_REG = 0x2C,
    OTP_REG_READ = 0x2D,
    USER_ID_READ = 0x2E,
    STATUS_BIT_READ = 0x2F,
    PROGRAM_WS_OTP = 0x30,
    LOAD_WS_OTP = 0x31,
    WRITE_LUT_REG = 0x32,
    CRC_CALC = 0x34,
    CRC_STATUS_READ = 0x35,
    PROGRAM_OTP_SELECTION = 0x36,
    WRITE_REG_DISP_OPTION = 0x37,
    WRITE_REG_USER_ID = 0x38,
    OTP_PROGRAM_MODE = 0x39,
    BORDER_WAVEFORM_CTRL = 0x3C,
    END_OPTION = 0x3F,
    READ_RAM_OPTION = 0x41,
    SET_RAM_X_ADDR_START_END = 0x44,
    SET_RAM_Y_ADDR_START_END = 0x45,
    AUTO_WRITE_RED_RAM = 0x46,
    AUTO_WRITE_BLACK_RAM = 0x47,
    SET_RAM_X_ADDR_COUNTER = 0x4E,
    SET_RAM_Y_ADDR_COUNTER = 0x4F,
    NOP = 0x7F,
  };

  enum Plane {
    PLANE_WHITE = 0,
    PLANE_RED = 1,
  };

  const int busyPort;
  const int rotation;

  SSD1680(const DisplayConfig& cfg, CommandDataSpi& bus, int busyPort,
          int rotation)
      : CommandDataDisplay(bus, cfg), busyPort(busyPort), rotation(rotation) {}

  inline void writeCommandArray(Command cmd, const uint8_t* data, size_t size) {
    bus.writeCommand(static_cast<uint8_t>(cmd), data, size);
  }

  inline void writeCommand(Command cmd) { writeCommandArray(cmd, nullptr, 0); }

  inline void writeCommand(Command cmd, uint8_t p0) {
    writeCommandArray(cmd, &p0, 1);
  }

  inline void writeCommand(Command cmd, uint8_t p0, uint8_t p1) {
    uint8_t params[] = {p0, p1};
    writeCommandArray(cmd, params, sizeof(params));
  }

  inline void writeCommand(Command cmd, uint8_t p0, uint8_t p1, uint8_t p2) {
    uint8_t params[] = {p0, p1, p2};
    writeCommandArray(cmd, params, sizeof(params));
  }

  inline void writeCommand(Command cmd, uint8_t p0, uint8_t p1, uint8_t p2,
                           uint8_t p3) {
    uint8_t params[] = {p0, p1, p2, p3};
    writeCommandArray(cmd, params, sizeof(params));
  }

  bool waitBusy() {
    if (busyPort < 0) {
      sleep_ms(500);
      return true;
    }
    while (gpio::read(busyPort)) {
      sleep_ms(10);
    }
    sleep_ms(50);
    return true;
  }

  void init() override {
    CommandDataDisplay::init();

    gpio::init(busyPort);
    gpio::setDir(busyPort, false);

    if (resetPort >= 0) {
      sleep_ms(100);
      gpio::write(resetPort, false);
      sleep_ms(10);
      gpio::write(resetPort, true);
      sleep_ms(1);
      waitBusy();
    }

    writeCommand(Command::SOFTWARE_RESET);
    sleep_ms(10);

    switch (rotation) {
      case 0:
        writeCommand(Command::DATA_ENTRY_MODE_SETTING, 0x03);
        break;
      case 1:
        writeCommand(Command::DATA_ENTRY_MODE_SETTING, 0x06);
        break;
      case 2:
        writeCommand(Command::DATA_ENTRY_MODE_SETTING, 0x00);
        break;
      default:
        writeCommand(Command::DATA_ENTRY_MODE_SETTING, 0x05);
        break;
    }

    if (false) {
      // 要否不明
      writeCommand(Command::BORDER_WAVEFORM_CTRL, 0x05);
      writeCommand(Command::WRITE_VCOM_REG, 0x36);
      writeCommand(Command::GATE_DRIVING_VOLTAGE_CTRL, 0x17);
      writeCommand(Command::SOURCE_DRIVING_VOLTAGE_CTRL, 0x41, 0x00, 0x32);
    }

    writeCommand(Command::DISPLAY_UPDATE_CTRL_1, (uint8_t)0x00, 0x80);
  }

  void setWindow(int x, int y, int w, int h) override {
    int xStart, xEnd, yStart, yEnd;
    switch (rotation) {
      case 0:
        xStart = x;
        yStart = y;
        xEnd = x + w - 1;
        yEnd = y + h - 1;
        break;
      case 1:
        xStart = x + w - 1;
        yStart = y;
        xEnd = x;
        yEnd = y + h - 1;
        break;
      case 2:
        xStart = x + w - 1;
        yStart = y + h - 1;
        xEnd = x;
        yEnd = y;
        break;
      default:
        xStart = x;
        yStart = y + h - 1;
        xEnd = x + w - 1;
        yEnd = y;
        break;
    }

    xStart >>= 3;
    xEnd >>= 3;

    uint8_t xs = xStart & 0x1F;
    uint8_t xe = xEnd & 0x1F;
    uint8_t ysl = yStart & 0xFF;
    uint8_t ysh = (yStart >> 8) & 0x01;
    uint8_t yel = yEnd & 0xFF;
    uint8_t yeh = (yEnd >> 8) & 0x01;

    writeCommand(Command::SET_RAM_X_ADDR_START_END, xs, xe);
    writeCommand(Command::SET_RAM_Y_ADDR_START_END, ysl, ysh, yel, yeh);
    writeCommand(Command::SET_RAM_X_ADDR_COUNTER, xs);
    writeCommand(Command::SET_RAM_Y_ADDR_COUNTER, ysl, ysh);
  }

  void writePixels(const void* data, size_t length, int plane) override {
    uint8_t cmd;
    if (plane == PLANE_WHITE) {
      cmd = static_cast<uint8_t>(Command::WRITE_RAM_BLACK);
    } else {
      cmd = static_cast<uint8_t>(Command::WRITE_RAM_RED);
    }
    bus.writeStart(true);
    bus.writeBytes(&cmd, 1);
    bus.writeStart(false);
    bus.writeBytes(static_cast<const uint8_t*>(data), length);
    bus.writeEnd();
  }

  void startUpdateDisplay() { writeCommand(Command::MASTER_ACTIVATION); }
};

}  // namespace rawdisp