module.exports = {
    // Basic formatting
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    quoteProps: 'as-needed',
    
    // JSX formatting
    jsxSingleQuote: false,
    jsxBracketSameLine: false,
    
    // Punctuation
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'avoid',
    
    // Special formatting
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    vueIndentScriptAndStyle: false,
    endOfLine: 'lf',
    embeddedLanguageFormatting: 'auto',
    
    // Override parsers for specific file types
    overrides: [
        {
            files: '*.json',
            options: {
                parser: 'json',
                tabWidth: 2
            }
        },
        {
            files: '*.md',
            options: {
                parser: 'markdown',
                proseWrap: 'always'
            }
        },
        {
            files: '*.css',
            options: {
                parser: 'css',
                singleQuote: false
            }
        },
        {
            files: '*.html',
            options: {
                parser: 'html',
                htmlWhitespaceSensitivity: 'strict'
            }
        }
    ],

    // Plugin configurations
    plugins: [
        'prettier-plugin-organize-imports'
    ],

    // Custom parser options
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },

    // Editor configuration
    editorconfig: true,

    // Ignore files (in addition to .prettierignore)
    ignorePath: '.prettierignore'
};