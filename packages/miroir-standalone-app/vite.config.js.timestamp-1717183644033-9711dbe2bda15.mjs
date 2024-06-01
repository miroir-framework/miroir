// packages/miroir-standalone-app/vite.config.js
import { defineConfig } from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-standalone-app/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig({
  root: "src",
  build: {
    // Relative to the root
    outDir: "../dist"
  },
  // resolve: {
  //   alias: {
  //     src: path.resolve(__dirname, 'src'),
  //   }
  // },
  plugins: [
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ["crypto"]
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      // exclude: [
      //   'http', // Excludes the polyfill for `http` and `node:http`.
      // ],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZXMvbWlyb2lyLXN0YW5kYWxvbmUtYXBwL3ZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbm9ub1xcXFxEb2N1bWVudHNcXFxcZGV2aG9tZVxcXFxtaXJvaXItYXBwLWRldlxcXFxwYWNrYWdlc1xcXFxtaXJvaXItc3RhbmRhbG9uZS1hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG5vbm9cXFxcRG9jdW1lbnRzXFxcXGRldmhvbWVcXFxcbWlyb2lyLWFwcC1kZXZcXFxccGFja2FnZXNcXFxcbWlyb2lyLXN0YW5kYWxvbmUtYXBwXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ub25vL0RvY3VtZW50cy9kZXZob21lL21pcm9pci1hcHAtZGV2L3BhY2thZ2VzL21pcm9pci1zdGFuZGFsb25lLWFwcC92aXRlLmNvbmZpZy5qc1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPVwidml0ZXN0XCIgLz5cclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnXHJcbi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcm9vdDogJ3NyYycsXHJcbiAgYnVpbGQ6IHtcclxuICAgIC8vIFJlbGF0aXZlIHRvIHRoZSByb290XHJcbiAgICBvdXREaXI6ICcuLi9kaXN0JyxcclxuICB9LFxyXG4gIC8vIHJlc29sdmU6IHtcclxuICAvLyAgIGFsaWFzOiB7XHJcbiAgLy8gICAgIHNyYzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gIC8vICAgfVxyXG4gIC8vIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgbm9kZVBvbHlmaWxscyh7XHJcbiAgICAgIC8vIFRvIGFkZCBvbmx5IHNwZWNpZmljIHBvbHlmaWxscywgYWRkIHRoZW0gaGVyZS4gSWYgbm8gb3B0aW9uIGlzIHBhc3NlZCwgYWRkcyBhbGwgcG9seWZpbGxzXHJcbiAgICAgIGluY2x1ZGU6IFsnY3J5cHRvJ10sXHJcbiAgICAgIC8vIFRvIGV4Y2x1ZGUgc3BlY2lmaWMgcG9seWZpbGxzLCBhZGQgdGhlbSB0byB0aGlzIGxpc3QuIE5vdGU6IGlmIGluY2x1ZGUgaXMgcHJvdmlkZWQsIHRoaXMgaGFzIG5vIGVmZmVjdFxyXG4gICAgICAvLyBleGNsdWRlOiBbXHJcbiAgICAgIC8vICAgJ2h0dHAnLCAvLyBFeGNsdWRlcyB0aGUgcG9seWZpbGwgZm9yIGBodHRwYCBhbmQgYG5vZGU6aHR0cGAuXHJcbiAgICAgIC8vIF0sXHJcbiAgICAgIC8vIC8vIFdoZXRoZXIgdG8gcG9seWZpbGwgc3BlY2lmaWMgZ2xvYmFscy5cclxuICAgICAgLy8gZ2xvYmFsczoge1xyXG4gICAgICAvLyAgIEJ1ZmZlcjogdHJ1ZSwgLy8gY2FuIGFsc28gYmUgJ2J1aWxkJywgJ2RldicsIG9yIGZhbHNlXHJcbiAgICAgIC8vICAgZ2xvYmFsOiB0cnVlLFxyXG4gICAgICAvLyAgIHByb2Nlc3M6IHRydWUsXHJcbiAgICAgIC8vIH0sXHJcbiAgICAgIC8vIC8vIFdoZXRoZXIgdG8gcG9seWZpbGwgYG5vZGU6YCBwcm90b2NvbCBpbXBvcnRzLlxyXG4gICAgICAvLyBwcm90b2NvbEltcG9ydHM6IHRydWUsXHJcbiAgICB9KSxcclxuICAgIHJlYWN0KHtcclxuICAgICAgLy8gVXNlIFJlYWN0IHBsdWdpbiBpbiBhbGwgKi5qc3ggYW5kICoudHN4IGZpbGVzXHJcbiAgICAgIGluY2x1ZGU6ICcuLi9zcmMvKiovKi57anN4LHRzeH0nLFxyXG4gICAgfSksXHJcbiAgXSxcclxuICB0ZXN0OiB7XHJcbiAgICByb290OiBcInRlc3RzXCIsXHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgd2F0Y2g6IGZhbHNlLFxyXG4gICAgZW52aXJvbm1lbnQ6ICdoYXBweS1kb20nLFxyXG4gICAgc2V0dXBGaWxlczogWycuL3NldHVwLnRzJ10sXHJcbiAgfSxcclxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixTQUFTLHFCQUFxQjtBQUc5QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQSxFQUNWO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsU0FBUztBQUFBLElBQ1AsY0FBYztBQUFBO0FBQUEsTUFFWixTQUFTLENBQUMsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBYXBCLENBQUM7QUFBQSxJQUNELE1BQU07QUFBQTtBQUFBLE1BRUosU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxJQUNULE9BQU87QUFBQSxJQUNQLGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyxZQUFZO0FBQUEsRUFDM0I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
