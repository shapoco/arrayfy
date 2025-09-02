#include <math.h>
#include <stdio.h>

#include "hardware/clocks.h"
#include "pico/stdlib.h"

#include "lgfx/lgfx_ssd1306.hpp"
#include "lgfx/lgfx_st7789.hpp"

#include "rawdisp/ili9488.hpp"
#include "rawdisp/st7789.hpp"

#include "bmp/argb8888_le_240x240.hpp"
#include "bmp/bw_hs_128x64.hpp"
#include "bmp/rgb111_480x320.hpp"
#include "bmp/rgb444_be_240x240.hpp"

namespace raw = rawdisp;

using namespace lgfx;

static constexpr uint32_t SPI_FREQ = 40000000;
static constexpr int SPI_SCK_PORT = 18;
static constexpr int SPI_MOSI_PORT = 19;

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

LGFX_SSD1306 lgfx1306(128, 64, 2);
LGFX_Sprite sprite1306(&lgfx1306);

raw::DisplayConfig cfg9488 = {
    .width = 480,
    .height = 320,
    .format = raw::PixelFormat::RGB111,
    .resetPort = 13,
};
raw::CommandDataSpi spi9488(spi0, 12, 15);
raw::ILI9488 raw9488(cfg9488, spi9488);

uint8_t buff[32 * 32 / 2];

int main(void) {
  set_sys_clock_khz(250000, true);
  sleep_ms(100);
  stdio_init_all();
  sleep_ms(500);

  gpio_init(SPI_SCK_PORT);
  gpio_init(SPI_MOSI_PORT);
  gpio_set_function(SPI_SCK_PORT, GPIO_FUNC_SPI);
  gpio_set_function(SPI_MOSI_PORT, GPIO_FUNC_SPI);
  spi_init(spi0, SPI_FREQ);

  spi9488.init();
  raw9488.init();

  raw9488.setWindow(0, 0, raw9488.WIDTH, raw9488.HEIGHT);
  raw9488.writePixels((uint8_t *)rgb111_480x320, sizeof(rgb111_480x320));

  raw9488.writeCommand(raw::ILI9488::Command::INTERFACE_PIXEL_FORMAT, 0x56);

// screen.init(getTimeMs());
#ifdef ST7789_LOW_API
  spi7789.init();
  raw7789.init();
  raw7789.setWindow(0, 0, raw7789.WIDTH, raw7789.HEIGHT);
  raw7789.writePixels((uint8_t *)rgb444_be_240x240, sizeof(rgb444_be_240x240));
#else
  lgfx7789.begin();
  fbuf7789.setColorDepth(16);
  fbuf7789.createSprite(lgfx7789.width(), lgfx7789.height());
  sprite7789.setColorDepth(2);
#endif
  lgfx1306.begin();

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

    sprite1306.setColorDepth(1);
    sprite1306.setBuffer((void *)bwHs128x64, 128, 64, 1);
    sprite1306.pushSprite(0, 0);

    shift = (shift + 1) % 32;
  }
}
