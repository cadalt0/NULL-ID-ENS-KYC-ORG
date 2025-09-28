// ES Module wrapper for witness calculator
import { readFileSync } from 'fs';

// Load the CommonJS module
const witnessCalculatorCode = readFileSync('./witness_calculator.js', 'utf8');

// Create a function that can be called with the WASM buffer
export default async function WitnessCalculatorBuilder(wasm) {
  // Create a temporary module environment
  const module = { exports: {} };
  const exports = module.exports;
  
  // Evaluate the witness calculator code
  const fn = new Function('module', 'exports', 'WebAssembly', witnessCalculatorCode);
  fn(module, exports, WebAssembly);
  
  // Call the builder function
  return await module.exports(wasm);
}
