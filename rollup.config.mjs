import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import copy from "rollup-plugin-copy";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.ts",
  output: [
    {
      sourcemap: !production,
      file: "dist/index.js",
      // format: "iife", // browser
      format: "es", // browser
      // format: "cjs", // node
      // for both browser and node
      name: "sectionResizer",
      // format: "umd",
    },
    {
      sourcemap: !production,
      file: "dist/index.min.js",
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
    copy({
      targets: [
        {
          src: "dist/*",
          dest: "example/section-resizer/",
        },
      ],
      hook: "writeBundle",
    }),
  ],
};
