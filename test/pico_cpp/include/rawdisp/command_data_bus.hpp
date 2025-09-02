#pragma once

#include <stdint.h>
#include <stddef.h>

namespace rawdisp {

class CommandDataBus {
 public:
  virtual void init() = 0;
  virtual void writeBytes(const uint8_t *data, size_t length) = 0;
  virtual void commandStart(uint8_t cmd) = 0;
  virtual void commandEnd() = 0;

  inline void writeCommand(uint8_t cmd, const uint8_t *data, size_t size) {
    commandStart(cmd);
    writeBytes(data, size);
    commandEnd();
  }

  inline void writeCommand(uint8_t cmd) { writeCommand(cmd, nullptr, 0); }

  inline void writeCommand(uint8_t cmd, uint8_t data) {
    writeCommand(cmd, &data, 1);
  }
};

}  // namespace rawdisp
