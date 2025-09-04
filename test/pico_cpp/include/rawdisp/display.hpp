#pragma once

#include <stdint.h>

#include "rawdisp/gpio.hpp"
#include "rawdisp/rawdisp_common.hpp"

namespace rawdisp {

struct DisplayConfig {
  int width;
  int height;
  PixelFormat format;
  int resetPort;
};

class Display {
 public:
  const int width;
  const int height;
  const PixelFormat format;
  const int resetPort;

  Display(const DisplayConfig &cfg)
      : width(cfg.width),
        height(cfg.height),
        format(cfg.format),
        resetPort(cfg.resetPort) {}

  virtual void init() {
    if (resetPort >= 0) {
      gpio::init(resetPort);
      gpio::setDir(resetPort, true);
    }
  }

  virtual void setWindow(int x, int y, int w, int h) = 0;
  virtual void writePixels(const void *data, size_t length, int plane = 0) = 0;

  inline void clipRect(int *x, int *y, int *w, int *h) {
    clipCoord(x, w, width);
    clipCoord(y, h, height);
  }
};

}  // namespace rawdisp