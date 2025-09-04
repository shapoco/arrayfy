#pragma once

#include <pico/stdlib.h>

namespace rawdisp::gpio {

static inline void initMulti(uint32_t mask) { gpio_init_mask(mask); }
static inline void init(int port) { gpio_init(port); }

static inline void setDirMulti(uint32_t mask, bool output) {
  if (output) {
    gpio_set_dir_out_masked(mask);
  } else {
    gpio_set_dir_in_masked(mask);
  }
}

static inline void setDir(int port, bool output) { gpio_set_dir(port, output); }

static inline void writeMulti(uint32_t mask, uint32_t value) {
  gpio_put_masked(mask, value);
}

static inline void write(int port, bool value) { gpio_put(port, value); }

static inline bool read(int port) { return gpio_get(port); }

}  // namespace rawdisp::gpio