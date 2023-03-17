import "./style.css";
import { WASI } from "@bjorn3/browser_wasi_shim";

const wasi = new WASI([], [], []);
const wasiImportObj = { wasi_snapshot_preview1: wasi.wasiImport };
const wasm = await WebAssembly.instantiateStreaming(
  fetch("format.wasm"),
  wasiImportObj
);
wasi.inst = wasm.instance;
const exports = wasm.instance.exports;
exports.hs_init();
const memory = exports.memory;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const outputPtrPtr = exports.mallocPtr();
console.log("Initialized WASI reactor.");

document.querySelector("#format").addEventListener("click", (event) => {
  const input = document.getElementById("input").value;
  event.preventDefault();

  const inputLen = encoder.encode(input).byteLength;
  const inputPtr = exports.malloc(inputLen);
  const inputArr = new Uint8Array(memory.buffer, inputPtr, inputLen);
  encoder.encodeInto(input, inputArr);
  const outputLen = exports.formatRaw(inputPtr, inputLen, outputPtrPtr);
  if (outputLen < 0) {
    console.log("Error");
    return;
  } else {
    const outputPtrArr = new Uint32Array(memory.buffer, outputPtrPtr, 1);
    const outputPtr = outputPtrArr[0];
    const outputArr = new Uint8Array(memory.buffer, outputPtr, outputLen);
    const output = decoder.decode(outputArr);

    const outputElement = document.getElementById("output");
    outputElement.value = output;
    exports.free(outputPtr);
  }
});
