#pragma once

#include "command_data_bus.hpp"
#include "display.hpp"

namespace rawdisp {

class CommandDataDisplay : public Display {
 public:
  CommandDataBus &bus;

  CommandDataDisplay(CommandDataBus &bus, const DisplayConfig &cfg)
      : Display(cfg), bus(bus) {}

  void init() override { Display::init(); }

};
}  // namespace rawdisp