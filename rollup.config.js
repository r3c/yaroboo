import includePaths from "rollup-plugin-includepaths";
import { terser } from "rollup-plugin-terser";

export default {
    output: {
        format: 'iife',
        inlineDynamicImports: true
    },
    plugins: [includePaths({
        paths: ['.']
    }), terser()]
};