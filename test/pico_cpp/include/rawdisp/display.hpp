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
  const int WIDTH;
  const int HEIGHT;
  const PixelFormat FORMAT;
  const int RESET_PORT;

  Display(const DisplayConfig &cfg)
      : WIDTH(cfg.width),
        HEIGHT(cfg.height),
        FORMAT(cfg.format),
        RESET_PORT(cfg.resetPort) {}

  virtual void init() {
    if (RESET_PORT >= 0) {
      gpio::init(RESET_PORT);
      gpio::setDir(RESET_PORT, true);
    }
  }

  virtual void setWindow(int x, int y, int w, int h) = 0;
  virtual void writePixels(const void *data, size_t length) = 0;

  inline void clipRect(int *x, int *y, int *w, int *h) {
    clipCoord(x, w, WIDTH);
    clipCoord(y, h, HEIGHT);
  }
};

}  // namespace rawdisp