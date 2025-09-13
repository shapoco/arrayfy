#pragma once

#include <stdint.h>

#include "rawdisp/command_data_display.hpp"
#include "rawdisp/command_data_spi.hpp"
#include "rawdisp/gpio.hpp"

namespace rawdisp {

class JD79667AA : public CommandDataDisplay {
 public:
  enum class Command : uint8_t {
    PANEL_SETTING = 0x00,
    POWER_SETTING = 0x01,
    POWER_OFF = 0x02,
    UNKNOWN_0x03 = 0x03,
    POWER_ON = 0x04,
    BOOSTER_SOFT_START = 0x06,
    DEEP_SLEEP = 0x07,
    DATA_START_TRANS = 0x10,
    DATA_STOP = 0x11,
    DISPLAY_REFRESH = 0x12,
    AUTO_SEQUENCE = 0x17,
    PLL_CONTROL = 0x30,
    TEMPERATURE_SENSOR_COMMAND = 0x40,
    TEMPERATURE_SENSOR_CALIB = 0x41,
    TEMPERATURE_SENSOR_WRITE = 0x42,
    TEMPERATURE_SENSOR_READ = 0x43,
    UNKNOWN_0x4D = 0x4D,
    VCOM_AND_DATA_INTERVAL_SETTING = 0x50,
    LOWER_POWER_DETECTION = 0x51,
    TCON_SETTING = 0x60,
    RESOLUTION_SETTING = 0x61,
    GATE_SOURCE_START_SETTING = 0x65,
    UNKNOWN_0x66 = 0x66,
    CHIP_REVISION = 0x70,
    AUTO_MEASURE_VCOM = 0x80,
    VCOM_VALUE = 0x81,
    VCOM_DC_SETTING = 0x82,
    PARTIAL_WINDOW = 0x83,
    PROGRAM_MODE = 0x90,
    ACTIVE_PROGRAM = 0x91,
    READ_MTP_DATA = 0x92,
    UNKNOWN_0xB4 = 0xB4,
    UNKNOWN_0xB6 = 0xB6,
    POWER_SAVING = 0xE3,
    LVD_VOLTAGE_SELECT = 0xE4,
    UNKNOWN_0xE7 = 0xE7,
    UNKNOWN_0xE9 = 0xE9,
  };

  const int busyPort;
  const int pwrPort;
  const int rotation;

  JD79667AA(const DisplayConfig& cfg, CommandDataSpi& bus, int busyPort,
            int pwrPort, int rotation)
      : CommandDataDisplay(bus, cfg),
        busyPort(busyPort),
        pwrPort(pwrPort),
        rotation(rotation) {}

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
    sleep_ms(100);
    while (!gpio::read(busyPort)) {
      sleep_ms(10);
    }
    return true;
  }

  void init() override {
    CommandDataDisplay::init();

    gpio::init(busyPort);
    gpio::setDir(busyPort, false);

    gpio::init(pwrPort);
    gpio::setDir(pwrPort, true);
    gpio::write(pwrPort, true);
    sleep_ms(100);

    if (resetPort >= 0) {
      sleep_ms(200);
      gpio::write(resetPort, false);
      sleep_ms(2);
      gpio::write(resetPort, true);
      sleep_ms(200);
    }

    {
      const uint8_t params[] = {0x49, 0x55, 0x13, 0x5D, 0x05, 0x10};
      writeCommandArray(Command::UNKNOWN_0x66, params, sizeof(params));
    }

    writeCommand(Command::UNKNOWN_0x4D, 0x78);

    writeCommand(Command::PANEL_SETTING, 0x0F, 0x29);
    writeCommand(Command::POWER_SETTING, 0x07, 0x00);
    writeCommand(Command::UNKNOWN_0x03, 0x10, 0x54, 0x44);

    {
      const uint8_t params[] = {0x0F, 0x0A, 0x2F, 0x25, 0x22, 0x2E, 0x21};
      writeCommandArray(Command::BOOSTER_SOFT_START, params, sizeof(params));
    }

    writeCommand(Command::VCOM_AND_DATA_INTERVAL_SETTING, 0x37);
    writeCommand(Command::TCON_SETTING, 0x02, 0x02);

    {
      const uint8_t wh = width >> 8;
      const uint8_t wl = width & 0xFF;
      const uint8_t hh = height >> 8;
      const uint8_t hl = height & 0xFF;
      writeCommand(Command::RESOLUTION_SETTING, wh, wl, hh, hl);
    }

    writeCommand(Command::UNKNOWN_0xE7, 0x1C);
    writeCommand(Command::POWER_SAVING, 0x22);
    writeCommand(Command::UNKNOWN_0xB6, 0x6F);
    writeCommand(Command::UNKNOWN_0xB4, 0xD0);
    writeCommand(Command::UNKNOWN_0xE9, 0x01);

    writeCommand(Command::PLL_CONTROL, 0x08);
    writeCommand(Command::POWER_ON);
    waitBusy();
  }

  void setWindow(int x, int y, int w, int h) override {
    // none
  }

  void writePixels(const void* data, size_t length, int plane = -1) override {
    uint8_t cmd = static_cast<uint8_t>(Command::DATA_START_TRANS);
    bus.writeStart(true);
    bus.writeBytes(&cmd, 1);
    bus.writeStart(false);
    bus.writeBytes(static_cast<const uint8_t*>(data), length);
    bus.writeEnd();
  }

  void startUpdateDisplay() { writeCommand(Command::DISPLAY_REFRESH, 0x00); }

  void powerOff() {
    writeCommand(Command::POWER_OFF, 0x00);
    waitBusy();
    writeCommand(Command::DEEP_SLEEP, 0xA5);
    sleep_ms(2000);  // important, at least 2s
    gpio::write(pwrPort, false);
  }
};

}  // namespace rawdisp