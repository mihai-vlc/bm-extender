module.exports = {
    "root": true,
    "plugins": [
    ],
    "extends": [
        "eslint:recommended",
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true,
        "webextensions": true,
        "jquery": true
    },
    "rules": {
        "semi": [2, "always"],
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    },
    "ignorePatterns": ["jquery.js", "fixDW-libs.js", "choices.min.js", "toastify-js.js"],
}
