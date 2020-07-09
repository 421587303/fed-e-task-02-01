// 实现这个项目的构建任务
const sass = require("sass");
const fs = require("fs");
const useref = require("useref");
const loadGruntTasks = require("load-grunt-tasks");
const browserSync = require("browser-sync");
const bs = browserSync.create();

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
module.exports = (grunt) => {
  grunt.initConfig({
    clean: ["dist/**"],

    sass: {
      options: {
        sourceMap: true,
        implementation: sass,
      },
      main: {
        files: {
          "dist/assets/styles/main.css": "src/assets/styles/main.scss",
        },
      },
    },

    babel: {
      options: {
        presets: ["@babel/preset-env"],
        sourceMap: true,
      },
      main: {
        files: {
          "dist/assets/scripts/main.js": "src/assets/scripts/main.js",
        },
      },
    },
    web_swig: {
      options: {
        swigOptions: {
          cache: false,
        },
        getData: function (tpl) {
          return data;
        },
      },
      main: {
        expand: true,
        cwd: "src/",
        src: "**/*.html",
        dest: "dist/",
      },
    },

    uglify: {
      production: {
        files: [
          {
            expand: true,
            cwd: "dist/",
            src: ["assets/scripts/*.js"],
            dest: "dist/",
          },
        ],
      },
      dev: {},
    },
    cssmin: {
      production: {
        files: [
          {
            expand: true,
            cwd: "dist/",
            src: ["assets/styles/*.css"],
            dest: "dist/",
          },
        ],
      },
      dev: {},
    },
    htmlmin: {
      production: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
        },
        files: [
          {
            expand: true,
            cwd: "dist/",
            src: ["**/*.html"],
            dest: "dist/",
          },
        ],
      },
      dev: {},
    },
    image: {
      production: {
        options: {
          optipng: false,
          pngquant: true,
          zopflipng: true,
          jpegRecompress: false,
          mozjpeg: true,
          gifsicle: true,
          svgo: true,
        },
        files: [
          {
            expand: true,
            cwd: "dist/",
            src: ["assets/fonts/*", "assets/images/*"],
            dest: "dist/",
          },
        ],
      },
      dev: {},
    },
    eslint: {
      options: {
        rulePaths: ["src/assets/scripts/"],
      },
      target: ["src/assets/scripts/main.js"],
    },
    sasslint: {
      main: {
        options: {
          configFile: "config/.sass-lint.yml",
          rulePaths: ["src/assets/scripts/"],
        },
        target: ["src/assets/styles/main.scss"],
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: "public/",
            src: ["**"],
            dest: "dist/",
          },
          {
            expand: true,
            cwd: "src",
            src: ["assets/fonts/*"],
            dest: "dist/",
          },
          {
            expand: true,
            cwd: "src",
            src: ["assets/images/*"],
            dest: "dist/",
          },
        ],
      },
    },
    watch: {
      js: {
        files: ["src/js/*.js"],
        tasks: ["babel", "bs-reload"],
      },
      css: {
        files: ["src/scss/*.scss"],
        tasks: ["sass", "bs-reload"],
      },
      html: {
        files: ["src/**/*.html"],
        tasks: ["web_swig", "bs-reload"],
      },
    },

    ghDeploy: {
      options: {
        repository: "https://github.com/421587303/pages-boilerplate-grunt.git",
        deployPath: "dist",
      },
    },
  });

  grunt.registerTask("jal-useref", function () {
    const done = this.async();
    const cwd = "dist/";
    const htmls = ["index.html", "about.html"];
    htmls.forEach((html, index) => {
      const inputHtml = fs.readFileSync(cwd + html, "utf8");
      const [code, result] = useref(inputHtml);
      for (let type in result) {
        const dests = Object.keys(result[type]);
        dests.forEach((dest) => {
          const src = result[type][dest].assets;
          let read;
          const files = src.map((file) => {
            read = cwd + file;
            if (file[0] === "/") {
              read = file.substr(1);
            }
            return fs.readFileSync(read);
          });
          fs.writeFile(cwd + dest, files.join(""), (err) => {
            if (err) {
              return console.error(err);
            }
          });
        });
      }
      fs.writeFile(cwd + html, code, (err) => {
        if (err) {
          return console.error(err);
        }
        if (index === htmls.length - 1) {
          done();
        }
      });
    });
  });
  grunt.registerTask("bs", function () {
    const done = this.async();
    bs.init(
      {
        notify: false,
        port: grunt.option("port") || 2080,
        open: grunt.option("open"),
        server: {
          baseDir: ["dist", "src", "public"],
          routes: {
            "/node_modules": "node_modules",
          },
        },
      },
      function (err, bs) {
        done();
      }
    );
  });
  grunt.registerTask("bs-reload", function () {
    bs.reload();
  });

  const mode =
    grunt.option("production") || grunt.option("prod")
      ? "production"
      : "development";

  loadGruntTasks(grunt);

  grunt.registerTask("lint", ["sasslint", "eslint"]);

  grunt.registerTask("compile", ["sass", "babel", "web_swig"]);

  grunt.registerTask("serve", ["compile", "bs", "watch"]);

  grunt.registerTask("build", [
    "clean",
    "compile",
    "copy",
    "jal-useref",
    `mini:${mode}`,
  ]);

  grunt.registerTask("start", [
    "clean",
    "compile",
    "copy",
    "jal-useref",
    "bs",
    "watch",
  ]);

  grunt.registerTask("deploy", [
    "clean",
    "compile",
    "copy",
    "jal-useref",
    "ghDeploy",
  ]);
};
