
namespace distanceSensor {
  enum DS_Constants {
      SYSRANGE_START = 0x00,

      SYSTEM_THRESH_HIGH = 0x0C,
      SYSTEM_THRESH_LOW = 0x0E,

      SYSTEM_SEQUENCE_CONFIG = 0x01,
      SYSTEM_RANGE_CONFIG = 0x09,
      SYSTEM_INTERMEASUREMENT_PERIOD = 0x04,

      SYSTEM_INTERRUPT_CONFIG_GPIO = 0x0A,

      GPIO_HV_MUX_ACTIVE_HIGH = 0x84,

      SYSTEM_INTERRUPT_CLEAR = 0x0B,

      RESULT_INTERRUPT_STATUS = 0x13,
      RESULT_RANGE_STATUS = 0x14,

      RESULT_CORE_AMBIENT_WINDOW_EVENTS_RTN = 0xBC,
      RESULT_CORE_RANGING_TOTAL_EVENTS_RTN = 0xC0,
      RESULT_CORE_AMBIENT_WINDOW_EVENTS_REF = 0xD0,
      RESULT_CORE_RANGING_TOTAL_EVENTS_REF = 0xD4,
      RESULT_PEAK_SIGNAL_RATE_REF = 0xB6,

      ALGO_PART_TO_PART_RANGE_OFFSET_MM = 0x28,

      I2C_SLAVE_DEVICE_ADDRESS = 0x8A,

      MSRC_CONFIG_CONTROL = 0x60,

      PRE_RANGE_CONFIG_MIN_SNR = 0x27,
      PRE_RANGE_CONFIG_VALID_PHASE_LOW = 0x56,
      PRE_RANGE_CONFIG_VALID_PHASE_HIGH = 0x57,
      PRE_RANGE_MIN_COUNT_RATE_RTN_LIMIT = 0x64,

      FINAL_RANGE_CONFIG_MIN_SNR = 0x67,
      FINAL_RANGE_CONFIG_VALID_PHASE_LOW = 0x47,
      FINAL_RANGE_CONFIG_VALID_PHASE_HIGH = 0x48,
      FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT = 0x44,

      PRE_RANGE_CONFIG_SIGMA_THRESH_HI = 0x61,
      PRE_RANGE_CONFIG_SIGMA_THRESH_LO = 0x62,

      PRE_RANGE_CONFIG_VCSEL_PERIOD = 0x50,
      PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI = 0x51,
      PRE_RANGE_CONFIG_TIMEOUT_MACROP_LO = 0x52,

      SYSTEM_HISTOGRAM_BIN = 0x81,
      HISTOGRAM_CONFIG_INITIAL_PHASE_SELECT = 0x33,
      HISTOGRAM_CONFIG_READOUT_CTRL = 0x55,

      FINAL_RANGE_CONFIG_VCSEL_PERIOD = 0x70,
      FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI = 0x71,
      FINAL_RANGE_CONFIG_TIMEOUT_MACROP_LO = 0x72,
      CROSSTALK_COMPENSATION_PEAK_RATE_MCPS = 0x20,

      MSRC_CONFIG_TIMEOUT_MACROP = 0x46,

      SOFT_RESET_GO2_SOFT_RESET_N = 0xBF,
      IDENTIFICATION_MODEL_ID = 0xC0,
      IDENTIFICATION_REVISION_ID = 0xC2,

      OSC_CALIBRATE_VAL = 0xF8,

      GLOBAL_CONFIG_VCSEL_WIDTH = 0x32,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_0 = 0xB0,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_1 = 0xB1,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_2 = 0xB2,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_3 = 0xB3,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_4 = 0xB4,
      GLOBAL_CONFIG_SPAD_ENABLES_REF_5 = 0xB5,

      GLOBAL_CONFIG_REF_EN_START_SELECT = 0xB6,
      DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD = 0x4E,
      DYNAMIC_SPAD_REF_EN_START_OFFSET = 0x4F,
      POWER_MANAGEMENT_GO1_POWER_FORCE = 0x80,

      VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV = 0x89,

      ALGO_PHASECAL_LIM = 0x30,
      ALGO_PHASECAL_CONFIG_TIMEOUT = 0x30,

      ADDRESS_DEFAULT = 0x29,
      ADDRESS_TARGET = 0x2A
  }

  enum DS_IndexSequenceStepEnables {
      tcc,
      msrc,
      dss,
      pre_range,
      final_range
  }

  enum DS_IndexSequenceStepTimeouts {
      pre_range_vcsel_period_pclks,
      final_range_vcsel_period_pclks,
      msrc_dss_tcc_mclks,
      pre_range_mclks,
      final_range_mclks,
      msrc_dss_tcc_us,
      pre_range_us,
      final_range_us
  }

  let DS_VcselPeriodPreRange = 0
  let DS_VcselPeriodFinalRange = 1

