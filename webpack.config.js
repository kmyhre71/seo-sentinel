const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

// Common configuration
const config = {
    // Set the mode based on environment
    mode: isProduction ? 'production' : 'development',
    
    // Enable source maps for development
    devtool: isProduction ? false : 'source-map',
    
    // Entry points for different parts of the extension
    entry: {
        background: './src/background/background.js',
        content: './src/content/content.js',
        popup: './src/popup/popup.js',
        options: './src/options/options.js'
    },
    
    // Output configuration
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        clean: true // Clean the dist folder before each build
    },
    
    // Module rules for different file types
    module: {
        rules: [
            // JavaScript files
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-transform-runtime',
                            '@babel/plugin-proposal-class-properties'
                        ]
                    }
                }
            },
            // CSS files
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: !isProduction
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    ['postcss-preset-env', {}],
                                    ['autoprefixer', {}]
                                ]
                            },
                            sourceMap: !isProduction
                        }
                    }
                ]
            } //,
//            // Images
//            {
//                test: /\.(png|jpg|jpeg|gif|svg)$/i,
//                type: 'asset/resource',
//                generator: {
//                    filename: 'assets/images/[name][ext]'
//                }
//            },
//            // Fonts
//            {
//                test: /\.(woff|woff2|eot|ttf|otf)$/i,
//                type: 'asset/resource',
//                generator: {
//                    filename: 'assets/fonts/[name][ext]'
//                }
//            }
        ]
    },
    
    // Plugins configuration
    plugins: [
        // Extract CSS into separate files
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        
        // Copy static assets
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/icons',
                    to: 'icons'
                },
                {
                    from: 'manifest.json',
                    to: 'manifest.json',
                    transform(content) {
                        const manifest = JSON.parse(content);
                        if (!isProduction) {
                            manifest.name += ' (Dev)';
                        }
                        return JSON.stringify(manifest, null, 2);
                    }
                }
            ]
        }),
        
        // Generate HTML files
        new HtmlWebpackPlugin({
            template: './src/popup/popup.html',
            filename: 'popup.html',
            chunks: ['popup'],
            cache: false
        }),
        new HtmlWebpackPlugin({
            template: './src/options/options.html',
            filename: 'options.html',
            chunks: ['options'],
            cache: false
        })
    ],
    
    // Optimization configuration
    optimization: {
        minimize: isProduction,
        minimizer: [
            // Minimize JavaScript
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false
                    },
                    compress: {
                        drop_console: isProduction
                    }
                },
                extractComments: false
            }),
            // Minimize CSS
            new CssMinimizerPlugin()
        ],
        // Split chunks for better caching
        splitChunks: {
            chunks: 'all',
            name: 'vendor'
        }
    },
    
    // Performance hints
    performance: {
        hints: isProduction ? 'warning' : false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    
    // Resolve configuration
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@icons': path.resolve(__dirname, 'src/icons')
        }
    },
    
    // Development server configuration
    devServer: {
        contentBase: './dist',
        hot: true,
        port: 9000
    }
};

// Environment specific configurations
if (isProduction) {
    // Production-specific configuration
    config.plugins.push(
        // Add any production-only plugins here
    );
} else {
    // Development-specific configuration
    config.plugins.push(
        // Add any development-only plugins here
    );
}

module.exports = config;