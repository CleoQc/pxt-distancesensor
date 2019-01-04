namespace TempHumPressSensor {
  enum Constants {
    BIG_ENDIAN = 0,

    // BME280 default address.
    ADDRESS = 0x76,

    // Operating Modes
    // OSAMPLE_1 = 1,
    OSAMPLE_2 = 2,
    OSAMPLE_4 = 3,
    // OSAMPLE_8 = 4,
    // OSAMPLE_16 = 5,

    // Standby Settings
    // STANDBY_0p5 = 0,
    // STANDBY_62p5 = 1,
    // STANDBY_125 = 2,
    // STANDBY_250 = 3,
    // STANDBY_500 = 4,
    // STANDBY_1000 = 5,
    STANDBY_10 = 6,
    // STANDBY_20 = 7,

    // Filter Settings
    // FILTER_off = 0,
    // FILTER_2 = 1,
    // FILTER_4 = 2,
    FILTER_8 = 3,
    // FILTER_16 = 4,

    // BME280 Registers
    REG_DIG_T1 = 0x88,  // Trimming parameter registers
    REG_DIG_T2 = 0x8A,
    REG_DIG_T3 = 0x8C,

    REG_DIG_P1 = 0x8E,
    REG_DIG_P2 = 0x90,
    REG_DIG_P3 = 0x92,
    REG_DIG_P4 = 0x94,
    REG_DIG_P5 = 0x96,
    REG_DIG_P6 = 0x98,
    REG_DIG_P7 = 0x9A,
    REG_DIG_P8 = 0x9C,
    REG_DIG_P9 = 0x9E,

    REG_DIG_H1 = 0xA1,
    REG_DIG_H2 = 0xE1,
    REG_DIG_H3 = 0xE3,
    REG_DIG_H4 = 0xE4,
    REG_DIG_H5 = 0xE5,
    REG_DIG_H6 = 0xE6,
    REG_DIG_H7 = 0xE7,

    // REG_CHIPID = 0xD0,
    // REG_VERSION = 0xD1,
    // REG_SOFTRESET = 0xE0,

    REG_STATUS = 0xF3,
    REG_CONTROL_HUM = 0xF2,
    REG_CONTROL = 0xF4,
    REG_CONFIG = 0xF5,
    //REG_DATA = 0xF7,
    REG_PRESSURE_DATA = 0xF7,
    REG_TEMP_DATA     = 0xFA,
    REG_HUMIDITY_DATA = 0xFD
  }

  // Define the mode settings to be used
  let t_mode  = Constants.OSAMPLE_2
  let h_mode  = Constants.OSAMPLE_4
  let p_mode  = Constants.OSAMPLE_4
  let standby = Constants.STANDBY_10
  let filter  = Constants.FILTER_8

  // "globals"
  let t_fine = 0.0

  let dig_T1 = 0
  let dig_T2 = 0
  let dig_T3 = 0

  let dig_P1 = 0
  let dig_P2 = 0
  let dig_P3 = 0
  let dig_P4 = 0
  let dig_P5 = 0
  let dig_P6 = 0
  let dig_P7 = 0
  let dig_P8 = 0
  let dig_P9 = 0

  let dig_H1 = 0
  let dig_H2 = 0
  let dig_H3 = 0
  let dig_H4 = 0
  let dig_H5 = 0
  let dig_H6 = 0

  export function initialize() {
      // load calibration values.
      load_calibration()
      diI2C.WriteReg8(Constants.ADDRESS, Constants.REG_CONTROL, 0x24)  // Sleep mode
      basic.pause(2)

      // set the standby time
      diI2C.WriteReg8(Constants.ADDRESS, Constants.REG_CONFIG, ((standby << 5) | (filter << 2)))
      basic.pause(2)

      // set the sample modes
      diI2C.WriteReg8(Constants.ADDRESS, Constants.REG_CONTROL_HUM, h_mode)  // Set Humidity Oversample
      diI2C.WriteReg8(Constants.ADDRESS, Constants.REG_CONTROL, ((t_mode << 5) | (p_mode << 2) | 3))  // Set Temp/Pressure Oversample and enter Normal mode
  }

  function load_calibration(){
      // Read calibration data

      dig_T1 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_T1, 0, Constants.BIG_ENDIAN)
      dig_T2 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_T2, 1, Constants.BIG_ENDIAN)
      dig_T3 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_T3, 1, Constants.BIG_ENDIAN)

      dig_P1 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P1, 0, Constants.BIG_ENDIAN)
      dig_P2 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P2, 1, Constants.BIG_ENDIAN)
      dig_P3 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P3, 1, Constants.BIG_ENDIAN)
      dig_P4 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P4, 1, Constants.BIG_ENDIAN)
      dig_P5 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P5, 1, Constants.BIG_ENDIAN)
      dig_P6 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P6, 1, Constants.BIG_ENDIAN)
      dig_P7 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P7, 1, Constants.BIG_ENDIAN)
      dig_P8 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P8, 1, Constants.BIG_ENDIAN)
      dig_P9 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_P9, 1, Constants.BIG_ENDIAN)

      dig_H1 = diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_DIG_H1)
      dig_H2 = diI2C.ReadReg16(Constants.ADDRESS, Constants.REG_DIG_H2, 1, Constants.BIG_ENDIAN)
      dig_H3 = diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_DIG_H3)
      dig_H6 = diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_DIG_H7, 1)

      let h4 = diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_DIG_H4, 1)
      h4 = (h4 << 4)
      dig_H4 = h4 | (diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_DIG_H5) & 0x0F)

      let h5 = diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_DIG_H6, 1)
      h5 = (h5 << 4)
      dig_H5 = h5 | (diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_DIG_H5) >> 4 & 0x0F)
  }


  function read_raw_temp(){
      // read raw temperature data once it's available
      while (diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_STATUS) & 0x08){
          basic.pause(2)
      }
      let data = diI2C.ReadRegList(Constants.ADDRESS, Constants.REG_TEMP_DATA, 3)
      return ((data[0] << 16) | (data[1] << 8) | data[2]) >> 4
  }

  function read_raw_pressure(){
      // read raw pressure data once it's available
      while (diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_STATUS) & 0x08){
          basic.pause(2)
      }
      let data = diI2C.ReadRegList(Constants.ADDRESS, Constants.REG_PRESSURE_DATA, 3)
      return ((data[0] << 16) | (data[1] << 8) | data[2]) >> 4
  }

  function read_raw_humidity(){
      // read raw humidity data once it's available
      while (diI2C.ReadReg8(Constants.ADDRESS, Constants.REG_STATUS) & 0x08){
          basic.pause(2)
      }
      let data = diI2C.ReadRegList(Constants.ADDRESS, Constants.REG_HUMIDITY_DATA, 2)
      return (data[0] << 8) | data[1]
  }

  export function read_temperature(){
      /*Get the temperature
      Returns temperature in degrees celsius.
      */

      // float in Python is double precision
  
      let val = read_raw_temp()
      let var1 = (val / 16384.0 - dig_T1 / 1024.0) * dig_T2
      let var2 = ((val / 131072.0 - dig_T1 / 8192.0) * (val / 131072.0 - dig_T1 / 8192.0)) * dig_T3
      t_fine = var1 + var2
      return (var1 + var2) / 5120.0
  }

  export function read_humidity(){
      /*Get the humidity
      Returns the temperature-compensated humidity. read_temperature must be called to update the temperature compensation.
      */

      let adc = read_raw_humidity()
      // print 'Raw humidity = {0:d}'.format (adc)
      let h = t_fine - 76800.0
      h = (adc - (dig_H4 * 64.0 + dig_H5 / 16384.0 * h)) * (dig_H2 / 65536.0 * (1.0 + dig_H6 / 67108864.0 * h * (1.0 + dig_H3 / 67108864.0 * h)))
      h = h * (1.0 - dig_H1 * h / 524288.0)
      if(h > 100){
          h = 100
      }else if(h < 0){
          h = 0
      }
      return h
  }

  export function read_pressure(){
      /*Get the pressure
      Returns the temperature-compensated pressure in Pascals. read_temperature must be called to update the temperature compensation.
      */

      let adc = read_raw_pressure()
      let var1 = t_fine / 2.0 - 64000.0
      let var2 = var1 * var1 * dig_P6 / 32768.0
      var2 = var2 + var1 * dig_P5 * 2.0
      var2 = var2 / 4.0 + dig_P4 * 65536.0
      var1 = (dig_P3 * var1 * var1 / 524288.0 + dig_P2 * var1) / 524288.0
      var1 = (1.0 + var1 / 32768.0) * dig_P1
      if (var1 == 0){
          return 0
      }
      let p = 1048576.0 - adc
      p = ((p - var2 / 4096.0) * 6250.0) / var1
      var1 = dig_P9 * p * p / 2147483648.0
      var2 = p * dig_P8 / 32768.0
      return p + (var1 + var2 + dig_P7) / 16.0
  }

  // function read_temperature_f(){
  //     // Wrapper to get temp in F
  //     return read_temperature() * 1.8 + 32
  // }

  export function read_dewpoint(){
      // Return calculated dewpoint in C, only accurate at > 50% RH
      return read_temperature() - ((100 - read_humidity()) / 5)
  }

  // function read_dewpoint_f(){
  //     // Return calculated dewpoint in F, only accurate at > 50% RH
  //     return read_dewpoint() * 1.8 + 32
  // }

  // function read_pressure_inches(){
  //     // Wrapper to get pressure in inches of Hg
  //     return read_pressure() * 0.0002953
  // }
}
