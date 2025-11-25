// ✅ Configuración corregida para Node.js + CommonJS
const js = require("@eslint/js");
const globals = require("globals");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  // ✅ Backend: Node.js
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
      ecmaVersion: "latest",
    },
    extends: [js.configs.recommended],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "semi": ["error", "always"],
      "quotes": ["warn", "double"],
      "eqeqeq": "warn",
      "camelcase": ["warn", {"properties": "always"}]
    },
  },
  // ✅ Frontend: navegador
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // ⭐ CONFIG para JEST (evita todos tus errores)
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        test: "readonly",
        expect: "readonly",
        describe: "readonly",
      },
    },
  },
]);

