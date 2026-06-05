import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // kokoro-js / @huggingface/transformers ship a Node backend (onnxruntime-node +
  // a native .node binary and an optional `sharp` dep). In the browser they use
  // onnxruntime-web (WASM) instead, so we alias the Node-only pieces to `false`
  // to keep webpack from trying to bundle the native binary.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "onnxruntime-node$": false,
      sharp$: false,
    } as Record<string, string | false>;
    return config;
  },
};

export default nextConfig;
