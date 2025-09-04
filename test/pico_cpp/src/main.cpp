#include <math.h>
#include <stdio.h>

#include "hardware/clocks.h"
#include "pico/stdlib.h"

#include "lgfx/lgfx_ssd1306.hpp"
#include "lgfx/lgfx_st7789.hpp"

#include "rawdisp/ili9488.hpp"
#include "rawdisp/ssd1306.hpp"
#include "rawdisp/ssd1680.hpp"
#include "rawdisp/st7789.hpp"

#include "bmp/argb8888_le_240x240.hpp"
#include "bmp/bw_hs_128x64.hpp"
#include "bmp/bw_hs_152x296_k.hpp"
#include "bmp/bw_hs_152x296_r.hpp"
#include "bmp/bw_vs_128x64.hpp"
#include "bmp/bw_vs_296x152_k.hpp"
#include "bmp/bw_vs_296x152_r.hpp"
#include "bmp/rgb111_480x320.hpp"
#include "bmp/rgb444_be_240x240.hpp"

namespace raw = rawdisp;
namespace gpio = raw::gpio;

using namespace lgfx;

static constexpr uint32_t SPI_FREQ_SSD1680 = 10000000;
static constexpr uint32_t SPI_FREQ_FAST = 40000000;
static constexpr int SPI_SCK_PORT = 18;
static constexpr int SPI_MOSI_PORT = 19;

static constexpr uint32_t I2C_FREQ = 400000;
static constexpr int I2C_SDA_PORT = 20;
static constexpr int I2C_SCL_PORT = 21;

#define SSD1306_LOW_API
#define ST7789_LOW_API

#ifdef ST7789_LOW_API
raw::DisplayConfig cfg7789 = {
    .width = 480,
    .height = 320,
    .format = raw::PixelFormat::RGB444,
    .resetPort = 14,
};
raw::CommandDataSpi spi7789(spi0, 17, 15);
raw::ST7789 raw7789(cfg7789, spi7789);
#else
LGFX_ST7789 lgfx7789(240, 240, 0);
LGFX_Sprite fbuf7789(&lgfx7789);
LGFX_Sprite sprite7789(&fbuf7789);
#endif

#ifdef SSD1306_LOW_API
raw::DisplayConfig cfg1306 = {
    .width = 128,
    .height = 64,
    .format = raw::PixelFormat::BW,
    .resetPort = -1,
};
raw::CommandDataI2c i2c1306(i2c0, 0x3C);
raw::SSD1306 raw1306(cfg1306, i2c1306, 2);
#else
LGFX_SSD1306 lgfx1306(128, 64, 2);
LGFX_Sprite sprite1306(&lgfx1306);
#endif

raw::DisplayConfig cfg9488 = {
    .width = 480,
    .height = 320,
    .format = raw::PixelFormat::RGB111,
    .resetPort = 13,
};
raw::CommandDataSpi spi9488(spi0, 12, 15);
raw::ILI9488 raw9488(cfg9488, spi9488);

uint8_t buff[32 * 32 / 2];

bool i2cBusReset();

