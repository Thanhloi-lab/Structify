module.exports = {
  root: true,

  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },

  plugins: ["react", "react-hooks", "import"],

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],

  settings: {
    react: {
      version: "detect"
    }
  },

  rules: {
    "no-undef": "off",

    "react/react-in-jsx-scope": "off",

    "react/prop-types": "off",

    "no-unused-vars": "warn",
    "no-console": "off",

    "import/no-unresolved": "off",
    "import/no-unused-modules": "off",

    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },

  ignorePatterns: [
    "build/",
    "node_modules/",
    "*.config.js"
  ]
};