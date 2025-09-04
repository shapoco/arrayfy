#pragma once

#include <stddef.h>
#include <stdint.h>

namespace rawdisp {

class CommandDataBus {
 public:
  CommandDataBus() {}

  virtual void init() {}

  virtual void writeStart(bool command) = 0;
  virtual void writeEnd() = 0;
  virtual void writeBytes(const uint8_t *data, size_t length) = 0;
  virtual void writeCommand(uint8_t cmd, const uint8_t *params,
                            size_t size) = 0;
};

}  // namespace rawdisp
