// Функции gulp
const { src, dest, parallel, series, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const notify = require('gulp-notify');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const browserSync = require('browser-sync').create();
const fileInclude = require('gulp-file-include');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const delApp = require('del');
const tinypng = require('gulp-tinypng-compress');


const fonts = () => {
    src('./src/fonts/**.ttf')
        .pipe(ttf2woff())
        .pipe(dest('./app/fonts/'))
    return src('./src/fonts/**.ttf')
        .pipe(ttf2woff2())
        .pipe(dest('./app/fonts/'))
}

const styles = () => {
    return src('./src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', notify.onError()))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(cleanCss(
            {
                level: { 1: { specialComments: 0 } },
                format: 'beautify',
            }
        )
        )
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/css'))
        .pipe(browserSync.stream())
}

const htmlInclude = () => {
    return src('./src/**/*.html')
        .pipe(fileInclude({
            prefix: '@',
            basepath: '@file'
        }))
        .pipe(dest('./app'))
        .pipe(browserSync.stream())
}

const imgToApp = () => {
    return src(['./src/images/**.jpg', './src/images/**.png', './src/images/**.jpeg', './src/images/**.svg'])
        .pipe(dest('./app/images'))
}

const resources = () => {
    return src('./src/resources/**')
        .pipe(dest('./app'))
}

const svgSpriteFunction = () => {
    return src('./src/images/svg/**.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg'
                }
            }
        }))
        .pipe(dest('./app/images'))
}

const clean = () => {
    return delApp(['app/*'])
}

const scripts = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            output: {
                filename: 'main.js',
            },
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', { targets: "defaults" }]
                                ]
                            }
                        }
                    }
                ]
            }
        }))
        .pipe(sourcemaps.init())
        // .pipe(uglify().on("error", notify.onError()))
        .pipe(uglify().on('error', function (err) {
            console.error('WEBPACK ERROR', err);
            this.emit('end'); // Don't stop the rest of the task
        }))


        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/js'))
        .pipe(browserSync.stream());
}

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: "./app"
        }
    });
    watch('./src/scss/**/*.scss', styles);
    watch('./src/**/*.html', htmlInclude);
    watch('./src/images/**.jpg', imgToApp);
    watch('./src/images/**.png', imgToApp);
    watch('./src/images/**.jpeg', imgToApp);
    watch('./src/images/**.svg', imgToApp);
    watch('./src/images/svg/**.svg', svgSpriteFunction);
    watch('./src/resources/**', resources);
    watch('./src/fonts/**.ttf', fonts);
    watch('./src/js/**/*.js', scripts)
}

exports.styles = styles;
exports.watchFiles = watchFiles;
exports.fileInclude = htmlInclude;
exports.default = series(clean, parallel(htmlInclude, scripts, fonts, imgToApp, svgSpriteFunction, resources), styles, watchFiles);

const tinyPng = () => {
    return src(['./src/images/**.jpg', './src/images/**.png', './src/images/**.jpeg'])
        .pipe(tinypng({
            key: 'sBwfd7r4N1TnwK1xVd2Xwjfks1KwYD8g'
        }))
        .pipe(dest('./app/images'))
}

const stylesBuild = () => {
    return src('./src/scss/**/*.scss')
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', notify.onError()))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(cleanCss({
            level: 2
        }))
        .pipe(dest('./app/css'))
}


const scriptsBuild = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            output: {
                filename: 'main.js',
            },
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', { targets: "defaults" }]
                                ]
                            }
                        }
                    }
                ]
            }
        }))
        .pipe(uglify().on("error", notify.onError()))
        .pipe(dest('./app/js'))
}

exports.build = series(clean, parallel(htmlInclude, scriptsBuild, fonts, imgToApp, svgSpriteFunction, resources), stylesBuild, tinyPng);
