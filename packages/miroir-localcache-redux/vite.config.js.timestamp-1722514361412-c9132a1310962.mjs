// packages/miroir-localcache-redux/vite.config.js
import { defineConfig } from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-localcache-redux/node_modules/vite/dist/node/index.js";
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
      // include: ['crypto'],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZXMvbWlyb2lyLWxvY2FsY2FjaGUtcmVkdXgvdml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxub25vXFxcXERvY3VtZW50c1xcXFxkZXZob21lXFxcXG1pcm9pci1hcHAtZGV2XFxcXHBhY2thZ2VzXFxcXG1pcm9pci1sb2NhbGNhY2hlLXJlZHV4XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxub25vXFxcXERvY3VtZW50c1xcXFxkZXZob21lXFxcXG1pcm9pci1hcHAtZGV2XFxcXHBhY2thZ2VzXFxcXG1pcm9pci1sb2NhbGNhY2hlLXJlZHV4XFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ub25vL0RvY3VtZW50cy9kZXZob21lL21pcm9pci1hcHAtZGV2L3BhY2thZ2VzL21pcm9pci1sb2NhbGNhY2hlLXJlZHV4L3ZpdGUuY29uZmlnLmpzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscydcclxuLy8gaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByb290OiAnc3JjJyxcclxuICBidWlsZDoge1xyXG4gICAgLy8gUmVsYXRpdmUgdG8gdGhlIHJvb3RcclxuICAgIG91dERpcjogJy4uL2Rpc3QnLFxyXG4gIH0sXHJcbiAgLy8gcmVzb2x2ZToge1xyXG4gIC8vICAgYWxpYXM6IHtcclxuICAvLyAgICAgc3JjOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXHJcbiAgLy8gICB9XHJcbiAgLy8gfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICBub2RlUG9seWZpbGxzKHtcclxuICAgICAgLy8gVG8gYWRkIG9ubHkgc3BlY2lmaWMgcG9seWZpbGxzLCBhZGQgdGhlbSBoZXJlLiBJZiBubyBvcHRpb24gaXMgcGFzc2VkLCBhZGRzIGFsbCBwb2x5ZmlsbHNcclxuICAgICAgLy8gaW5jbHVkZTogWydjcnlwdG8nXSxcclxuICAgICAgLy8gVG8gZXhjbHVkZSBzcGVjaWZpYyBwb2x5ZmlsbHMsIGFkZCB0aGVtIHRvIHRoaXMgbGlzdC4gTm90ZTogaWYgaW5jbHVkZSBpcyBwcm92aWRlZCwgdGhpcyBoYXMgbm8gZWZmZWN0XHJcbiAgICAgIC8vIGV4Y2x1ZGU6IFtcclxuICAgICAgLy8gICAnaHR0cCcsIC8vIEV4Y2x1ZGVzIHRoZSBwb2x5ZmlsbCBmb3IgYGh0dHBgIGFuZCBgbm9kZTpodHRwYC5cclxuICAgICAgLy8gXSxcclxuICAgICAgLy8gLy8gV2hldGhlciB0byBwb2x5ZmlsbCBzcGVjaWZpYyBnbG9iYWxzLlxyXG4gICAgICAvLyBnbG9iYWxzOiB7XHJcbiAgICAgIC8vICAgQnVmZmVyOiB0cnVlLCAvLyBjYW4gYWxzbyBiZSAnYnVpbGQnLCAnZGV2Jywgb3IgZmFsc2VcclxuICAgICAgLy8gICBnbG9iYWw6IHRydWUsXHJcbiAgICAgIC8vICAgcHJvY2VzczogdHJ1ZSxcclxuICAgICAgLy8gfSxcclxuICAgICAgLy8gLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHMuXHJcbiAgICAgIC8vIHByb3RvY29sSW1wb3J0czogdHJ1ZSxcclxuICAgIH0pLFxyXG4gICAgcmVhY3Qoe1xyXG4gICAgICAvLyBVc2UgUmVhY3QgcGx1Z2luIGluIGFsbCAqLmpzeCBhbmQgKi50c3ggZmlsZXNcclxuICAgICAgaW5jbHVkZTogJy4uL3NyYy8qKi8qLntqc3gsdHN4fScsXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIHRlc3Q6IHtcclxuICAgIHJvb3Q6IFwidGVzdHNcIixcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICB3YXRjaDogZmFsc2UsXHJcbiAgICBlbnZpcm9ubWVudDogJ2hhcHB5LWRvbScsXHJcbiAgICBzZXR1cEZpbGVzOiBbJy4vc2V0dXAudHMnXSxcclxuICB9LFxyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBRzlCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBLEVBQ1Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxTQUFTO0FBQUEsSUFDUCxjQUFjO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBZWQsQ0FBQztBQUFBLElBQ0QsTUFBTTtBQUFBO0FBQUEsTUFFSixTQUFTO0FBQUEsSUFDWCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsT0FBTztBQUFBLElBQ1AsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLFlBQVk7QUFBQSxFQUMzQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
