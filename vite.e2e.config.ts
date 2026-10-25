import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

/**
 * Dev-server config used by scripts/e2e.mjs when node_modules is a symlink
 * into another worktree: Vite's fs.allow rejects /@fs font paths that
 * physically live outside this root. The e2e suite treats console errors as
 * failures, so relax the fs guard for the test server only.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    server: {
      fs: {
        strict: false,
      },
    },
  }),
);