  // "global variables"
  let DS_io_timeout = 0
  let DS_did_timeout = false
  let DS_stop_variable = 0
  let DS_timeout_start = 0
  let DS_measurement_timing_budget_us = 0

  // The I2C address is software programmable (volatile), and defaults to 0x52 >> 1 = 0x29.
  // __init__ changes the address (default to 0x54 >> 1 = 0x2A) to prevent conflicts.
  let DS_ADDRESS = DS_Constants.ADDRESS_DEFAULT



  function DS_set_address(address: number) {
      address &= 0x7f
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.I2C_SLAVE_DEVICE_ADDRESS, address)
  }
  function DS_initialize(): boolean {
      // set bit 0
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV, (diI2C.ReadReg8(DS_ADDRESS, DS_Constants.VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV) | 0x01))

      // "Set I2C standard mode"
      diI2C.WriteReg8(DS_ADDRESS, 0x88, 0x00)

      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x00)
      DS_stop_variable = diI2C.ReadReg8(DS_ADDRESS, 0x91)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x00)

      // disable SIGNAL_RATE_MSRC (bit 1) and SIGNAL_RATE_PRE_RANGE (bit 4) limit checks
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.MSRC_CONFIG_CONTROL, (diI2C.ReadReg8(DS_ADDRESS, DS_Constants.MSRC_CONFIG_CONTROL) | 0x12))

      // set final range signal rate limit to 0.25 MCPS (million counts per second)
      // 0.25 * (1 << 7) = 32
      setSignalRateLimitRaw(32)

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG, 0xFF)

      // VL53L0X_DataInit() end

      // VL53L0X_StaticInit() begin

      let DS_get_spad_info_result = DS_get_spad_info()
      let spad_count = DS_get_spad_info_result[0]
      let spad_type_is_aperture = DS_get_spad_info_result[1]
      let success = DS_get_spad_info_result[2]
      if (!success) {
          return false
      }

      // The SPAD map (RefGoodSpadMap) is read by VL53L0X_get_info_from_device() in
      // the API, but the same data seems to be more easily readable from
      // GLOBAL_CONFIG_SPAD_ENABLES_REF_0 through _6, so read it from there
      let ref_spad_map = diI2C.ReadRegList(DS_ADDRESS, DS_Constants.GLOBAL_CONFIG_SPAD_ENABLES_REF_0, 6)

      // -- VL53L0X_set_reference_spads() begin (assume NVM values are valid)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.DYNAMIC_SPAD_REF_EN_START_OFFSET, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD, 0x2C)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.GLOBAL_CONFIG_REF_EN_START_SELECT, 0xB4)

      let first_spad_to_enable = 0
      if (spad_type_is_aperture) {
          first_spad_to_enable = 12 // 12 is the first aperture spad
      }

      let spads_enabled = 0

      for (let i = 0; i < 48; i++) {
          if (i < first_spad_to_enable || spads_enabled == spad_count) {
              // This bit is lower than the first one that should be enabled, or
              // (reference_spad_count) bits have already been enabled, so zero this bit
              ref_spad_map[Math.idiv(i, 8)] &= (0xFF - (1 << (i % 8))) // bitwise NOT `~` does not work. Use `0xFF -` instead
          } else if ((ref_spad_map[Math.idiv(i, 8)] >> (i % 8)) & 0x1) {
              spads_enabled += 1
          }
      }

      diI2C.WriteRegList(DS_ADDRESS, DS_Constants.GLOBAL_CONFIG_SPAD_ENABLES_REF_0, ref_spad_map, 6)

      // -- VL53L0X_set_reference_spads() end

      // -- VL53L0X_load_tuning_settings() begin
      // DefaultTuningSettings from vl53l0x_tuning.h

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x00)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x09, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x10, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x11, 0x00)

      diI2C.WriteReg8(DS_ADDRESS, 0x24, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x25, 0xFF)
      diI2C.WriteReg8(DS_ADDRESS, 0x75, 0x00)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x4E, 0x2C)
      diI2C.WriteReg8(DS_ADDRESS, 0x48, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x30, 0x20)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x30, 0x09)
      diI2C.WriteReg8(DS_ADDRESS, 0x54, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x31, 0x04)
      diI2C.WriteReg8(DS_ADDRESS, 0x32, 0x03)
      diI2C.WriteReg8(DS_ADDRESS, 0x40, 0x83)
      diI2C.WriteReg8(DS_ADDRESS, 0x46, 0x25)
      diI2C.WriteReg8(DS_ADDRESS, 0x60, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x27, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x50, 0x06)
      diI2C.WriteReg8(DS_ADDRESS, 0x51, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x52, 0x96)
      diI2C.WriteReg8(DS_ADDRESS, 0x56, 0x08)
      diI2C.WriteReg8(DS_ADDRESS, 0x57, 0x30)
      diI2C.WriteReg8(DS_ADDRESS, 0x61, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x62, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x64, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x65, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x66, 0xA0)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x22, 0x32)
      diI2C.WriteReg8(DS_ADDRESS, 0x47, 0x14)
      diI2C.WriteReg8(DS_ADDRESS, 0x49, 0xFF)
      diI2C.WriteReg8(DS_ADDRESS, 0x4A, 0x00)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x7A, 0x0A)
      diI2C.WriteReg8(DS_ADDRESS, 0x7B, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x78, 0x21)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x23, 0x34)
      diI2C.WriteReg8(DS_ADDRESS, 0x42, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x44, 0xFF)
      diI2C.WriteReg8(DS_ADDRESS, 0x45, 0x26)
      diI2C.WriteReg8(DS_ADDRESS, 0x46, 0x05)
      diI2C.WriteReg8(DS_ADDRESS, 0x40, 0x40)
      diI2C.WriteReg8(DS_ADDRESS, 0x0E, 0x06)
      diI2C.WriteReg8(DS_ADDRESS, 0x20, 0x1A)
      diI2C.WriteReg8(DS_ADDRESS, 0x43, 0x40)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x34, 0x03)
      diI2C.WriteReg8(DS_ADDRESS, 0x35, 0x44)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x31, 0x04)
      diI2C.WriteReg8(DS_ADDRESS, 0x4B, 0x09)
      diI2C.WriteReg8(DS_ADDRESS, 0x4C, 0x05)
      diI2C.WriteReg8(DS_ADDRESS, 0x4D, 0x04)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x44, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x45, 0x20)
      diI2C.WriteReg8(DS_ADDRESS, 0x47, 0x08)
      diI2C.WriteReg8(DS_ADDRESS, 0x48, 0x28)
      diI2C.WriteReg8(DS_ADDRESS, 0x67, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x70, 0x04)
      diI2C.WriteReg8(DS_ADDRESS, 0x71, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x72, 0xFE)
      diI2C.WriteReg8(DS_ADDRESS, 0x76, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x77, 0x00)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x0D, 0x01)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x01, 0xF8)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x8E, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x00)

      // -- VL53L0X_load_tuning_settings() end

      // "Set interrupt config to new sample ready"
      // -- VL53L0X_SetGpioConfig() begin

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_INTERRUPT_CONFIG_GPIO, 0x04)
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.GPIO_HV_MUX_ACTIVE_HIGH, (diI2C.ReadReg8(DS_ADDRESS, DS_Constants.GPIO_HV_MUX_ACTIVE_HIGH) & (0xFF - 0x04))) // active low // bitwise NOT `~` does not work. Use `0xFF -` instead
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_INTERRUPT_CLEAR, 0x01)

      // -- VL53L0X_SetGpioConfig() end

      DS_measurement_timing_budget_us = DS_get_measurement_timing_budget()

      // "Disable MSRC and TCC by default"
      // MSRC = Minimum Signal Rate Check
      // TCC = Target CentreCheck
      // -- VL53L0X_SetSequenceStepEnable() begin

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG, 0xE8)

      // -- VL53L0X_SetSequenceStepEnable() end

      // "Recalculate timing budget"
      DS_set_measurement_timing_budget(DS_measurement_timing_budget_us)

      // VL53L0X_StaticInit() end

      // VL53L0X_PerformRefCalibration() begin (VL53L0X_perform_ref_calibration())

      // -- VL53L0X_perform_vhv_calibration() begin

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG, 0x01)
      if (!DS_perform_single_ref_calibration(0x40)) {
          return false
      }

      // -- VL53L0X_perform_vhv_calibration() end

      // -- VL53L0X_perform_phase_calibration() begin

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG, 0x02)
      if (!DS_perform_single_ref_calibration(0x00)) {
          return false
      }

      // -- VL53L0X_perform_phase_calibration() end

      // "restore the previous Sequence Config"
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG, 0xE8)

      // VL53L0X_PerformRefCalibration() end

      return true
  }

  function DS_set_timeout(timeout: number) {
      DS_io_timeout = timeout
  }

      // Get reference SPAD (single photon avalanche diode) count and type
  // based on VL53L0X_get_info_from_device(),
  // but only gets reference SPAD count and type
  function DS_get_spad_info(): number[] {
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x00)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x06)
      diI2C.WriteReg8(DS_ADDRESS, 0x83, (diI2C.ReadReg8(DS_ADDRESS, 0x83) | 0x04))
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x07)
      diI2C.WriteReg8(DS_ADDRESS, 0x81, 0x01)

      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x01)

      diI2C.WriteReg8(DS_ADDRESS, 0x94, 0x6b)
      diI2C.WriteReg8(DS_ADDRESS, 0x83, 0x00)
      DS_start_timeout()
      let return_values: number[] = [0, 0, 0];
      while (diI2C.ReadReg8(DS_ADDRESS, 0x83) == 0x00) {
          if (DS_check_timeout_expired()) {
              return return_values
          }
      }

      diI2C.WriteReg8(DS_ADDRESS, 0x83, 0x01)
      let tmp = diI2C.ReadReg8(DS_ADDRESS, 0x92)

      let count = tmp & 0x7f
      let type_is_aperture = (tmp >> 7) & 0x01

      diI2C.WriteReg8(DS_ADDRESS, 0x81, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x06)
      diI2C.WriteReg8(DS_ADDRESS, 0x83, (diI2C.ReadReg8(DS_ADDRESS, 0x83) & (0xFF - 0x04))) // bitwise NOT `~` does not work. Use `0xFF -` instead
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x01)

      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x00)

      return_values[0] = count
      return_values[1] = type_is_aperture
      return_values[2] = 1
      return return_values
  }

  // Check if timeout is enabled (set to nonzero value) and has expired
  function DS_check_timeout_expired(): boolean {
      if (DS_io_timeout > 0 && ((input.runningTimeMicros() / 1000) - DS_timeout_start) > DS_io_timeout) {
          return true
      }
      return false
  }

  // Record the current time to check an upcoming timeout against
  function DS_start_timeout() {
      DS_timeout_start = (input.runningTimeMicros() / 1000)
  }

  function DS_get_measurement_timing_budget(): number {
      let StartOverhead = 1910 // note that this is different than the value in set_
      let EndOverhead = 960
      let MsrcOverhead = 660
      let TccOverhead = 590
      let DssOverhead = 690
      let PreRangeOverhead = 660
      let FinalRangeOverhead = 550

      // "Start and end overhead times always present"
      let budget_us = StartOverhead + EndOverhead

      let enables = DS_get_sequence_step_enables()
      let timeouts = DS_get_sequence_step_timeouts(enables[DS_IndexSequenceStepEnables.pre_range])

      if (enables[DS_IndexSequenceStepEnables.tcc]) {
          budget_us += (timeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us] + TccOverhead)
      }

      if (enables[DS_IndexSequenceStepEnables.dss]) {
          budget_us += 2 * (timeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us] + DssOverhead)
      } else if (enables[DS_IndexSequenceStepEnables.msrc]) {
          budget_us += (timeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us] + MsrcOverhead)
      }

      if (enables[DS_IndexSequenceStepEnables.pre_range]) {
          budget_us += (timeouts[DS_IndexSequenceStepTimeouts.pre_range_us] + PreRangeOverhead)
      }

      if (enables[DS_IndexSequenceStepEnables.final_range]) {
          budget_us += (timeouts[DS_IndexSequenceStepTimeouts.final_range_us] + FinalRangeOverhead)
      }

      DS_measurement_timing_budget_us = budget_us // store for internal reuse
      return budget_us
  }

  // Get sequence step enables
  // based on VL53L0X_get_sequence_step_enables()
  function DS_get_sequence_step_enables(): number[] {
      let sequence_config = diI2C.ReadReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG)
      let SequenceStepEnables: number[] = [0, 0, 0, 0, 0]
      SequenceStepEnables[DS_IndexSequenceStepEnables.tcc] = (sequence_config >> 4) & 0x1
      SequenceStepEnables[DS_IndexSequenceStepEnables.dss] = (sequence_config >> 3) & 0x1
      SequenceStepEnables[DS_IndexSequenceStepEnables.msrc] = (sequence_config >> 2) & 0x1
      SequenceStepEnables[DS_IndexSequenceStepEnables.pre_range] = (sequence_config >> 6) & 0x1
      SequenceStepEnables[DS_IndexSequenceStepEnables.final_range] = (sequence_config >> 7) & 0x1
      return SequenceStepEnables
  }

  // Get sequence step timeouts
  // based on get_sequence_step_timeout(),
  // but gets all timeouts instead of just the requested one, and also stores
  // intermediate values
  function DS_get_sequence_step_timeouts(pre_range: number): number[] {
      let SequenceStepTimeouts: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.pre_range_vcsel_period_pclks] = getVcselPulsePeriod(DS_VcselPeriodPreRange)

      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_mclks] = diI2C.ReadReg8(DS_ADDRESS, DS_Constants.MSRC_CONFIG_TIMEOUT_MACROP) + 1
      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us] = DS_timeout_mclks_to_microseconds(SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_mclks], SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.pre_range_vcsel_period_pclks])

      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.pre_range_mclks] = DS_decode_timeout(diI2C.ReadReg16(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI))
      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.pre_range_us] = DS_timeout_mclks_to_microseconds(SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.pre_range_mclks], SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.pre_range_vcsel_period_pclks])

      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.final_range_vcsel_period_pclks] = getVcselPulsePeriod(DS_VcselPeriodFinalRange)

      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.final_range_mclks] = DS_decode_timeout(diI2C.ReadReg16(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI))

      if (pre_range) {
          SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.final_range_mclks] -= SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.pre_range_mclks]
      }

      SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.final_range_us] = DS_timeout_mclks_to_microseconds(SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.final_range_mclks], SequenceStepTimeouts[DS_IndexSequenceStepTimeouts.final_range_vcsel_period_pclks])

      return SequenceStepTimeouts
  }

  // Decode VCSEL (vertical cavity surface emitting laser) pulse period in PCLKs
  // from register value
  // based on VL53L0X_decode_vcsel_period()
  function DS_decode_vcsel_period(reg_val: number): number {
      return (((reg_val) + 1) << 1)
  }

  // Get the VCSEL pulse period in PCLKs for the given period type.
  // based on VL53L0X_get_vcsel_pulse_period()
  function getVcselPulsePeriod(type: number): number {
      if (type == DS_VcselPeriodPreRange) {
          return DS_decode_vcsel_period(diI2C.ReadReg8(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_VCSEL_PERIOD))
      } else if (type == DS_VcselPeriodFinalRange) {
          return DS_decode_vcsel_period(diI2C.ReadReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VCSEL_PERIOD))
      } else {
          return 255
      }
  }

  // Convert sequence step timeout from MCLKs to microseconds with given VCSEL period in PCLKs
  // based on VL53L0X_calc_timeout_us()
  function DS_timeout_mclks_to_microseconds(timeout_period_mclks: number, vcsel_period_pclks: number): number {
      let macro_period_ns = DS_calc_macro_period(vcsel_period_pclks)
      return ((timeout_period_mclks * macro_period_ns) + (macro_period_ns / 2)) / 1000
  }

  // Calculate macro period in *nanoseconds* from VCSEL period in PCLKs
  // based on VL53L0X_calc_macro_period_ps()
  // PLL_period_ps = 1655; macro_period_vclks = 2304
  function DS_calc_macro_period(vcsel_period_pclks: number): number {
      return (((2304 * vcsel_period_pclks * 1655) + 500) / 1000)
  }

  // Decode sequence step timeout in MCLKs from register value
  // based on VL53L0X_decode_timeout()
  // Note: the original function returned a uint32_t, but the return value is
  //always stored in a uint16_t.
  function DS_decode_timeout(reg_val: number): number {
      // format: "(LSByte * 2^MSByte) + 1"
      return ((reg_val & 0x00FF) << ((reg_val & 0xFF00) >> 8)) + 1;
  }

  // Set the measurement timing budget in microseconds, which is the time allowed
  // for one measurement the ST API and this library take care of splitting the
  // timing budget among the sub-steps in the ranging sequence. A longer timing
  // budget allows for more accurate measurements. Increasing the budget by a
  // factor of N decreases the range measurement standard deviation by a factor of
  // sqrt(N). Defaults to about 33 milliseconds the minimum is 20 ms.
  // based on VL53L0X_set_measurement_timing_budget_micro_seconds()
  function DS_set_measurement_timing_budget(budget_us: number): boolean {
      let StartOverhead = 1320 // note that this is different than the value in get_
      let EndOverhead = 960
      let MsrcOverhead = 660
      let TccOverhead = 590
      let DssOverhead = 690
      let PreRangeOverhead = 660
      let FinalRangeOverhead = 550

      let MinTimingBudget = 20000

      if (budget_us < MinTimingBudget) {
          return false
      }

      let used_budget_us = StartOverhead + EndOverhead

      let enables = DS_get_sequence_step_enables()
      let timeouts = DS_get_sequence_step_timeouts(enables[DS_IndexSequenceStepEnables.pre_range])

      if (enables[DS_IndexSequenceStepEnables.tcc]) {
          used_budget_us += (timeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us] + TccOverhead)
      }

      if (enables[DS_IndexSequenceStepEnables.dss]) {
          used_budget_us += 2 * (timeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us] + DssOverhead)
      } else if (enables[DS_IndexSequenceStepEnables.msrc]) {
          used_budget_us += (timeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us] + MsrcOverhead)
      }

      if (enables[DS_IndexSequenceStepEnables.pre_range]) {
          used_budget_us += (timeouts[DS_IndexSequenceStepTimeouts.pre_range_us] + PreRangeOverhead)
      }

      if (enables[DS_IndexSequenceStepEnables.final_range]) {
          used_budget_us += FinalRangeOverhead

          // "Note that the final range timeout is determined by the timing
          // budget and the sum of all other timeouts within the sequence.
          // If there is no room for the final range timeout, then an error
          // will be set. Otherwise the remaining time will be applied to
          // the final range."

          if (used_budget_us > budget_us) {
              // "Requested timeout too big."
              return false
          }

          let final_range_timeout_us = budget_us - used_budget_us

          // set_sequence_step_timeout() begin
          // (SequenceStepId == VL53L0X_SEQUENCESTEP_FINAL_RANGE)

          // "For the final range timeout, the pre-range timeout
          //  must be added. To do this both final and pre-range
          //  timeouts must be expressed in macro periods MClks
          //  because they have different vcsel periods."

          let final_range_timeout_mclks = DS_timeout_microseconds_to_mclks(final_range_timeout_us, timeouts[DS_IndexSequenceStepTimeouts.final_range_vcsel_period_pclks])

          if (enables[DS_IndexSequenceStepEnables.pre_range]) {
              final_range_timeout_mclks += timeouts[DS_IndexSequenceStepTimeouts.pre_range_mclks]
          }

          diI2C.WriteReg16(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI, DS_encode_timeout(final_range_timeout_mclks))

          // set_sequence_step_timeout() end

          DS_measurement_timing_budget_us = budget_us // store for internal reuse
      }
      return true
  }

  // Encode sequence step timeout register value from timeout in MCLKs
  // based on VL53L0X_encode_timeout()
  // Note: the original function took a uint16_t, but the argument passed to it
  // is always a uint16_t.
  function DS_encode_timeout(timeout_mclks: number): number {
      // format: "(LSByte * 2^MSByte) + 1"

      let ls_byte = 0
      let ms_byte = 0

      if (timeout_mclks > 0) {
          ls_byte = timeout_mclks - 1

          while (ls_byte > 255) { //while ((ls_byte & 0xFFFFFF00) > 0){
              ls_byte /= 2 // >>=
              ms_byte += 1
          }

          return ((ms_byte << 8) | (ls_byte & 0xFF))
      } else {
          return 0
      }
  }

  // Convert sequence step timeout from microseconds to MCLKs with given VCSEL period in PCLKs
  // based on VL53L0X_calc_timeout_mclks()
  function DS_timeout_microseconds_to_mclks(timeout_period_us: number, vcsel_period_pclks: number): number {
      let macro_period_ns = DS_calc_macro_period(vcsel_period_pclks)
      return (((timeout_period_us * 1000) + (macro_period_ns / 2)) / macro_period_ns)
  }

  // based on VL53L0X_perform_single_ref_calibration()
  function DS_perform_single_ref_calibration(vhv_init_byte: number): boolean {
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSRANGE_START, 0x01 | vhv_init_byte) // VL53L0X_REG_SYSRANGE_MODE_START_STOP

      DS_start_timeout()
      while ((diI2C.ReadReg8(DS_ADDRESS, DS_Constants.RESULT_INTERRUPT_STATUS) & 0x07) == 0) {
          if (DS_check_timeout_expired()) {
              return false
          }
      }

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_INTERRUPT_CLEAR, 0x01)

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSRANGE_START, 0x00)

      return true
  }

  // Did a timeout occur in one of the read functions since the last call to
  // timeout_occurred()?
  function timeoutOccurred(): boolean {
      let tmp = DS_did_timeout
      DS_did_timeout = false
      return tmp
  }

  // Encode VCSEL pulse period register value from period in PCLKs
  // based on VL53L0X_encode_vcsel_period()
  function encodeVcselPeriod(period_pclks: number): number {
      return ((period_pclks >> 1) - 1)
  }

  //
  // Distance Sensor exported functions
  //

  export function vcselPeriodPreRange() {
      return DS_VcselPeriodPreRange
  }
  
  export function vcselPeriodFinalRange() {
      return DS_VcselPeriodFinalRange
  }

  export function init() {
      // try resetting from ADDRESS_TARGET
      diI2C.WriteReg8(DS_Constants.ADDRESS_TARGET, DS_Constants.SOFT_RESET_GO2_SOFT_RESET_N, 0x00)
      DS_ADDRESS = DS_Constants.ADDRESS_DEFAULT
      basic.pause(2)

      // reset ADDRESS_DEFAULT
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SOFT_RESET_GO2_SOFT_RESET_N, 0x00)

      basic.pause(5)

      // release reset
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SOFT_RESET_GO2_SOFT_RESET_N, 0x01)

      basic.pause(5)

      DS_set_address(DS_Constants.ADDRESS_TARGET)
      DS_ADDRESS = DS_Constants.ADDRESS_TARGET

      // initialize the sensor
      DS_initialize()

      // set the timeout
      DS_set_timeout(500) // 0.5 seconds
  }

      // Start continuous ranging measurements. If period_ms (optional) is 0 or not
  // given, continuous back-to-back mode is used (the sensor takes measurements as
  // often as possible) otherwise, continuous timed mode is used, with the given
  // inter-measurement period in milliseconds determining how often the sensor
  // takes a measurement.
  // based on VL53L0X_StartMeasurement()
  export function startContinuous(period_ms: number) { // period_ms = 0
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x91, DS_stop_variable)
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x01)
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x00)

      if (period_ms != 0) {
          // continuous timed mode

          // VL53L0X_SetInterMeasurementPeriodMilliSeconds() begin

          let osc_calibrate_val = diI2C.ReadReg16(DS_ADDRESS, DS_Constants.OSC_CALIBRATE_VAL)

          if (osc_calibrate_val != 0) {
              period_ms *= osc_calibrate_val
          }

          diI2C.WriteReg32(DS_ADDRESS, DS_Constants.SYSTEM_INTERMEASUREMENT_PERIOD, period_ms)

          // VL53L0X_SetInterMeasurementPeriodMilliSeconds() end

          diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSRANGE_START, 0x04) // VL53L0X_REG_SYSRANGE_MODE_TIMED
      } else {
          // continuous back-to-back mode
          diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSRANGE_START, 0x02) // VL53L0X_REG_SYSRANGE_MODE_BACKTOBACK
      }
  }



  // Set the return signal rate limit check value in units of MCPS (mega counts
  // per second). "This represents the amplitude of the signal reflected from the
  // target and detected by the device"; setting this limit presumably determines
  // the minimum measurement necessary for the sensor to report a valid reading.
  // Setting a lower limit increases the potential range of the sensor but also
  // seems to increase the likelihood of getting an inaccurate reading because of
  // unwanted reflections from objects other than the intended target.
  // Defaults to 0.25 MCPS as initialized by the ST API and this library.
  export function setSignalRateLimitRaw(limit_Mcps_raw: number) {
      // Being called with a constant, don't bother checking range and returning a value.
      //if (limit_Mcps < 0 or limit_Mcps > 65535):
      //    return false

      // Q9.7 fixed point format (9 integer bits, 7 fractional bits)
      diI2C.WriteReg16(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT, limit_Mcps_raw)
      //return true
  }


  // Returns a range reading in millimeters when continuous mode is active
  // (DS_read_range_single_millimeters() also calls this function after starting a
  // single-shot range measurement)
  export function readRangeContinuousMillimeters(): number {
      DS_start_timeout()
      while ((diI2C.ReadReg8(DS_ADDRESS, DS_Constants.RESULT_INTERRUPT_STATUS) & 0x07) == 0) {
          if (DS_check_timeout_expired()) {
              DS_did_timeout = true
              return -1 // timeout
          }
      }

      // assumptions: Linearity Corrective Gain is 1000 (default)
      // fractional ranging is not enabled
      let range = diI2C.ReadReg16(DS_ADDRESS, DS_Constants.RESULT_RANGE_STATUS + 10)

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_INTERRUPT_CLEAR, 0x01)

      return range
  }


  // Set the VCSEL (vertical cavity surface emitting laser) pulse period for the
  // given period type (pre-range or final range) to the given value in PCLKs.
  // Longer periods seem to increase the potential range of the sensor.
  // Valid values are (even numbers only):
  //  pre:  12 to 18 (initialized default: 14)
  //  final: 8 to 14 (initialized default: 10)
  // based on VL53L0X_setVcselPulsePeriod()
  export function setVcselPulsePeriod(type: number, period_pclks: number): boolean {
      let vcsel_period_reg = encodeVcselPeriod(period_pclks)

      let enables = DS_get_sequence_step_enables()
      let timeouts = DS_get_sequence_step_timeouts(enables[DS_IndexSequenceStepEnables.pre_range])

      // "Apply specific settings for the requested clock period"
      // "Re-calculate and apply timeouts, in macro periods"

      // "When the VCSEL period for the pre or final range is changed,
      // the corresponding timeout must be read from the device using
      // the current VCSEL period, then the new VCSEL period can be
      // applied. The timeout then must be written back to the device
      // using the new VCSEL period.
      //
      // For the MSRC timeout, the same applies - this timeout being
      // dependant on the pre-range vcsel period."

      if (type == DS_VcselPeriodPreRange) {
          // "Set phase check limits"
          if (period_pclks == 12) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x18)
          } else if (period_pclks == 14) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x30)
          } else if (period_pclks == 16) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x40)
          } else if (period_pclks == 18) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_VALID_PHASE_HIGH, 0x50)
          } else {
              return false
          }

          diI2C.WriteReg8(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_VALID_PHASE_LOW, 0x08)

          // apply new VCSEL period
          diI2C.WriteReg8(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_VCSEL_PERIOD, vcsel_period_reg)

          // update timeouts

          // set_sequence_step_timeout() begin
          // (SequenceStepId == VL53L0X_SEQUENCESTEP_PRE_RANGE)

          let new_pre_range_timeout_mclks = DS_timeout_microseconds_to_mclks(timeouts[DS_IndexSequenceStepTimeouts.pre_range_us], period_pclks)

          diI2C.WriteReg16(DS_ADDRESS, DS_Constants.PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI, DS_encode_timeout(new_pre_range_timeout_mclks))

          // set_sequence_step_timeout() end

          // set_sequence_step_timeout() begin
          // (SequenceStepId == VL53L0X_SEQUENCESTEP_MSRC)

          let new_msrc_timeout_mclks = DS_timeout_microseconds_to_mclks(timeouts[DS_IndexSequenceStepTimeouts.msrc_dss_tcc_us], period_pclks)

          if (new_msrc_timeout_mclks > 256) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.MSRC_CONFIG_TIMEOUT_MACROP, 255)
          } else {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.MSRC_CONFIG_TIMEOUT_MACROP, (new_msrc_timeout_mclks - 1))
          }

          // set_sequence_step_timeout() end
      } else if (type == DS_VcselPeriodFinalRange) {
          if (period_pclks == 8) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x10)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_LOW, 0x08)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.GLOBAL_CONFIG_VCSEL_WIDTH, 0x02)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_CONFIG_TIMEOUT, 0x0C)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_LIM, 0x30)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
          } else if (period_pclks == 10) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x28)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_LOW, 0x08)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.GLOBAL_CONFIG_VCSEL_WIDTH, 0x03)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_CONFIG_TIMEOUT, 0x09)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_LIM, 0x20)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
          } else if (period_pclks == 12) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x38)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_LOW, 0x08)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.GLOBAL_CONFIG_VCSEL_WIDTH, 0x03)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_CONFIG_TIMEOUT, 0x08)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_LIM, 0x20)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
          } else if (period_pclks == 14) {
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_HIGH, 0x48)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VALID_PHASE_LOW, 0x08)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.GLOBAL_CONFIG_VCSEL_WIDTH, 0x03)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_CONFIG_TIMEOUT, 0x07)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01)
              diI2C.WriteReg8(DS_ADDRESS, DS_Constants.ALGO_PHASECAL_LIM, 0x20)
              diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00)
          } else {
              // invalid period
              return false
          }

          // apply new VCSEL period
          diI2C.WriteReg8(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_VCSEL_PERIOD, vcsel_period_reg)

          // update timeouts

          // set_sequence_step_timeout() begin
          // (SequenceStepId == VL53L0X_SEQUENCESTEP_FINAL_RANGE)

          // "For the final range timeout, the pre-range timeout
          //  must be added. To do this both final and pre-range
          //  timeouts must be expressed in macro periods MClks
          //  because they have different vcsel periods."

          let new_final_range_timeout_mclks = DS_timeout_microseconds_to_mclks(timeouts[DS_IndexSequenceStepTimeouts.final_range_us], period_pclks)

          if (enables[DS_IndexSequenceStepEnables.pre_range]) {
              new_final_range_timeout_mclks += timeouts[DS_IndexSequenceStepTimeouts.pre_range_mclks]
          }

          diI2C.WriteReg16(DS_ADDRESS, DS_Constants.FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI, DS_encode_timeout(new_final_range_timeout_mclks))

          // set_sequence_step_timeout end
      } else {
          // invalid type
          return false
      }

      // "Finally, the timing budget must be re-applied"

      DS_set_measurement_timing_budget(DS_measurement_timing_budget_us)

      // "Perform the phase calibration. This is needed after changing on vcsel period."
      // VL53L0X_perform_phase_calibration() begin

      let sequence_config = diI2C.ReadReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG)
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG, 0x02)
      DS_perform_single_ref_calibration(0x0)
      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSTEM_SEQUENCE_CONFIG, sequence_config)

      // VL53L0X_perform_phase_calibration() end

      return true
  }

  // Performs a single-shot range measurement and returns the reading in
  // millimeters
  // based on VL53L0X_PerformSingleRangingMeasurement()
  export function readRangeSingleMillimeters(): number {
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x01);
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x01);
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x00);
      diI2C.WriteReg8(DS_ADDRESS, 0x91, DS_stop_variable);
      diI2C.WriteReg8(DS_ADDRESS, 0x00, 0x01);
      diI2C.WriteReg8(DS_ADDRESS, 0xFF, 0x00);
      diI2C.WriteReg8(DS_ADDRESS, 0x80, 0x00);

      diI2C.WriteReg8(DS_ADDRESS, DS_Constants.SYSRANGE_START, 0x01);

      // "Wait until start bit has been cleared"
      DS_start_timeout()
      while (diI2C.ReadReg8(DS_ADDRESS, DS_Constants.SYSRANGE_START) & 0x01) {
          if (DS_check_timeout_expired()) {
              DS_did_timeout = true
              return -1 // timeout
          }
      }
      return readRangeContinuousMillimeters()
  }
}