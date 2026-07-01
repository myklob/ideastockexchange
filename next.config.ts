import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the optional embedding runtime (native onnx binaries) out of the
  // server bundle; it is dynamically imported and falls back gracefully.
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;
