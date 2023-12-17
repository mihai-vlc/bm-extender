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

    },
    "ignorePatterns": ["jquery.js", "fixDW-libs.js"],
}