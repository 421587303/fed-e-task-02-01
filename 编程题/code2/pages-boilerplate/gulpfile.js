const { src, dest, parallel, series, watch } = require("gulp");
const loadPlugins = require("gulp-load-plugins");

const del = require("del");
const browserSync = require("browser-sync");
const ghPages = require("gulp-gh-pages");

const production = process.argv[3] === "--production";

console.log(production);

const plugins = loadPlugins();
const bs = browserSync.create();
const {
  sass,
  babel,
  swig,
  imagemin,
  useref,
  uglify,
  cleanCss,
  htmlmin,
  eslint,
} = plugins;

const data = {
  menus: [
    {
      name: "Home",
      icon: "aperture",
      link: "index.html",
    },
    {
      name: "Features",
      link: "features.html",
    },
    {
      name: "About",
      link: "about.html",
    },
    {
      name: "Contact",
      link: "#",
      children: [
        {
          name: "Twitter",
          link: "https://twitter.com/w_zce",
        },
        {
          name: "About",
          link: "https://weibo.com/zceme",
        },
        {
          name: "divider",
        },
        {
          name: "About",
          link: "https://github.com/zce",
        },
      ],
    },
  ],
  pkg: require("./package.json"),
  date: new Date(),
};

function clean() {
  return del(["dist", "temp"]);
}

function lint() {
  return src("src/assets/scripts/*.js")
    .pipe(
      eslint({
        rules: {
          "my-custom-rule": 1,
          strict: 2,
        },
        globals: ["jQuery", "$"],
        envs: ["browser"],
      })
    )
    .pipe(eslint.format());
}

function style() {
  return src("src/assets/styles/*.scss", { base: "src" })
    .pipe(sass())
    .pipe(dest("temp"))
    .pipe(bs.reload({ stream: true }));
}

function script() {
  return src("src/assets/scripts/*.js", { base: "src" })
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(dest("temp"))
    .pipe(bs.reload({ stream: true }));
}

function page() {
  return src("src/**/*.html")
    .pipe(swig({ data, defaults: { cache: false } }))
    .pipe(dest("temp"))
    .pipe(bs.reload({ stream: true }));
}

function image() {
  return src("src/assets/images/**", { base: "src" })
    .pipe(imagemin())
    .pipe(dest("dist"));
}

function font() {
  return src("src/assets/fonts/**", { base: "src" })
    .pipe(imagemin())
    .pipe(dest("dist"));
}

function extra() {
  return src("public/**", { base: "public" }).pipe(dest("dist"));
}

function useRef() {
  return src("temp/**/*.html", { base: "temp" })
    .pipe(
      useref({
        searchPath: ["dist", "."],
      })
    )
    .pipe(plugins.if(/\.js$/ && production, uglify()))
    .pipe(plugins.if(/\.css$/ && production, cleanCss()))
    .pipe(
      plugins.if(
        /\.html$/ && production,
        htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        })
      )
    )
    .pipe(dest("dist"));
}

function serve() {
  watch("src/assets/styles/*.scss", style);
  watch("src/assets/scripts/*.js", script);
  watch("src/**/*.html", page);

  watch(
    ["src/assets/fonts/**", "src/assets/images/**", "public/**"],
    bs.reload
  );

  bs.init({
    server: {
      baseDir: "dist",
      routes: { "/node_modules": "node_modules" },
    },
  });
}

function mydeploy() {
  return src("./dist/**/*").pipe(ghPages());
}

const compile = parallel(style, script, page);

const develop = series(compile, serve);

const build = series(
  clean,
  parallel(series(compile, useRef), image, font, extra)
);
const deploy = series(compile, mydeploy);
module.exports = {
  clean,
  lint,
  serve,
  start: develop,
  build,
  deploy,
};
