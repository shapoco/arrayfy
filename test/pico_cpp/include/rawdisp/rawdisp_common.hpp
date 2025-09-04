#pragma once

#include <stddef.h>
#include <stdint.h>

#ifndef RAWDISP_INLINE
#define RAWDISP_INLINE inline __attribute__((always_inline))
#endif

namespace rawdisp {

enum class PixelFormat {
  RGB111,
  RGB444,
  RGB565,
  RGB666,
  KR11,
  BW,
};

static RAWDISP_INLINE void clipCoord(int *x, int *w, int max) {
  if (*x < 0) {
    if (*x + *w <= 0) {
      *w = 0;
      return;
    }
    *w += *x;
    *x = 0;
  }
  if (*x + *w > max) {
    if (*x >= max) {
      *w = 0;
      return;
    }
    *w = max - *x;
  }
}

static RAWDISP_INLINE int memBitsPerPixel(PixelFormat fmt) {
  switch (fmt) {
    case PixelFormat::RGB111:
      return 4;
    case PixelFormat::RGB565:
      return 16;
    case PixelFormat::RGB666:
      return 24;
    case PixelFormat::RGB444:
      return 12;
    case PixelFormat::KR11:
      return 2;
    case PixelFormat::BW:
      return 1;
    default:
      return -1;
  }
}

static RAWDISP_INLINE int pixelsPerTrans(PixelFormat fmt, size_t buffSize) {
  return buffSize * 8 / memBitsPerPixel(fmt);
}

}  // namespace rawdisp
