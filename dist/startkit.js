#!/usr/bin/env node
"use strict";

var _downloadGithubRepo = require("download-github-repo");

var _downloadGithubRepo2 = _interopRequireDefault(_downloadGithubRepo);

var _commander = require("commander");

var _commander2 = _interopRequireDefault(_commander);

var _promptly = require("promptly");

var _promptly2 = _interopRequireDefault(_promptly);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _requestPromiseNative = require("request-promise-native");

var _requestPromiseNative2 = _interopRequireDefault(_requestPromiseNative);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const print = console.log;

function search(name) {
  for (let template of templates) {
    if (name === template.name) return template;
  }
}

function doShowList(name) {
  if (name) {
    const template = search(name);
    if (template) {
      print(`Found templates:
      \t${template.name}\t${template.description}
    `);
    } else {
      print(`Not Found ${name}`);
    }
  } else {
    print("Available templates:\n");
    templates.forEach(template => {
      print(`\t${template.name}\t${template.description}`);
    });
  }
}

function doInstall(name, options) {
  const template = search(name);
  if (template) {
    print(`Found templates:
      \t${template.name}\t${template.description}
    `);
    print("Downloading...");
    let path = "temp_" + parseInt(Date.now() * Math.random()).toString(16);
    (0, _downloadGithubRepo2.default)(template.github, path, err => {
      if (err) print(err);else {
        print("Download complete");
        doReplace(path, options);
      }
    });
  } else {
    print(`Not Found ${name}`);
  }
}

async function doReplace(path, options) {
  print("Installing...");
  let projectName = "your project name";
  let projectDescription = "your project description";
  let author = "your name";
  let email = "your email";
  let github = "your github repository";
  projectName = await _promptly2.default.prompt(`Project Name(${projectName}): `, {
    default: projectName
  });
  projectDescription = await _promptly2.default.prompt(`Project Description(${projectDescription}): `, { default: projectDescription });
  author = await _promptly2.default.prompt(`Author Name(${author}): `, {
    default: author
  });
  email = await _promptly2.default.prompt(`Author Email(${email}): `, {
    default: email
  });
  github = await _promptly2.default.prompt(`Github Repository(${github}): `, {
    default: github
  });
  let confirm = await _promptly2.default.confirm("Are you sure?(yes or no)");
  if (!confirm) {
    doReplace(path);
  } else {
    walkFile(path, file => {
      let input = _fs2.default.readFileSync(file).toString();
      _fs2.default.writeFileSync(file, input.replace(/\${PROJECT_NAME}/g, projectName).replace(/\${PROJECT_DESCRIPTION}/g, projectDescription).replace(/\${AUTHOR}/g, author).replace(/\${EMAIL}/g, email).replace(/\${GITHUB}/g, github));
    });
    //move directory
    let realpath = projectName;
    if (options && options.path) realpath = options.path;
    _fs2.default.renameSync(path, realpath);
    print("Install complete");
    process.exit();
  }
}

async function walkFile(path, callback) {
  if (typeof callback !== "function") return;

  if (_fs2.default.existsSync(path)) {
    if (_fs2.default.statSync(path).isDirectory()) {
      //目录
      _fs2.default.readdirSync(path).forEach(p => walkFile(_path2.default.join(path, p), callback));
    } else {
      //文件
      if (callback) callback(path);
    }
  }
}

let templates = require("../templates.json");

async function main() {
  try {
    templates = JSON.parse((await (0, _requestPromiseNative2.default)("https://raw.githubusercontent.com/sky0014/startkit-cli/master/templates.json")));
  } catch (e) {
    print(`failed to fetch templates.json, use default instead. ${e}`);
  }

  //VERSION from package.json with babel-plugin-version-transform
  _commander2.default.version("1.0.9").usage(`<command> [options]`);

  _commander2.default.command("list [name]").description("Show templates").action(doShowList);

  _commander2.default.command("install <name>").alias("i").description("Install template name").option("-p, --path <path>", "Install path").action(doInstall);

  _commander2.default.parse(process.argv);

  if (process.argv.length <= 2) {
    _commander2.default.help();
  }
}

main();