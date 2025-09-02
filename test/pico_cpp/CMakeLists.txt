cmake_minimum_required(VERSION 3.12)

set(APP_NAME display_test)
set(APP_INC_DIR ./include)
set(APP_SRC_DIR ./src)
set(SUBMODULE_DIR ../../submodules)
set(LGFX_DIR ${SUBMODULE_DIR}/LovyanGFX)

# Pull in PICO SDK (must be before project)
set(PICO_SDK_PATH $ENV{PICO_SDK_PATH})
include(${PICO_SDK_PATH}/pico_sdk_init.cmake)

project(${APP_NAME} C CXX ASM)

# Initialize the SDK
pico_sdk_init()

add_executable(${APP_NAME})

target_compile_options(${APP_NAME} PUBLIC -O2 -Wall)

add_subdirectory(${LGFX_DIR} lgfx)

file(GLOB CPP_FILES
    ${APP_SRC_DIR}/*.cpp
)

target_sources(${APP_NAME} PRIVATE 
    ${CPP_FILES}
)

target_include_directories(${APP_NAME} PRIVATE
    ${APP_INC_DIR}
    ${LGFX_DIR}/src
)

target_link_libraries(${APP_NAME} PRIVATE
    pico_stdlib
    pico_multicore
    hardware_dma
    hardware_spi
    hardware_i2c
    LovyanGFX
)

pico_enable_stdio_usb(${APP_NAME} 1)
pico_enable_stdio_uart(${APP_NAME} 0)

pico_add_extra_outputs(${APP_NAME})
