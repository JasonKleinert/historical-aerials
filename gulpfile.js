
var babel = require('gulp-babel');
var del = require('del');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var vinylPaths = require('vinyl-paths');

var dirs = {
  dist: '.dist',
  server: 'server',
  data: 'data',
  config: 'config'
};

gulp.task('default', ['dist']);

gulp.task('dev', ['dist', 'watch']);

gulp.task('watch', function () {
  gulp.watch(dirs.server + '/**/*', ['dist-server']);
  gulp.watch(dirs.config + '/**/*', ['dist-config']);

  console.log('Watches are active for continuously disting dev files.');
  console.log('  To start dev server: `npm run start` in a separate shell');
  console.log('  In debug mode: `npm run debug` and `node-inspector` in two separate shells');
});

gulp.task('dist', ['dist-server', 'dist-config', 'dist-etl', 'dist-packaging']);

gulp.task('dist-packaging', function () {
  return gulp.src('package.json')
    .pipe(gulp.dest(dirs.dist));
});

var onErr = function (err) {
  console.log(err.toString());
  this.emit('end');
};

gulp.task('dist-server', ['dist-copy-server'], function () {
  return gulp.src(dirs.server + '/**/*.es')
    .pipe(babel())
    .on('error', onErr)
    .pipe(gulp.dest(dirs.dist + '/' + dirs.server));
});

gulp.task('dist-config', ['dist-copy-config'], function () {
  return gulp.src(dirs.config + '/**/*.es')
    .pipe(babel())
    .on('error', onErr)
    .pipe(gulp.dest(dirs.dist + '/' + dirs.config));
});

gulp.task('dist-copy-server', function () {
  return gulp.src([
      dirs.server + '/**/*',
      '!' + dirs.server + '/**/*.es'
    ])
    .pipe(gulp.dest(dirs.dist + '/' + dirs.server));
});

gulp.task('dist-copy-config', function () {
  return gulp.src([
      dirs.config + '/**/*',
      '!' + dirs.config + '/**/*.es'
    ])
    .pipe(gulp.dest(dirs.dist + '/' + dirs.config));
});


gulp.task('dist-etl', ['dist-config', 'dist-copy-data'], function () {
  return gulp.src('etl.es')
    .pipe(babel())
    .on('error', onErr)
    .pipe(gulp.dest(dirs.dist));
});

gulp.task('dist-copy-data', function () {
  return gulp.src(dirs.data + '/**/*')
    .pipe(gulp.dest(dirs.dist + '/' + dirs.data));
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
