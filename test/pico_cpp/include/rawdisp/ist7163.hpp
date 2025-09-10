#pragma once

#include <stdint.h>

#include "rawdisp/command_data_display.hpp"
#include "rawdisp/command_data_spi.hpp"
#include "rawdisp/gpio.hpp"

namespace rawdisp {

class IST7163 : public CommandDataDisplay {
 public:
  enum class Command : uint8_t {
    PANEL_SETTING = 0x00,
    POWER_SETTING = 0x01,
    POWER_OFF = 0x02,
    POWER_SEQUENCE_SETTING = 0x03,
    POWER_ON = 0x04,
    BOOSTER_SOFT_START = 0x06,
    DEEP_SLEEP = 0x07,
    DATA_START_TRANS = 0x10,
    DATA_STOP = 0x11,
    DISPLAY_REFRESH = 0x12,
    AUTO_SEQUENCE = 0x17,
    PLL_CONTROL = 0x30,
    TEMPERATURE_SENSOR_COMMAND = 0x40,
    TEMPERATURE_SENSOR_ENABLE = 0x41,
    GPIO_INPUT = 0x44,
    VCOM_AND_DATA_INTERVAL_SETTING = 0x50,
    LOWER_POWER_DETECTION = 0x51,
    TCON_SETTING = 0x60,
    RESOLUTION_SETTING = 0x61,
    GATE_SOURCE_START_SETTING = 0x65,
    CHIP_REVISION = 0x70,
    AUTO_MEASURE_VCOM = 0x80,
    VCOM_VALUE = 0x81,
    VCM_DC_SETTING = 0x82,
    PROGRAM_MODE = 0x90,
    ACTIVE_PROGRAM = 0x91,
    READ_OTP_DATA = 0x92,
    READ_SRAM = 0x93,
    OTP_PROGRAM_CONFIG = 0xA2,
    VDHROS_EN = 0xA8,
    GDROTP = 0xC9,
    CPCK_SET_ENABLE = 0xDC,
    CPCK_PWH_SET = 0xDD,
    CPCK_PWL_SET = 0xDE,
    CHIP_TEMPERATURE_INPUT_SELECT = 0xE0,
    LVD_VOLTAGE_SELECT = 0xE4,
    FORCE_TEMPERATURE = 0xE6,
    VDHOS_SELECT = 0xE8,
    TEST_POWER_PWM = 0xEF,
    VDHOS_EN = 0xFD,
    TEST_MODE = 0xFF,
  };

  const int busyPort;
  const int pwrPort;
  const int rotation;

  IST7163(const DisplayConfig& cfg, CommandDataSpi& bus, int busyPort,
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
      waitBusy();
    }

    writeCommand(Command::PANEL_SETTING, 0x0F, 0x29);
    {
      const uint8_t params[] = {0x07, 0x00, 0x22, 0x78, 0x0A, 0x22};
      writeCommandArray(Command::POWER_SETTING, params, sizeof(params));
    }

    writeCommand(Command::POWER_SEQUENCE_SETTING, 0x10, 0x54, 0x44);
    writeCommand(Command::BOOSTER_SOFT_START, 0xC0, 0xC0, 0xC0);

    writeCommand(Command::PLL_CONTROL, 0x08);

    writeCommand(Command::TEMPERATURE_SENSOR_ENABLE, 0x00);

    writeCommand(Command::VCOM_AND_DATA_INTERVAL_SETTING, 0x37);

    writeCommand(Command::TCON_SETTING, 0x02, 0x02);

    {
      const uint8_t wh = width >> 8;
      const uint8_t wl = width & 0xFF;
      const uint8_t hh = height >> 8;
      const uint8_t hl = height & 0xFF;
      writeCommand(Command::RESOLUTION_SETTING, wh, wl, hh, hl);
    }

    writeCommand(Command::GATE_SOURCE_START_SETTING, 0x00, 0x00, 0x00, 0x00);

    writeCommand(static_cast<Command>(0xE7), 0x1C);  // Unknown
    writeCommand(static_cast<Command>(0xE3), 0x22);  // Unknown

    writeCommand(Command::TEST_MODE, 0xA5);
    {
      const uint8_t params[] = {0x01, 0x1E, 0x0A, 0x1B, 0x0B, 0x17};
      writeCommandArray(Command::TEST_POWER_PWM, params, sizeof(params));
    }

    writeCommand(static_cast<Command>(0xC3), 0xFD);  // Unknown
    writeCommand(static_cast<Command>(0xDC), 0x01);  // Unknown
    writeCommand(static_cast<Command>(0xDD), 0x08);  // Unknown
    writeCommand(static_cast<Command>(0xDE), 0x41);  // Unknown

    writeCommand(Command::VDHOS_EN, 0x01);
    writeCommand(Command::VDHOS_SELECT, 0x03);

    writeCommand(static_cast<Command>(0xDA), 0x07);  // Unknown

    writeCommand(Command::GDROTP, 0x00);
    writeCommand(Command::VDHROS_EN, 0x0F);

    writeCommand(Command::TEST_MODE, 0xE3);

    writeCommand(static_cast<Command>(0xE9), 0x01);  // Unknown

    writeCommand(Command::POWER_ON);
    waitBusy();

    writeCommand(Command::TEST_MODE, 0xA5);
    {
      const uint8_t params[] = {0x03, 0x1E, 0x0A, 0x1B, 0x0E, 0x15};
      writeCommandArray(Command::TEST_POWER_PWM, params, sizeof(params));
    }

    writeCommand(Command::CPCK_SET_ENABLE, 0x01);
    writeCommand(Command::CPCK_PWH_SET, 0x08);
    writeCommand(Command::CPCK_PWL_SET, 0x41);

    writeCommand(Command::TEST_MODE, 0xE3);

#if 0
     writeCommand(Command::CHIP_TEMPERATURE_INPUT_SELECT, 0x02);
     writeCommand(Command::FORCE_TEMPERATURE, 0x5B);
     writeCommand(static_cast<Command>(0xA5), 0x00);  // Unknown
     waitBusy();
#endif
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

  void startUpdateDisplay() {
    writeCommand(Command::DISPLAY_REFRESH, 0x00);
  }

  void powerOff() {
    writeCommand(Command::POWER_OFF, 0x00);
    waitBusy();
    writeCommand(Command::DEEP_SLEEP, 0xA5);
    sleep_ms(2000);  // important, at least 2s
    gpio::write(pwrPort, false);
  }
};

}  // namespace rawdisp