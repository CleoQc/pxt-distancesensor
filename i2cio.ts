    // I2C functions
namespace diI2C {
  export function WriteReg8(addr: number, reg: number, val: number) {
    let buf = pins.createBuffer(2)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    buf.setNumber(NumberFormat.UInt8BE, 1, val)
    pins.i2cWriteBuffer(addr, buf, false)
  }

  export function WriteReg16(addr: number, reg: number, val: number) {
    let buf = pins.createBuffer(3)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    // Big endian
    buf.setNumber(NumberFormat.UInt8BE, 1, ((val >> 8) & 0xFF))
    buf.setNumber(NumberFormat.UInt8BE, 2, (val & 0xFF))
    pins.i2cWriteBuffer(addr, buf, false)
  }

  export function WriteReg32(addr: number, reg: number, val: number) {
    let buf = pins.createBuffer(5)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    // Big endian
    buf.setNumber(NumberFormat.UInt8BE, 1, ((val >> 24) & 0xFF))
    buf.setNumber(NumberFormat.UInt8BE, 2, ((val >> 16) & 0xFF))
    buf.setNumber(NumberFormat.UInt8BE, 3, ((val >> 8) & 0xFF))
    buf.setNumber(NumberFormat.UInt8BE, 4, (val & 0xFF))
    pins.i2cWriteBuffer(addr, buf, false)
  }

  export function WriteRegList(addr: number, reg: number, list: number[], len: number) {
    let buf = pins.createBuffer(1 + len)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    for (let b = 0; b < len; b++) {
        buf.setNumber(NumberFormat.UInt8BE, 1 + b, list[b])
    }
    pins.i2cWriteBuffer(addr, buf, false)
  }

  export function ReadReg8(addr: number, reg: number, signed: number=0): number {
    let buf = pins.createBuffer(1)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    pins.i2cWriteBuffer(addr, buf, true)
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

  export function ReadReg16(addr: number, reg: number, signed: number = 0, big_endian: number = 1): number {
    let buf = pins.createBuffer(1)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    pins.i2cWriteBuffer(addr, buf, true)
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

      return value  }

  export function ReadReg32(addr: number, reg: number): number {
    let buf = pins.createBuffer(1)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    pins.i2cWriteBuffer(addr, buf, true)
    buf = pins.i2cReadBuffer(addr, 4)
    // Big endian
    return ((buf.getNumber(NumberFormat.UInt8BE, 0) << 24) | (buf.getNumber(NumberFormat.UInt8BE, 1) << 16) | (buf.getNumber(NumberFormat.UInt8BE, 2) << 8) | buf.getNumber(NumberFormat.UInt8BE, 3));
  }

  export function ReadRegList(addr: number, reg: number, len: number): number[] {
    let buf = pins.createBuffer(1)
    buf.setNumber(NumberFormat.UInt8BE, 0, reg)
    pins.i2cWriteBuffer(addr, buf, true)
    buf = pins.i2cReadBuffer(addr, len)
    let list: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (let b = 0; b < len; b++) {
        list[b] = buf.getNumber(NumberFormat.UInt8BE, b);
    }
    return list
  }
}