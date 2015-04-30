
var babel = require('gulp-babel');
var del = require('del');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var vinylPaths = require('vinyl-paths');

var dirs = {
  dist: '.dist',
  server: 'server'
};

gulp.task('default', ['dist']);

gulp.task('dev', ['dist', 'watch']);

gulp.task('watch', function () {
  gulp.watch(dirs.server + '/**/*', ['dist-code', 'dist-copy-other']);

  console.log('Watches are active for continuously disting dev files.');
  console.log('  To start dev server: `npm run start` in a separate shell');
  console.log('  In debug mode: `npm run debug` and `node-inspector` in two separate shells');
});

gulp.task('dist', ['dist-code', 'dist-etl', 'dist-copy-other', 'dist-packaging']);

gulp.task('dist-packaging', function () {
  return gulp.src('package.json')
    .pipe(gulp.dest(dirs.dist));
});

gulp.task('dist-code', function () {
  return gulp.src(dirs.server + '/**/*.es')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dirs.dist + '/' + dirs.server));
});

gulp.task('dist-copy-other', function () {
  return gulp.src([dirs.server + '/**/*', '!' + dirs.server + '/**/*.es'])
    .pipe(gulp.dest(dirs.dist + '/' + dirs.server));
});

gulp.task('dist-etl', function () {
  return gulp.src('etl.es')
    .pipe(babel())
    .pipe(gulp.dest(dirs.dist));
});

gulp.task('clean', ['clean-dist']);

gulp.task('clean-dist', function () {
  return gulp.src(dirs.dist)
    .pipe(vinylPaths(del));
});

gulp.task('fresh-dist', function (callback) {
  runSequence(
    'clean',
    'dist',
    callback);
});
