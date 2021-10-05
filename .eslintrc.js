module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        'indent': ['error', 4],
        'space-before-function-paren': [
            'error',
            {
                'anonymous': 'never',
                'named': 'never',
                'asyncArrow': 'always',
            },
        ],
        'no-use-before-define': ['warn'],
        'no-param-reassign': ['warn'],
        'no-restricted-syntax': ['warn'],
        'guard-for-in': ['warn'],
        'no-underscore-dangle': ['warn'],
        'no-empty': ['warn'],
    },
    'globals': {
        'describe': 'readonly',
        'it': 'readonly',
        'afterEach': 'readonly',
        'beforeEach': 'readonly',
    },
};
