import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.ts",
  output: [
    {
      sourcemap: !production,
      file: "dist/bundle.js",
      // format: "iife", // browser
      format: "es", // browser
      // format: "cjs", // node
      // for both browser and node
      name: "sectionResizer",
      // format: "umd",
    },
    {
      sourcemap: !production,
      file: "dist/bundle.min.js",
      // format: "iife", // browser
      format: "es", // browser
      // format: "cjs", // node
      // for both browser and node
      name: "sectionResizer",
      // format: "umd",
      plugins: [terser({ compress: { drop_console: true } })],
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: !production,
      inlineSources: !production,
    }),
  ],
};
