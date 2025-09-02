#pragma once

#include <hardware/pwm.h>
#include <stdint.h>

#define TOUCH_ENABLED (0)

#include <LovyanGFX.hpp>

// https://akizukidenshi.com/catalog/g/g112031/


class LGFX_SSD1306 : public lgfx::LGFX_Device {
  lgfx::Bus_I2C _bus_instance;
  lgfx::Panel_SSD1306 _panel_instance;
  // lgfx::Light_PWM _light_instance;

#if TOUCH_ENABLED
  lgfx::Touch_CST816S _touch_instance;
#endif

 public:
  LGFX_SSD1306(int width, int height, int rotation = 0) {
    {
      auto cfg = _bus_instance.config();
      cfg.i2c_port = 0;
      cfg.freq_write = 400 * 1000;
      cfg.freq_read = 400 * 1000;
      cfg.pin_sda = 20;
      cfg.pin_scl = 21;
      _bus_instance.config(cfg);
      _panel_instance.setBus(&_bus_instance);
    }

    {
      auto cfg = _panel_instance.config();
      cfg.pin_rst = -1;
      cfg.pin_busy = -1;
      cfg.bus_shared = true;
      cfg.panel_width = (rotation & 1) ? height : width;
      cfg.panel_height = (rotation & 1) ? width : height;
      cfg.memory_width = cfg.panel_width;
      cfg.memory_height = cfg.panel_height;
      cfg.offset_x = 0;
      cfg.offset_y = 0;
      cfg.offset_rotation = rotation;
      // cfg.dummy_read_pixel = 8;
      // cfg.dummy_read_bits = 1;
      // cfg.readable = false;
      cfg.invert = false;
      // cfg.dlen_16bit = true;
      _panel_instance.config(cfg);
    }

    //{
    //  auto cfg = _light_instance.config();
    //  cfg.pin_bl = 25;
    //  cfg.invert = true;
    //  cfg.freq = 44100;
    //  cfg.pwm_channel = pwm_gpio_to_channel(cfg.pin_bl);
    //  _light_instance.config(cfg);
    //  _panel_instance.setLight(&_light_instance);
    //}
#if TOUCH_ENABLED
    {
      auto cfg = _touch_instance.config();
      cfg.x_min = 0;
      cfg.x_max = width - 1;
      cfg.y_min = 0;
      cfg.y_max = height - 1;
      cfg.bus_shared = false;
      cfg.offset_rotation = 0;
      cfg.i2c_port = 1;
      cfg.pin_int = -1;
      cfg.pin_sda = 6;
      cfg.pin_scl = 7;
      cfg.freq = 400 * 1000;
      _touch_instance.config(cfg);
      _panel_instance.setTouch(&_touch_instance);
    }
#endif

    setPanel(&_panel_instance);
  }
};

