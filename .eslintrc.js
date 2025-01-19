module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
        webextensions: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'plugin:prettier/recommended',
        'plugin:jest/recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    plugins: [
        'prettier',
        'jest'
    ],
    rules: {
        // Error prevention
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        'no-constant-condition': ['error', {
            checkLoops: false
        }],

        // Best practices
        'curly': ['error', 'all'],
        'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
        'guard-for-in': 'error',
        'no-caller': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-param-reassign': 'error',
        'no-return-assign': ['error', 'always'],
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unused-expressions': ['error', {
            allowShortCircuit: true,
            allowTernary: true
        }],
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'error',
        'prefer-promise-reject-errors': 'error',
        'radix': 'error',
        'wrap-iife': ['error', 'any'],
        'yoda': 'error',

        // Variables
        'no-label-var': 'error',
        'no-shadow': 'error',
        'no-undef-init': 'error',

        // Stylistic
        'array-bracket-spacing': ['error', 'never'],
        'block-spacing': ['error', 'always'],
        'brace-style': ['error', '1tbs', {
            allowSingleLine: true
        }],
        'camelcase': ['error', {
            properties: 'never',
            ignoreDestructuring: true
        }],
        'comma-dangle': ['error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'never'
        }],
        'comma-spacing': ['error', {
            before: false,
            after: true
        }],
        'comma-style': ['error', 'last'],
        'computed-property-spacing': ['error', 'never'],
        'eol-last': ['error', 'always'],
        'func-call-spacing': ['error', 'never'],
        'key-spacing': ['error', {
            beforeColon: false,
            afterColon: true
        }],
        'keyword-spacing': ['error', {
            before: true,
            after: true
        }],
        'linebreak-style': ['error', 'unix'],
        'max-depth': ['error', 4],
        'max-len': ['error', {
            code: 100,
            tabWidth: 2,
            ignoreComments: true,
            ignoreTrailingComments: true,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true
        }],
        'max-nested-callbacks': ['error', 3],
        'max-params': ['error', 4],
        'max-statements-per-line': ['error', {
            max: 1
        }],
        'new-cap': ['error', {
            newIsCap: true,
            capIsNew: false,
            properties: true
        }],
        'new-parens': 'error',
        'no-array-constructor': 'error',
        'no-lonely-if': 'error',
        'no-mixed-operators': 'error',
        'no-multiple-empty-lines': ['error', {
            max: 2,
            maxEOF: 1,
            maxBOF: 0
        }],
        'no-new-object': 'error',
        'no-tabs': 'error',
        'no-trailing-spaces': 'error',
        'no-unneeded-ternary': ['error', {
            defaultAssignment: false
        }],
        'no-whitespace-before-property': 'error',
        'object-curly-spacing': ['error', 'always'],
        'padded-blocks': ['error', 'never'],
        'quote-props': ['error', 'as-needed'],
        'quotes': ['error', 'single', {
            avoidEscape: true,
            allowTemplateLiterals: true
        }],
        'semi': ['error', 'always'],
        'semi-spacing': ['error', {
            before: false,
            after: true
        }],
        'space-before-blocks': ['error', 'always'],
        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always'
        }],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'space-unary-ops': ['error', {
            words: true,
            nonwords: false
        }],
        'spaced-comment': ['error', 'always', {
            line: {
                markers: ['*package', '!', '/', ',', '=']
            },
            block: {
                balanced: true,
                markers: ['*package', '!', ',', ':', '::', 'flow-include'],
                exceptions: ['*']
            }
        }],
        'template-tag-spacing': ['error', 'never'],

        // ES6
        'arrow-parens': ['error', 'as-needed'],
        'arrow-spacing': ['error', {
            before: true,
            after: true
        }],
        'generator-star-spacing': ['error', {
            before: true,
            after: true
        }],
        'no-duplicate-imports': 'error',
        'no-useless-computed-key': 'error',
        'no-useless-constructor': 'error',
        'no-useless-rename': 'error',
        'no-var': 'error',
        'object-shorthand': ['error', 'always', {
            ignoreConstructors: false,
            avoidQuotes: true
        }],
        'prefer-arrow-callback': ['error', {
            allowNamedFunctions: false,
            allowUnboundThis: true
        }],
        'prefer-const': ['error', {
            destructuring: 'any',
            ignoreReadBeforeAssign: true
        }],
        'prefer-destructuring': ['error', {
            VariableDeclarator: {
                array: false,
                object: true
            },
            AssignmentExpression: {
                array: true,
                object: true
            }
        }, {
            enforceForRenamedProperties: false
        }],
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'prefer-template': 'error',
        'rest-spread-spacing': ['error', 'never'],
        'symbol-description': 'error',
        'template-curly-spacing': ['error', 'never'],
        'yield-star-spacing': ['error', 'both'],

        // Jest specific rules
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error'
    },
    overrides: [
        {
            files: ['tests/**/*.js'],
            env: {
                jest: true
            },
            rules: {
                'max-nested-callbacks': 'off',
                'max-len': 'off'
            }
        }
    ]
};