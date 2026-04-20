const esbuild = require('esbuild')

Promise.all([
  esbuild.build({
    entryPoints: ['./src/extension/content/index.js'],
    bundle: true,
    outfile: 'build/content.js',
    format: 'iife',
    target: ['chrome114', 'firefox115'],
    minify: false
  }),
  esbuild.build({
    entryPoints: ['./src/extension/utils/hidingChatGPTSection.js'],
    bundle: true,
    outfile: 'build/hidingChatGPTSection.js',
    format: 'iife',
    target: ['chrome114', 'firefox115'],
    minify: false
  }),
  esbuild.build({
    entryPoints: ['./src/extension/background/index.js'],
    bundle: true,
    outfile: 'build/background.js',
    format: 'iife',
    target: ['chrome114'],
    minify: false
  }),
  esbuild.build({
    entryPoints: ["src/dialog.js"],
    bundle: true,
    outfile: "build/dialog.js",
    minify: true,
    sourcemap: true,
    loader: { '.js': 'jsx' },
    define: { "process.env.NODE_ENV": '"production"' },
    jsx: "automatic",
    target: ['chrome114', 'firefox115'],
  })
]).catch(() => process.exit(1));