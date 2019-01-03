namespace TempHumPressSensor {
    enum THP_Constants {
      BIG_ENDIAN = 0,

      // BME280 default address.
      ADDRESS = 0x76,

      // Operating Modes
      OSAMPLE_1 = 1,
      OSAMPLE_2 = 2,
      OSAMPLE_4 = 3,
      OSAMPLE_8 = 4,
      OSAMPLE_16 = 5,

      // Standby Settings
      STANDBY_0p5 = 0,
      STANDBY_62p5 = 1,
      STANDBY_125 = 2,
      STANDBY_250 = 3,
      STANDBY_500 = 4,
      STANDBY_1000 = 5,
      STANDBY_10 = 6,
      STANDBY_20 = 7,

      // Filter Settings
      FILTER_off = 0,
      FILTER_2 = 1,
      FILTER_4 = 2,
      FILTER_8 = 3,
      FILTER_16 = 4,

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

      REG_CHIPID = 0xD0,
      REG_VERSION = 0xD1,
      REG_SOFTRESET = 0xE0,

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
    let THP_t_mode  = THP_Constants.OSAMPLE_2
    let THP_h_mode  = THP_Constants.OSAMPLE_4
    let THP_p_mode  = THP_Constants.OSAMPLE_4
    let THP_standby = THP_Constants.STANDBY_10
    let THP_filter  = THP_Constants.FILTER_8

    // "globals"
    let THP_t_fine = 0.0

    let THP_dig_T1 = 0
    let THP_dig_T2 = 0
    let THP_dig_T3 = 0

    let THP_dig_P1 = 0
    let THP_dig_P2 = 0
    let THP_dig_P3 = 0
    let THP_dig_P4 = 0
    let THP_dig_P5 = 0
    let THP_dig_P6 = 0
    let THP_dig_P7 = 0
    let THP_dig_P8 = 0
    let THP_dig_P9 = 0

    let THP_dig_H1 = 0
    let THP_dig_H2 = 0
    let THP_dig_H3 = 0
    let THP_dig_H4 = 0
    let THP_dig_H5 = 0
    let THP_dig_H6 = 0

    // I2C functions

    function I2C_WriteReg8(addr: number, reg: number, val: number) {
        let buf = pins.createBuffer(2)
        buf.setNumber(NumberFormat.UInt8BE, 0, reg)
        buf.setNumber(NumberFormat.UInt8BE, 1, val)
        pins.i2cWriteBuffer(addr, buf)
    }

    function I2C_ReadReg8(addr: number, reg: number, signed: number = 0): number {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, reg)
        pins.i2cWriteBuffer(addr, buf)
        buf = pins.i2cReadBuffer(addr, 1)
        let value = buf.getNumber(NumberFormat.UInt8BE, 0);

        // Signed value?
        if (signed){
            // Negative value?
            if (value & 0x80){
                value = value - 0x100
            }
        }

        return value
    }

    function I2C_ReadReg16(addr: number, reg: number, signed: number = 0, big_endian: number = 1): number {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, reg)
        pins.i2cWriteBuffer(addr, buf)
        buf = pins.i2cReadBuffer(addr, 2)
        let value = 0;

        // Format based on big endian or little endian
        if(big_endian){
            value = (buf.getNumber(NumberFormat.UInt8BE, 0) << 8) | buf.getNumber(NumberFormat.UInt8BE, 1);
        }else{
            value = (buf.getNumber(NumberFormat.UInt8BE, 1) << 8) | buf.getNumber(NumberFormat.UInt8BE, 0);
        }

        // Signed value?
        if (signed){
            // Negative value?
            if (value & 0x8000){
                value = value - 0x10000
            }
        }

        return value
    }

    function I2C_ReadRegList(addr: number, reg: number, len: number): number[] {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, reg)
        pins.i2cWriteBuffer(addr, buf)
        buf = pins.i2cReadBuffer(addr, len)
        let list: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        for (let b = 0; b < len; b++) {
            list[b] = buf.getNumber(NumberFormat.UInt8BE, b);
        }
        return list
    }

    //% block
    export function THP_initialize() {
        // load calibration values.
        THP_load_calibration()
        I2C_WriteReg8(THP_Constants.ADDRESS, THP_Constants.REG_CONTROL, 0x24)  // Sleep mode
        basic.pause(2)

        // set the standby time
        I2C_WriteReg8(THP_Constants.ADDRESS, THP_Constants.REG_CONFIG, ((THP_standby << 5) | (THP_filter << 2)))
        basic.pause(2)

        // set the sample modes
        I2C_WriteReg8(THP_Constants.ADDRESS, THP_Constants.REG_CONTROL_HUM, THP_h_mode)  // Set Humidity Oversample
        I2C_WriteReg8(THP_Constants.ADDRESS, THP_Constants.REG_CONTROL, ((THP_t_mode << 5) | (THP_p_mode << 2) | 3))  // Set Temp/Pressure Oversample and enter Normal mode
    }

    function THP_load_calibration(){
        // Read calibration data

        THP_dig_T1 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_T1, 0, THP_Constants.BIG_ENDIAN)
        THP_dig_T2 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_T2, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_T3 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_T3, 1, THP_Constants.BIG_ENDIAN)

        THP_dig_P1 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P1, 0, THP_Constants.BIG_ENDIAN)
        THP_dig_P2 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P2, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_P3 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P3, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_P4 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P4, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_P5 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P5, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_P6 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P6, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_P7 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P7, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_P8 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P8, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_P9 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_P9, 1, THP_Constants.BIG_ENDIAN)

        THP_dig_H1 = I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H1)
        THP_dig_H2 = I2C_ReadReg16(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H2, 1, THP_Constants.BIG_ENDIAN)
        THP_dig_H3 = I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H3)
        THP_dig_H6 = I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H7, 1)

        let h4 = I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H4, 1)
        h4 = (h4 << 4)
        THP_dig_H4 = h4 | (I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H5) & 0x0F)

        let h5 = I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H6, 1)
        h5 = (h5 << 4)
        THP_dig_H5 = h5 | (I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_DIG_H5) >> 4 & 0x0F)
    }


    function THP_read_raw_temp(){
        // read raw temperature data once it's available
        while (I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_STATUS) & 0x08){
            basic.pause(2)
        }
        let data = I2C_ReadRegList(THP_Constants.ADDRESS, THP_Constants.REG_TEMP_DATA, 3)
        return ((data[0] << 16) | (data[1] << 8) | data[2]) >> 4
    }

    function THP_read_raw_pressure(){
        // read raw pressure data once it's available
        while (I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_STATUS) & 0x08){
            basic.pause(2)
        }
        let data = I2C_ReadRegList(THP_Constants.ADDRESS, THP_Constants.REG_PRESSURE_DATA, 3)
        return ((data[0] << 16) | (data[1] << 8) | data[2]) >> 4
    }

    function THP_read_raw_humidity(){
        // read raw humidity data once it's available
        while (I2C_ReadReg8(THP_Constants.ADDRESS, THP_Constants.REG_STATUS) & 0x08){
            basic.pause(2)
        }
        let data = I2C_ReadRegList(THP_Constants.ADDRESS, THP_Constants.REG_HUMIDITY_DATA, 2)
        return (data[0] << 8) | data[1]
    }

    //% block
    export function THP_read_temperature(){
        /*Get the temperature

        Returns temperature in degrees celsius.*/

        // float in Python is double precision
        let val = THP_read_raw_temp()
        let var1 = (val / 16384.0 - THP_dig_T1 / 1024.0) * THP_dig_T2
        let var2 = ((val / 131072.0 - THP_dig_T1 / 8192.0) * (val / 131072.0 - THP_dig_T1 / 8192.0)) * THP_dig_T3
        THP_t_fine = var1 + var2
        return (var1 + var2) / 5120.0
    }

    //% block
    export function THP_read_humidity(){
        /*Get the humidity

        Returns the temperature-compensated humidity. read_temperature must be called to update the temperature compensation.*/

        let adc = THP_read_raw_humidity()
        // print 'Raw humidity = {0:d}'.format (adc)
        let h = THP_t_fine - 76800.0
        h = (adc - (THP_dig_H4 * 64.0 + THP_dig_H5 / 16384.0 * h)) * (THP_dig_H2 / 65536.0 * (1.0 + THP_dig_H6 / 67108864.0 * h * (1.0 + THP_dig_H3 / 67108864.0 * h)))
        h = h * (1.0 - THP_dig_H1 * h / 524288.0)
        if(h > 100){
            h = 100
        }else if(h < 0){
            h = 0
        }
        return h
    }

    //% block
    export function THP_read_pressure(){
        /*Get the pressure

        Returns the temperature-compensated pressure in Pascals. read_temperature must be called to update the temperature compensation.*/

        let adc = THP_read_raw_pressure()
        let var1 = THP_t_fine / 2.0 - 64000.0
        let var2 = var1 * var1 * THP_dig_P6 / 32768.0
        var2 = var2 + var1 * THP_dig_P5 * 2.0
        var2 = var2 / 4.0 + THP_dig_P4 * 65536.0
        var1 = (THP_dig_P3 * var1 * var1 / 524288.0 + THP_dig_P2 * var1) / 524288.0
        var1 = (1.0 + var1 / 32768.0) * THP_dig_P1
        if (var1 == 0){
            return 0
        }
        let p = 1048576.0 - adc
        p = ((p - var2 / 4096.0) * 6250.0) / var1
        var1 = THP_dig_P9 * p * p / 2147483648.0
        var2 = p * THP_dig_P8 / 32768.0
        return p + (var1 + var2 + THP_dig_P7) / 16.0
    }

    function THP_read_temperature_f(){
        // Wrapper to get temp in F
        return THP_read_temperature() * 1.8 + 32
    }

    function THP_read_dewpoint(){
        // Return calculated dewpoint in C, only accurate at > 50% RH
        return THP_read_temperature() - ((100 - THP_read_humidity()) / 5)
    }

    function THP_read_dewpoint_f(){
        // Return calculated dewpoint in F, only accurate at > 50% RH
        return THP_read_dewpoint() * 1.8 + 32
    }

    function THP_read_pressure_inches(){
        // Wrapper to get pressure in inches of Hg
        return THP_read_pressure() * 0.0002953
    }
}
