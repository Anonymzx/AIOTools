import withPWA from "@ducanh2912/next-pwa";

// onnxruntime (via @imgly/background-removal) ships prebuilt ESM chunks that
// webpack emits verbatim to static/media/*.mjs. They contain bare `import`
// statements, so Next's minifier (SWC -> Terser fallback) cannot parse them
// as classic scripts and the production build fails. Marking these raw assets
// as already-minimized makes the minifier skip them; they stay separate lazy
// assets and never join the initial bundle.
const ORT_RAW_ASSET = /static\/media\/ort[\w.-]*\.mjs$/i;

class SkipRawOrtMinifyPlugin {
  apply(compiler) {
    try {
      const { Compilation } = compiler.webpack;
      compiler.hooks.thisCompilation.tap("SkipRawOrtMinify", (compilation) => {
        compilation.hooks.processAssets.tap(
          { name: "SkipRawOrtMinify", stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS },
          () => {
            try {
              for (const asset of compilation.getAssets()) {
                try {
                  if (ORT_RAW_ASSET.test(asset.name) && asset.info?.minimized !== true) {
                    compilation.updateAsset(asset.name, asset.source, (old) => ({
                      ...old,
                      minimized: true,
                    }));
                  }
                } catch {
                  // per-asset best effort — never break the build
                }
              }
            } catch {
              // never break the build
            }
          },
        );
      });
    } catch {
      // never break the build
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    try {
      config.plugins = [...(config.plugins ?? []), new SkipRawOrtMinifyPlugin()];
    } catch {
      // never break the build
    }
    return config;
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheStartUrl: true,
  dynamicStartUrl: false,
})(nextConfig);
