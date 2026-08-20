/**
 * OBD-II Diagnostic Trouble Code (DTC) lookup.
 * Returns an object with description, severity, possibleCauses, and commonFixes.
 * Returns null if the code is not found in the database.
 */

const DTC_DATABASE = {
  // ─── P0 — Powertrain / Fuel & Air Metering ───────────────────────────────
  P0100: { description: "Mass Air Flow Circuit Malfunction", severity: "medium", possibleCauses: ["Dirty/faulty MAF sensor", "Air leak in intake", "Wiring issue"], commonFixes: ["Clean or replace MAF sensor", "Inspect intake hoses for leaks"] },
  P0101: { description: "Mass Air Flow Circuit Range/Performance", severity: "medium", possibleCauses: ["Dirty MAF sensor", "Air filter clogged", "Intake leak"], commonFixes: ["Clean MAF sensor with electronics cleaner", "Replace air filter"] },
  P0102: { description: "Mass Air Flow Circuit Low Input", severity: "medium", possibleCauses: ["Faulty MAF sensor", "Open circuit in wiring", "Air leak"], commonFixes: ["Replace MAF sensor", "Inspect wiring and connectors"] },
  P0103: { description: "Mass Air Flow Circuit High Input", severity: "medium", possibleCauses: ["Faulty MAF sensor", "Short circuit", "ECU fault"], commonFixes: ["Replace MAF sensor", "Check wiring for shorts"] },
  P0110: { description: "Intake Air Temperature Circuit Malfunction", severity: "low", possibleCauses: ["Faulty IAT sensor", "Wiring fault"], commonFixes: ["Replace IAT sensor"] },
  P0111: { description: "Intake Air Temperature Circuit Range/Performance", severity: "low", possibleCauses: ["Faulty IAT sensor", "Wiring issue"], commonFixes: ["Replace IAT sensor"] },
  P0112: { description: "Intake Air Temperature Circuit Low Input", severity: "low", possibleCauses: ["Short circuit", "Faulty IAT sensor"], commonFixes: ["Inspect wiring", "Replace IAT sensor"] },
  P0113: { description: "Intake Air Temperature Circuit High Input", severity: "low", possibleCauses: ["Open circuit", "Faulty IAT sensor"], commonFixes: ["Inspect wiring", "Replace IAT sensor"] },
  P0115: { description: "Engine Coolant Temperature Circuit Malfunction", severity: "high", possibleCauses: ["Faulty ECT sensor", "Wiring fault", "Low coolant"], commonFixes: ["Replace ECT sensor", "Check coolant level and condition"] },
  P0116: { description: "Engine Coolant Temperature Circuit Range/Performance", severity: "medium", possibleCauses: ["Faulty thermostat", "Faulty ECT sensor"], commonFixes: ["Replace thermostat", "Replace ECT sensor"] },
  P0117: { description: "Engine Coolant Temperature Circuit Low Input", severity: "high", possibleCauses: ["Short circuit", "Faulty ECT sensor"], commonFixes: ["Replace ECT sensor", "Inspect wiring"] },
  P0118: { description: "Engine Coolant Temperature Circuit High Input", severity: "high", possibleCauses: ["Open circuit", "Faulty ECT sensor"], commonFixes: ["Replace ECT sensor", "Inspect wiring for open circuits"] },
  P0120: { description: "Throttle Position Sensor Circuit Malfunction", severity: "high", possibleCauses: ["Faulty TPS", "Wiring issue", "Throttle body fault"], commonFixes: ["Replace TPS", "Clean throttle body", "Inspect wiring"] },
  P0121: { description: "Throttle Position Sensor Circuit Range/Performance", severity: "medium", possibleCauses: ["Faulty TPS", "Dirty throttle body"], commonFixes: ["Replace TPS", "Clean throttle body and relearn idle"] },
  P0125: { description: "Insufficient Coolant Temperature for Closed Loop Fuel Control", severity: "medium", possibleCauses: ["Stuck-open thermostat", "Faulty ECT sensor"], commonFixes: ["Replace thermostat", "Check ECT sensor"] },
  P0128: { description: "Coolant Temperature Below Thermostat Regulating Temperature", severity: "medium", possibleCauses: ["Stuck-open thermostat"], commonFixes: ["Replace thermostat"] },
  P0130: { description: "O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)", severity: "medium", possibleCauses: ["Faulty O2 sensor", "Exhaust leak near sensor", "Wiring fault"], commonFixes: ["Replace upstream O2 sensor", "Fix exhaust leak"] },
  P0131: { description: "O2 Sensor Circuit Low Voltage (Bank 1 Sensor 1)", severity: "medium", possibleCauses: ["Faulty O2 sensor", "Lean fuel mixture", "Exhaust leak"], commonFixes: ["Replace O2 sensor", "Check for vacuum leaks"] },
  P0132: { description: "O2 Sensor Circuit High Voltage (Bank 1 Sensor 1)", severity: "medium", possibleCauses: ["Faulty O2 sensor", "Rich fuel mixture"], commonFixes: ["Replace O2 sensor", "Check fuel injectors"] },
  P0133: { description: "O2 Sensor Circuit Slow Response (Bank 1 Sensor 1)", severity: "medium", possibleCauses: ["Aged/poisoned O2 sensor", "Exhaust leak"], commonFixes: ["Replace O2 sensor"] },
  P0135: { description: "O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 1)", severity: "low", possibleCauses: ["Faulty O2 sensor heater", "Blown fuse", "Wiring fault"], commonFixes: ["Replace O2 sensor", "Check heater circuit fuse"] },
  P0136: { description: "O2 Sensor Circuit Malfunction (Bank 1 Sensor 2)", severity: "low", possibleCauses: ["Faulty downstream O2 sensor", "Wiring fault"], commonFixes: ["Replace downstream O2 sensor"] },
  P0141: { description: "O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 2)", severity: "low", possibleCauses: ["Faulty downstream O2 sensor heater", "Fuse blown"], commonFixes: ["Replace downstream O2 sensor", "Check fuse"] },
  P0171: { description: "System Too Lean (Bank 1)", severity: "medium", possibleCauses: ["Vacuum leak", "Dirty/faulty MAF sensor", "Clogged fuel injector", "Low fuel pressure"], commonFixes: ["Check for vacuum leaks", "Clean MAF sensor", "Replace fuel filter", "Check fuel pressure"] },
  P0172: { description: "System Too Rich (Bank 1)", severity: "medium", possibleCauses: ["Faulty O2 sensor", "Stuck-open fuel injector", "High fuel pressure", "Faulty MAF sensor"], commonFixes: ["Check fuel pressure regulator", "Inspect injectors", "Replace MAF sensor"] },
  P0174: { description: "System Too Lean (Bank 2)", severity: "medium", possibleCauses: ["Vacuum leak", "Dirty MAF sensor", "Low fuel pressure"], commonFixes: ["Check for vacuum leaks", "Clean MAF sensor"] },
  P0175: { description: "System Too Rich (Bank 2)", severity: "medium", possibleCauses: ["Faulty O2 sensor", "Rich fuel mixture Bank 2"], commonFixes: ["Replace O2 sensor Bank 2", "Inspect fuel injectors"] },
  P0190: { description: "Fuel Rail Pressure Sensor Circuit Malfunction", severity: "high", possibleCauses: ["Faulty fuel pressure sensor", "Wiring fault", "Fuel system issue"], commonFixes: ["Replace fuel pressure sensor", "Inspect fuel system"] },
  P0191: { description: "Fuel Rail Pressure Sensor Circuit Range/Performance", severity: "high", possibleCauses: ["Low fuel pressure", "Faulty sensor", "Fuel pump wear"], commonFixes: ["Check fuel pressure", "Replace fuel pump or sensor"] },

  // ─── P02 — Injector circuit ───────────────────────────────────────────────
  P0200: { description: "Injector Circuit Malfunction", severity: "high", possibleCauses: ["Faulty injector", "Wiring fault", "ECU fault"], commonFixes: ["Test injectors", "Inspect injector wiring harness"] },
  P0201: { description: "Injector Circuit Malfunction – Cylinder 1", severity: "high", possibleCauses: ["Faulty injector 1", "Wiring to injector 1"], commonFixes: ["Replace injector 1", "Check wiring"] },
  P0202: { description: "Injector Circuit Malfunction – Cylinder 2", severity: "high", possibleCauses: ["Faulty injector 2", "Wiring to injector 2"], commonFixes: ["Replace injector 2", "Check wiring"] },
  P0203: { description: "Injector Circuit Malfunction – Cylinder 3", severity: "high", possibleCauses: ["Faulty injector 3", "Wiring to injector 3"], commonFixes: ["Replace injector 3", "Check wiring"] },
  P0204: { description: "Injector Circuit Malfunction – Cylinder 4", severity: "high", possibleCauses: ["Faulty injector 4", "Wiring to injector 4"], commonFixes: ["Replace injector 4", "Check wiring"] },

  // ─── P03 — Misfire ───────────────────────────────────────────────────────
  P0300: { description: "Random/Multiple Cylinder Misfire Detected", severity: "high", possibleCauses: ["Worn spark plugs", "Faulty ignition coils", "Fuel delivery problem", "Low compression", "Vacuum leak"], commonFixes: ["Replace spark plugs", "Replace ignition coils", "Check fuel pressure", "Inspect compression"] },
  P0301: { description: "Cylinder 1 Misfire Detected", severity: "high", possibleCauses: ["Spark plug #1", "Ignition coil #1", "Injector #1", "Low compression cylinder 1"], commonFixes: ["Replace spark plug #1", "Swap ignition coil to test", "Test injector #1"] },
  P0302: { description: "Cylinder 2 Misfire Detected", severity: "high", possibleCauses: ["Spark plug #2", "Ignition coil #2", "Injector #2", "Low compression cylinder 2"], commonFixes: ["Replace spark plug #2", "Swap ignition coil to test", "Test injector #2"] },
  P0303: { description: "Cylinder 3 Misfire Detected", severity: "high", possibleCauses: ["Spark plug #3", "Ignition coil #3", "Injector #3"], commonFixes: ["Replace spark plug #3", "Swap ignition coil to test"] },
  P0304: { description: "Cylinder 4 Misfire Detected", severity: "high", possibleCauses: ["Spark plug #4", "Ignition coil #4", "Injector #4"], commonFixes: ["Replace spark plug #4", "Swap ignition coil to test"] },
  P0305: { description: "Cylinder 5 Misfire Detected", severity: "high", possibleCauses: ["Spark plug #5", "Ignition coil #5"], commonFixes: ["Replace spark plug #5", "Swap ignition coil"] },
  P0306: { description: "Cylinder 6 Misfire Detected", severity: "high", possibleCauses: ["Spark plug #6", "Ignition coil #6"], commonFixes: ["Replace spark plug #6", "Swap ignition coil"] },

  // ─── P04 — Emission Controls ──────────────────────────────────────────────
  P0400: { description: "Exhaust Gas Recirculation Flow Malfunction", severity: "medium", possibleCauses: ["Clogged EGR valve", "Faulty EGR solenoid", "Blocked EGR passages"], commonFixes: ["Clean or replace EGR valve", "Check EGR vacuum lines"] },
  P0401: { description: "Exhaust Gas Recirculation Flow Insufficient Detected", severity: "medium", possibleCauses: ["Clogged EGR valve", "EGR passages blocked"], commonFixes: ["Clean EGR valve and passages"] },
  P0402: { description: "Exhaust Gas Recirculation Flow Excessive Detected", severity: "medium", possibleCauses: ["EGR valve stuck open", "Faulty EGR pressure sensor"], commonFixes: ["Replace EGR valve", "Replace EGR pressure sensor"] },
  P0420: { description: "Catalyst System Efficiency Below Threshold (Bank 1)", severity: "medium", possibleCauses: ["Worn catalytic converter", "Faulty O2 sensors", "Exhaust leak", "Engine burning oil"], commonFixes: ["Replace catalytic converter", "Check and replace O2 sensors", "Fix oil burning issue"] },
  P0421: { description: "Warm-Up Catalyst Efficiency Below Threshold (Bank 1)", severity: "medium", possibleCauses: ["Worn catalytic converter", "Faulty O2 sensor"], commonFixes: ["Replace catalytic converter"] },
  P0430: { description: "Catalyst System Efficiency Below Threshold (Bank 2)", severity: "medium", possibleCauses: ["Worn catalytic converter Bank 2", "Faulty O2 sensor Bank 2"], commonFixes: ["Replace catalytic converter Bank 2"] },
  P0440: { description: "Evaporative Emission Control System Malfunction", severity: "low", possibleCauses: ["Loose/faulty fuel cap", "Leak in EVAP system", "Faulty purge valve"], commonFixes: ["Tighten or replace fuel cap", "Smoke test EVAP system"] },
  P0441: { description: "Evaporative Emission Control System Incorrect Purge Flow", severity: "low", possibleCauses: ["Faulty EVAP purge solenoid", "Blocked purge line"], commonFixes: ["Replace EVAP purge solenoid", "Inspect purge lines"] },
  P0442: { description: "Evaporative Emission Control System Leak Detected (Small Leak)", severity: "low", possibleCauses: ["Loose fuel cap", "Small hole in EVAP hose", "Faulty canister"], commonFixes: ["Check and tighten fuel cap", "Smoke test EVAP system"] },
  P0443: { description: "Evaporative Emission Control System Purge Control Valve Circuit", severity: "low", possibleCauses: ["Faulty purge valve", "Wiring fault"], commonFixes: ["Replace purge control valve"] },
  P0446: { description: "Evaporative Emission Control System Vent Control Circuit", severity: "low", possibleCauses: ["Faulty EVAP vent solenoid", "Blocked EVAP canister"], commonFixes: ["Replace EVAP vent solenoid", "Inspect canister"] },
  P0455: { description: "Evaporative Emission Control System Leak Detected (Large Leak)", severity: "low", possibleCauses: ["Missing or loose fuel cap", "Large hole in EVAP hose", "Faulty fuel filler neck"], commonFixes: ["Replace fuel cap", "Smoke test EVAP system thoroughly"] },
  P0456: { description: "Evaporative Emission Control System Leak Detected (Very Small Leak)", severity: "low", possibleCauses: ["Micro-leak in EVAP system", "Faulty fuel cap seal"], commonFixes: ["Replace fuel cap", "Smoke test EVAP system"] },

  // ─── P05 — Speed / Idle Control ──────────────────────────────────────────
  P0500: { description: "Vehicle Speed Sensor Malfunction", severity: "medium", possibleCauses: ["Faulty VSS", "Wiring fault", "Damaged tone ring"], commonFixes: ["Replace VSS", "Inspect wiring and tone ring"] },
  P0505: { description: "Idle Air Control System Malfunction", severity: "medium", possibleCauses: ["Dirty/faulty IAC valve", "Vacuum leak", "Dirty throttle body"], commonFixes: ["Clean IAC valve", "Clean throttle body", "Check for vacuum leaks"] },
  P0506: { description: "Idle Air Control System RPM Lower Than Expected", severity: "medium", possibleCauses: ["Dirty IAC valve", "Vacuum leak causing rough idle"], commonFixes: ["Clean IAC valve and throttle body"] },
  P0507: { description: "Idle Air Control System RPM Higher Than Expected", severity: "medium", possibleCauses: ["Vacuum leak", "Stuck-open IAC valve"], commonFixes: ["Check for vacuum leaks", "Replace IAC valve"] },

  // ─── P06 — ECU / Computer ────────────────────────────────────────────────
  P0600: { description: "Serial Communication Link Malfunction", severity: "high", possibleCauses: ["ECU fault", "CAN bus wiring fault", "Module malfunction"], commonFixes: ["Inspect CAN bus wiring", "Check module connections", "Consult dealer"] },
  P0605: { description: "Internal Control Module ROM Error", severity: "high", possibleCauses: ["Faulty ECU", "ECU memory corruption"], commonFixes: ["Reprogram or replace ECU"] },
  P0606: { description: "PCM Processor Fault", severity: "high", possibleCauses: ["Faulty PCM/ECU", "Power supply issues to PCM"], commonFixes: ["Check PCM power and ground", "Replace PCM"] },
  P0700: { description: "Transmission Control System Malfunction", severity: "high", possibleCauses: ["TCM fault", "Transmission solenoid fault", "Low fluid"], commonFixes: ["Check transmission fluid level", "Scan for TCM-specific codes", "Inspect solenoids"] },

  // ─── P07 — Transmission ───────────────────────────────────────────────────
  P0715: { description: "Input/Turbine Speed Sensor Circuit Malfunction", severity: "high", possibleCauses: ["Faulty input speed sensor", "Wiring fault", "Low transmission fluid"], commonFixes: ["Replace input speed sensor", "Check transmission fluid"] },
  P0720: { description: "Output Speed Sensor Circuit Malfunction", severity: "high", possibleCauses: ["Faulty output speed sensor", "Tone wheel damage"], commonFixes: ["Replace output speed sensor"] },
  P0730: { description: "Incorrect Gear Ratio", severity: "high", possibleCauses: ["Low transmission fluid", "Worn clutch pack", "Faulty solenoid"], commonFixes: ["Check fluid level and condition", "Service transmission"] },
  P0740: { description: "Torque Converter Clutch Circuit Malfunction", severity: "high", possibleCauses: ["Faulty TCC solenoid", "Low transmission fluid", "TCC failure"], commonFixes: ["Check transmission fluid", "Replace TCC solenoid"] },
  P0750: { description: "Shift Solenoid A Malfunction", severity: "high", possibleCauses: ["Faulty solenoid", "Low/dirty fluid", "Wiring fault"], commonFixes: ["Change transmission fluid and filter", "Replace solenoid A"] },
  P0755: { description: "Shift Solenoid B Malfunction", severity: "high", possibleCauses: ["Faulty solenoid B", "Low/dirty fluid"], commonFixes: ["Change transmission fluid and filter", "Replace solenoid B"] },

  // ─── B codes — Body ───────────────────────────────────────────────────────
  B0001: { description: "Driver Frontal Stage 1 Deployment Control (Subfault)", severity: "high", possibleCauses: ["Faulty airbag module", "Clock spring failure", "Wiring fault"], commonFixes: ["Have airbag system inspected by professional"] },
  B1000: { description: "ECU Malfunction (Body)", severity: "high", possibleCauses: ["Body control module fault"], commonFixes: ["Inspect BCM connections", "Replace BCM if needed"] },
  B1001: { description: "Option Configuration Error", severity: "medium", possibleCauses: ["BCM programming mismatch"], commonFixes: ["Reprogram BCM"] },

  // ─── C codes — Chassis / ABS / Brakes ────────────────────────────────────
  C0031: { description: "Right Front Wheel Speed Sensor Circuit", severity: "high", possibleCauses: ["Faulty wheel speed sensor RF", "Damaged tone ring", "Wiring fault"], commonFixes: ["Replace RF wheel speed sensor", "Inspect tone ring"] },
  C0034: { description: "Right Front Wheel Speed Sensor Circuit Range/Performance", severity: "high", possibleCauses: ["Damaged tone ring RF", "Air gap too large", "Faulty sensor"], commonFixes: ["Inspect tone ring", "Replace sensor"] },
  C0035: { description: "Left Front Wheel Speed Sensor Circuit", severity: "high", possibleCauses: ["Faulty wheel speed sensor LF", "Damaged tone ring", "Wiring fault"], commonFixes: ["Replace LF wheel speed sensor", "Inspect tone ring"] },
  C0040: { description: "Right Rear Wheel Speed Sensor Circuit", severity: "high", possibleCauses: ["Faulty wheel speed sensor RR", "Wiring fault"], commonFixes: ["Replace RR wheel speed sensor"] },
  C0045: { description: "Left Rear Wheel Speed Sensor Circuit", severity: "high", possibleCauses: ["Faulty wheel speed sensor LR", "Wiring fault"], commonFixes: ["Replace LR wheel speed sensor"] },
  C0110: { description: "ABS Motor Circuit Malfunction", severity: "high", possibleCauses: ["Faulty ABS pump motor", "Wiring fault", "Fuse blown"], commonFixes: ["Check ABS fuse", "Replace ABS pump/motor unit"] },
  C0121: { description: "Valve Relay Circuit Malfunction", severity: "high", possibleCauses: ["Faulty ABS hydraulic unit", "Relay failure"], commonFixes: ["Replace ABS modulator relay", "Inspect ABS unit"] },
  C0265: { description: "ABS Activation Relay Contact Circuit Open", severity: "high", possibleCauses: ["Faulty ABS relay", "Open circuit"], commonFixes: ["Replace ABS relay", "Inspect wiring"] },
  C0300: { description: "Rear Propshaft Sensor Malfunction", severity: "medium", possibleCauses: ["Faulty propshaft sensor", "Wiring issue"], commonFixes: ["Replace propshaft sensor"] },

  // ─── U codes — Network / Communication ───────────────────────────────────
  U0001: { description: "High Speed CAN Communication Bus", severity: "high", possibleCauses: ["CAN bus fault", "Module not communicating", "Wiring fault"], commonFixes: ["Inspect CAN bus wiring", "Check module connections"] },
  U0100: { description: "Lost Communication With ECM/PCM", severity: "high", possibleCauses: ["ECM power/ground issue", "CAN bus fault", "Faulty ECM"], commonFixes: ["Check ECM fuses and grounds", "Inspect CAN wiring"] },
  U0101: { description: "Lost Communication With TCM", severity: "high", possibleCauses: ["TCM power/ground issue", "CAN bus fault"], commonFixes: ["Check TCM fuses and grounds", "Inspect CAN wiring"] },
  U0121: { description: "Lost Communication With Anti-Lock Brake System Control Module", severity: "high", possibleCauses: ["ABS module fault", "CAN bus wiring"], commonFixes: ["Check ABS module fuses and grounds", "Inspect CAN bus"] },
  U0155: { description: "Lost Communication With Instrument Panel Cluster (IPC) Control Module", severity: "medium", possibleCauses: ["IPC module fault", "CAN bus issue"], commonFixes: ["Check IPC fuses", "Inspect CAN bus wiring"] },
};

/**
 * Look up an OBD-II DTC code.
 * @param {string} code - e.g. "P0300" or "p0300"
 * @param {Object} [vehicleInfo] - optional { year, make, model, fuelType }
 * @returns {{ code: string, description: string, severity: 'low'|'medium'|'high', possibleCauses: string[], commonFixes: string[] } | null}
 */
export function lookupDtc(code, vehicleInfo = {}) {
  if (!code || typeof code !== "string") return null;

  const normalized = code.trim().toUpperCase();
  const entry = DTC_DATABASE[normalized];

  if (!entry) {
    // Return a generic "unknown code" response so the UI still has something to show
    return {
      code: normalized,
      description: "Unknown or manufacturer-specific code",
      severity: "medium",
      possibleCauses: [
        "This may be a manufacturer-specific (OEM) code",
        "Requires model-specific documentation",
      ],
      commonFixes: [
        "Consult a vehicle-specific service manual",
        "Use a professional scanner that supports manufacturer codes",
      ],
    };
  }

  return {
    code: normalized,
    ...entry,
  };
}