int main(void) {
  set_sys_clock_khz(250000, true);
  sleep_ms(100);
  // stdio_init_all();
  sleep_ms(500);

  gpio_init(SPI_SCK_PORT);
  gpio_init(SPI_MOSI_PORT);
  gpio_set_function(SPI_SCK_PORT, GPIO_FUNC_SPI);
  gpio_set_function(SPI_MOSI_PORT, GPIO_FUNC_SPI);

  gpio_init(I2C_SDA_PORT);
  gpio_init(I2C_SCL_PORT);
  gpio_set_function(I2C_SDA_PORT, GPIO_FUNC_I2C);
  gpio_set_function(I2C_SCL_PORT, GPIO_FUNC_I2C);

  spi_init(spi0, SPI_FREQ_SSD1680);

  i2cBusReset();
  i2c_init(i2c0, I2C_FREQ);

  spi9488.init();
  raw9488.init();

  raw9488.setWindow(0, 0, raw9488.width, raw9488.height);
  raw9488.writePixels((uint8_t *)rgb111_480x320, sizeof(rgb111_480x320));

  raw9488.writeCommand(raw::ILI9488::Command::INTERFACE_PIXEL_FORMAT, 0x56);

// screen.init(getTimeMs());
#ifdef ST7789_LOW_API
  spi7789.init();
  raw7789.init();
  raw7789.setWindow(0, 0, raw7789.width, raw7789.height);
  raw7789.writePixels((uint8_t *)rgb444_be_240x240, sizeof(rgb444_be_240x240));
#else
  lgfx7789.begin();
  fbuf7789.setColorDepth(16);
  fbuf7789.createSprite(lgfx7789.width(), lgfx7789.height());
  sprite7789.setColorDepth(2);
#endif

#ifdef SSD1306_LOW_API
  i2c1306.init();
  raw1306.init();
  raw1306.setWindow(0, 0, raw1306.width, raw1306.height);
  raw1306.writePixels((uint8_t *)bw_vs_128x64, sizeof(bw_vs_128x64));
#else
  lgfx1306.begin();
  sprite1306.setColorDepth(1);
  sprite1306.setBuffer((void *)bwHs128x64, 128, 64, 1);
  lgfx1306.pushGrayscaleImage(0, 0, 128, 64, (uint8_t *)bwHs128x64,
                              color_depth_t::grayscale_1bit, 0xFFFFFFu,
                              0x000000u);
#endif

  int shift = 0;
  // sprite7789.setBuffer((void*)imageArray240x240argb8888, 240, 240, 32);

  // sprite7789.setColorDepth(1);
  // sprite7789.setBuffer((void*)imageArrayBw, 240, 240, 1);
  // sprite7789.setBuffer((void*)imageArrayGray2, 240, 240, 2);
  //  sprite.setColorDepth(4);
  //  sprite.setBuffer((void*)imageArrayGray4, 240, 240, 4);
  //  sprite7789.setBuffer((void*)imageArrayRgb332, 240, 240, 8);
  //  sprite7789.setBuffer((void*)imageArrayRgb565, 240, 240, 16);
  //  sprite7789.setBuffer((void*)imageArrayRgb666, 240, 240, 18);
  //  sprite7789.setBuffer((void*)imageArrayRgb888, 240, 240, 24);

  shift = (shift + 1) % 32;

  for (int rot1680 = 0; rot1680 < 4; rot1680++) {
    raw::DisplayConfig cfg1680 = {
        .width = 152,
        .height = 296,
        .format = raw::PixelFormat::KR11,
        .resetPort = 10,
    };
    raw::CommandDataSpi spi1680(spi0, 9, 8);
    raw::SSD1680 raw1680(cfg1680, spi1680, 11, rot1680);
    spi1680.init();
    raw1680.init();
    raw1680.setWindow(0, 0, raw1680.width, raw1680.height);
    if ((rot1680 & 1) == 0) {
      raw1680.writePixels((uint8_t *)bw_hs_152x296_k, sizeof(bw_hs_152x296_k),
                          raw::SSD1680::Plane::PLANE_BLACK);
      raw1680.writePixels((uint8_t *)bw_hs_152x296_r, sizeof(bw_hs_152x296_r),
                          raw::SSD1680::Plane::PLANE_RED);
    } else {
      raw1680.writePixels((uint8_t *)bw_vs_296x152_k, sizeof(bw_vs_296x152_k),
                          raw::SSD1680::Plane::PLANE_BLACK);
      raw1680.writePixels((uint8_t *)bw_vs_296x152_r, sizeof(bw_vs_296x152_r),
                          raw::SSD1680::Plane::PLANE_RED);
    }
    raw1680.startUpdateDisplay();
    raw1680.waitBusy();
    sleep_ms(3000);
  }
  // raw1680.waitBusy();

  while (true) {
    // sprite7789.pushSprite(0, 0);

    //    fbuf7789.pushGrayscaleImage(0, 0, 240, 240,
    //    (uint8_t*)imageArrayGray4, color_depth_t::grayscale_4bit,
    //                                    0xFFFFFFu, 0x000000u);

#ifndef ST7789_LOW_API
    for (int y = 0; y < 240 + 32; y += 16) {
      for (int x = 0; x < 240 + 32; x += 16) {
        int i = (y / 16) + (x / 16);
        fbuf7789.fillRect(x - shift, y - shift, 16, 16,
                          (i & 1) ? 0xFFFF : 0xC618);
      }
    }

    fbuf7789.pushAlphaImage(0, 0, 240, 240, (argb8888_t *)argb8888Le240x240);
    fbuf7789.pushSprite(0, 0);
#endif
  }
}

bool i2cBusReset() {
  constexpr uint8_t MAX_RETRIES = 3;
  constexpr uint8_t MAX_SCL_PULSES = 16;

  gpio_init(I2C_SDA_PORT);
  gpio_init(I2C_SCL_PORT);
  gpio_set_function(I2C_SDA_PORT, GPIO_FUNC_SIO);
  gpio_set_function(I2C_SCL_PORT, GPIO_FUNC_SIO);

  // change I2C pins to GPIO mode
  // disable();
  // gpio::setPullup(I2C_SDA_PORT, true);
  // gpio::setPullup(I2C_SCL_PORT, true);
  gpio::setDirMulti((1 << I2C_SDA_PORT) | (1 << I2C_SCL_PORT), false);
  gpio::writeMulti((1 << I2C_SDA_PORT) | (1 << I2C_SCL_PORT), 0);

  bool success = false;
  if (gpio::read(I2C_SDA_PORT)) {
    // SDA is already high, no need to reset
    success = true;
  } else {
    for (uint8_t i = MAX_RETRIES; i != 0; i--) {
      // send SCL pulses until SDA is high
      gpio::setDir(I2C_SDA_PORT, false);
      gpio::setDir(I2C_SCL_PORT, true);
      sleep_us(50);
      for (uint8_t j = MAX_SCL_PULSES; j != 0; j--) {
        gpio::setDir(I2C_SCL_PORT, false);
        sleep_us(50);
        gpio::setDir(I2C_SCL_PORT, true);
        sleep_us(50);
        if (gpio::read(I2C_SDA_PORT)) break;
      }

      // send stop condition
      gpio::setDir(I2C_SDA_PORT, true);
      sleep_us(50);
      gpio::setDir(I2C_SCL_PORT, false);
      sleep_us(50);
      gpio::setDir(I2C_SDA_PORT, false);
      sleep_us(50);

      // check SDA state
      if (gpio::read(I2C_SDA_PORT)) {
        success = true;
        break;
      }
    }
  }

  gpio_set_function(I2C_SDA_PORT, GPIO_FUNC_I2C);
  gpio_set_function(I2C_SCL_PORT, GPIO_FUNC_I2C);

  return success;
}
