#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

const inquirer = require("inquirer");
const ejs = require("ejs");

//设置问题
inquirer
  .prompt([
    {
      type: "input",
      message: "Please enter the project name",
      name: "pname",
      default: "Lee p",
    },
    {
      type: "confirm",
      message: "need Css?",
      name: "needCSS",
    },
  ])
  .then(
    (data) => {
      const { pname, needCSS } = data;
      const tmpPath = path.join(__dirname, "template");
      const distPath = process.cwd();

      fs.readdir(tmpPath, (err, files) => {
        if (err) throw err;
        files.forEach((file) => {
          if (file.includes(".css") && !needCSS) {
            return;
          }
          ejs.renderFile(path.join(tmpPath, file), data, (err, result) => {
            fs.writeFileSync(path.join(distPath, file), result);
          });
        });
      });
    },
    (err) => {
      console.error(err);
    }
  );
