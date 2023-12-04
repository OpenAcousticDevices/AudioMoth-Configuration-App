module.exports = {
    extends: 'standard',
    rules: {
        semi: [2, 'always'],
        indent: ['error', 4],
        'padded-blocks': ['error', 'always'],
        'no-useless-escape': 0,
        'object-curly-spacing': ['error', 'never'],
        'no-extend-native': ['error', {exceptions: ['Array']}],
        'standard/no-callback-literal': 0,
        'no-throw-literal': 0
    }
};
