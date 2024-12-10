// vite.config.js
import { defineConfig } from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-standalone-app/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig({
  root: "src",
  build: {
    // Relative to the root
    outDir: "../dist"
    // rollupOptions: {
    //   external: ["process"]
    // },
  },
  // resolve: {
  //   alias: {
  //     src: path.resolve(__dirname, 'src'),
  //   }
  // },
  plugins: [
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      // include: [ "crypto", "stream", "perf_hooks", "process" ],
      include: ["crypto"],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      exclude: [
        // "stream", "perf_hooks"
        "process"
        // 'http', // Excludes the polyfill for `http` and `node:http`.
      ]
      // // Whether to polyfill specific globals.
      // globals: {
      //   Buffer: true, // can also be 'build', 'dev', or false
      //   global: true,
      //   process: true,
      // },
      // // Whether to polyfill `node:` protocol imports.
      // protocolImports: true,
    }),
    react({
      // Use React plugin in all *.jsx and *.tsx files
      include: "../src/**/*.{jsx,tsx}"
    })
  ],
  test: {
    root: "tests",
    globals: true,
    watch: false,
    environment: "happy-dom",
    setupFiles: ["./setup.ts"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxub25vXFxcXERvY3VtZW50c1xcXFxkZXZob21lXFxcXG1pcm9pci1hcHAtZGV2XFxcXHBhY2thZ2VzXFxcXG1pcm9pci1zdGFuZGFsb25lLWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbm9ub1xcXFxEb2N1bWVudHNcXFxcZGV2aG9tZVxcXFxtaXJvaXItYXBwLWRldlxcXFxwYWNrYWdlc1xcXFxtaXJvaXItc3RhbmRhbG9uZS1hcHBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL25vbm8vRG9jdW1lbnRzL2RldmhvbWUvbWlyb2lyLWFwcC1kZXYvcGFja2FnZXMvbWlyb2lyLXN0YW5kYWxvbmUtYXBwL3ZpdGUuY29uZmlnLmpzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscydcclxuLy8gaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByb290OiAnc3JjJyxcclxuICBidWlsZDoge1xyXG4gICAgLy8gUmVsYXRpdmUgdG8gdGhlIHJvb3RcclxuICAgIG91dERpcjogJy4uL2Rpc3QnLFxyXG4gICAgLy8gcm9sbHVwT3B0aW9uczoge1xyXG4gICAgLy8gICBleHRlcm5hbDogW1wicHJvY2Vzc1wiXVxyXG4gICAgLy8gfSxcclxuICB9LFxyXG4gIC8vIHJlc29sdmU6IHtcclxuICAvLyAgIGFsaWFzOiB7XHJcbiAgLy8gICAgIHNyYzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gIC8vICAgfVxyXG4gIC8vIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgbm9kZVBvbHlmaWxscyh7XHJcbiAgICAgIC8vIFRvIGFkZCBvbmx5IHNwZWNpZmljIHBvbHlmaWxscywgYWRkIHRoZW0gaGVyZS4gSWYgbm8gb3B0aW9uIGlzIHBhc3NlZCwgYWRkcyBhbGwgcG9seWZpbGxzXHJcbiAgICAgIC8vIGluY2x1ZGU6IFsgXCJjcnlwdG9cIiwgXCJzdHJlYW1cIiwgXCJwZXJmX2hvb2tzXCIsIFwicHJvY2Vzc1wiIF0sXHJcbiAgICAgIGluY2x1ZGU6IFsgXCJjcnlwdG9cIiBdLFxyXG4gICAgICAvLyBUbyBleGNsdWRlIHNwZWNpZmljIHBvbHlmaWxscywgYWRkIHRoZW0gdG8gdGhpcyBsaXN0LiBOb3RlOiBpZiBpbmNsdWRlIGlzIHByb3ZpZGVkLCB0aGlzIGhhcyBubyBlZmZlY3RcclxuICAgICAgZXhjbHVkZTogW1xyXG4gICAgICAgIC8vIFwic3RyZWFtXCIsIFwicGVyZl9ob29rc1wiXHJcbiAgICAgICAgXCJwcm9jZXNzXCJcclxuICAgICAgICAvLyAnaHR0cCcsIC8vIEV4Y2x1ZGVzIHRoZSBwb2x5ZmlsbCBmb3IgYGh0dHBgIGFuZCBgbm9kZTpodHRwYC5cclxuICAgICAgXSxcclxuICAgICAgLy8gLy8gV2hldGhlciB0byBwb2x5ZmlsbCBzcGVjaWZpYyBnbG9iYWxzLlxyXG4gICAgICAvLyBnbG9iYWxzOiB7XHJcbiAgICAgIC8vICAgQnVmZmVyOiB0cnVlLCAvLyBjYW4gYWxzbyBiZSAnYnVpbGQnLCAnZGV2Jywgb3IgZmFsc2VcclxuICAgICAgLy8gICBnbG9iYWw6IHRydWUsXHJcbiAgICAgIC8vICAgcHJvY2VzczogdHJ1ZSxcclxuICAgICAgLy8gfSxcclxuICAgICAgLy8gLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHMuXHJcbiAgICAgIC8vIHByb3RvY29sSW1wb3J0czogdHJ1ZSxcclxuICAgIH0pLFxyXG4gICAgcmVhY3Qoe1xyXG4gICAgICAvLyBVc2UgUmVhY3QgcGx1Z2luIGluIGFsbCAqLmpzeCBhbmQgKi50c3ggZmlsZXNcclxuICAgICAgaW5jbHVkZTogJy4uL3NyYy8qKi8qLntqc3gsdHN4fScsXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIHRlc3Q6IHtcclxuICAgIHJvb3Q6IFwidGVzdHNcIixcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICB3YXRjaDogZmFsc2UsXHJcbiAgICBlbnZpcm9ubWVudDogJ2hhcHB5LWRvbScsXHJcbiAgICBzZXR1cEZpbGVzOiBbJy4vc2V0dXAudHMnXSxcclxuICB9LFxyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBRzlCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSVY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxTQUFTO0FBQUEsSUFDUCxjQUFjO0FBQUE7QUFBQTtBQUFBLE1BR1osU0FBUyxDQUFFLFFBQVM7QUFBQTtBQUFBLE1BRXBCLFNBQVM7QUFBQTtBQUFBLFFBRVA7QUFBQTtBQUFBLE1BRUY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFTRixDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUE7QUFBQSxNQUVKLFNBQVM7QUFBQSxJQUNYLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsSUFDVCxPQUFPO0FBQUEsSUFDUCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMsWUFBWTtBQUFBLEVBQzNCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
