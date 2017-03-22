// Requires browser sync
var browserSync = require('browser-sync').create();

var del = require('del');

//run gulp watch to launch browser sync and save scss to css
var gulp = require('gulp');

// concatenate CSS files
var cssnano = require('gulp-cssnano');

// if statements for gulp
var gulpif = require('gulp-if');

// minify images for web
var imagemin = require('gulp-imagemin');

// Requires the gulp-sass plugin
var sass = require('gulp-sass');

// concatenate JS files
var uglify = require('gulp-uglify');

// creates minified file name
var useref = require('gulp-useref');

// runs sequences
var runSequence = require('run-sequence');


gulp.task('watch', ['browserSync', 'sass'], function (){
  gulp.watch('app/sass/**/*.scss', ['sass']);  
  // Reloads the browser whenever HTML or JS files change
  gulp.watch('app/*.html', browserSync.reload); 
  gulp.watch('app/js/**/*.js', browserSync.reload);
});

gulp.task('sass', function() {
  return gulp.src('app/sass/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: 'app'
    },
  })
});

gulp.task('useref', function(){
  return gulp.src('app/*.html')
    .pipe(useref())
    // Minifies only if it's a JavaScript file
    .pipe(gulpif('*.js', uglify()))
    // Minifies only if it's a CSS file
    .pipe(gulpif('*.css', cssnano()))
    .pipe(gulp.dest('dist'))
});

gulp.task('images', function(){
  return gulp.src('app/img/**/*.+(png|jpg|jpeg|gif|svg)')
  .pipe(imagemin({
      // Setting interlaced to true
      interlaced: true
    }))
  .pipe(gulp.dest('dist/img'))
});

gulp.task('clean:dist', function() {
  return del.sync('dist');
});

gulp.task('build', function (callback) {
  runSequence('clean:dist', 
    ['sass', 'useref', 'images'],
    callback
  )
});

gulp.task('default', function (callback) {
  runSequence(['sass', 'watch'],
    callback
  )
});
