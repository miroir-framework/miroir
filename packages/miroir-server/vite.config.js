/// <reference types="vitest" />
import { defineConfig } from "vite";
import { VitePluginNode } from 'vite-plugin-node';
import * as path from "path";

export default defineConfig({
  root: 'src',
  build: {
    // Relative to the root
    outDir: '../dist',
    target: 'esnext' //browsers can handle the latest ES features
  },
  plugins: [
    ...VitePluginNode({
      // Nodejs native Request adapter
      // currently this plugin support 'express', 'nest', 'koa' and 'fastify' out of box,
      // you can also pass a function if you are using other frameworks, see Custom Adapter section
      adapter: 'express',

      // tell the plugin where is your project entry
      appPath: './server.ts',

      // Optional, default: 'viteNodeApp'
      // the name of named export of you app from the appPath file
      exportName: 'miroir-server',

      // Optional, default: 'esbuild'
      // The TypeScript compiler you want to use
      // by default this plugin is using vite default ts compiler which is esbuild
      // 'swc' compiler is supported to use as well for frameworks
      // like Nestjs (esbuild dont support 'emitDecoratorMetadata' yet)
      // you need to INSTALL `@swc/core` as dev dependency if you want to use swc
      tsCompiler: 'esbuild',

      swcOptions: {
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            decorators: true
          },
         transform: {
            legacyDecorator: true,
            decoratorMetadata: true
          }
        }
      },
    })
  ],
  // test: {
  //   root: "tests",
  //   globals: true,
  //   watch: false,
  //   maxConcurrency: 1,
  //   environment: 'node',
  //   setupFiles: ['./setup.ts'],
  // },
});