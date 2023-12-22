// vite.config.js
import { defineConfig } from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-standalone-app/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/nono/Documents/devhome/miroir-app-dev/node_modules/@vitejs/plugin-react/dist/index.mjs";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxub25vXFxcXERvY3VtZW50c1xcXFxkZXZob21lXFxcXG1pcm9pci1hcHAtZGV2XFxcXHBhY2thZ2VzXFxcXG1pcm9pci1zdGFuZGFsb25lLWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbm9ub1xcXFxEb2N1bWVudHNcXFxcZGV2aG9tZVxcXFxtaXJvaXItYXBwLWRldlxcXFxwYWNrYWdlc1xcXFxtaXJvaXItc3RhbmRhbG9uZS1hcHBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL25vbm8vRG9jdW1lbnRzL2RldmhvbWUvbWlyb2lyLWFwcC1kZXYvcGFja2FnZXMvbWlyb2lyLXN0YW5kYWxvbmUtYXBwL3ZpdGUuY29uZmlnLmpzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcm9vdDogJ3NyYycsXHJcbiAgYnVpbGQ6IHtcclxuICAgIC8vIFJlbGF0aXZlIHRvIHRoZSByb290XHJcbiAgICBvdXREaXI6ICcuLi9kaXN0JyxcclxuICB9LFxyXG4gIC8vIHJlc29sdmU6IHtcclxuICAvLyAgIGFsaWFzOiB7XHJcbiAgLy8gICAgIHNyYzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gIC8vICAgfVxyXG4gIC8vIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3Qoe1xyXG4gICAgICAvLyBVc2UgUmVhY3QgcGx1Z2luIGluIGFsbCAqLmpzeCBhbmQgKi50c3ggZmlsZXNcclxuICAgICAgaW5jbHVkZTogJy4uL3NyYy8qKi8qLntqc3gsdHN4fScsXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIHRlc3Q6IHtcclxuICAgIHJvb3Q6IFwidGVzdHNcIixcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICB3YXRjaDogZmFsc2UsXHJcbiAgICBlbnZpcm9ubWVudDogJ2hhcHB5LWRvbScsXHJcbiAgICBzZXR1cEZpbGVzOiBbJy4vc2V0dXAudHMnXSxcclxuICB9LFxyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBLEVBQ1Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxNQUVKLFNBQVM7QUFBQSxJQUNYLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsSUFDVCxPQUFPO0FBQUEsSUFDUCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMsWUFBWTtBQUFBLEVBQzNCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
