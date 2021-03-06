#!/usr/bin/env node

import download from "download-github-repo";
import program from "commander";
import promptly from "promptly";
import fs from "fs";
import nodepath from "path";
import rp from "request-promise-native";

const print = console.log;

let templates;

async function fetchTemplates() {
  if (templates) {
    return;
  }

  try {
    templates = JSON.parse(
      await rp(
        "https://raw.githubusercontent.com/sky0014/startkit-cli/master/templates.json"
      )
    );
  } catch (e) {
    templates = require("../templates.json");
    print(`failed to fetch templates.json: ${e}, use default instead.`);
  }
}

function search(name) {
  for (let template of templates) {
    if (name === template.name) return template;
  }
}

async function doShowList(name) {
  await fetchTemplates();

  if (name) {
    const template = search(name);
    if (template) {
      print(`Found templates:
      \t${template.name}\t${template.description}
    `);
    } else {
      print(`Template ${name} Not Found`);
    }
  } else {
    print("Available templates:\n");
    templates.forEach((template) => {
      print(`\t${template.name}\t${template.description}`);
    });
  }
}

async function doInstall(name, options) {
  await fetchTemplates();

  const template = search(name);
  if (template) {
    print(`Found templates:
      \t${template.name}\t${template.description}
    `);
    print("Downloading...");
    let path = "temp_" + parseInt(Date.now() * Math.random()).toString(16);
    download(template.github, path, (err) => {
      if (err) print(err);
      else {
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
  projectName = await promptly.prompt(`Project Name(${projectName}): `, {
    default: projectName,
  });
  projectDescription = await promptly.prompt(
    `Project Description(${projectDescription}): `,
    { default: projectDescription }
  );
  author = await promptly.prompt(`Author Name(${author}): `, {
    default: author,
  });
  email = await promptly.prompt(`Author Email(${email}): `, {
    default: email,
  });
  github = await promptly.prompt(`Github Repository(${github}): `, {
    default: github,
  });
  let confirm = await promptly.confirm("Are you sure?(yes or no)");
  if (!confirm) {
    doReplace(path);
  } else {
    walkFile(path, (file) => {
      let input = fs.readFileSync(file).toString();
      fs.writeFileSync(
        file,
        input
          .replace(/\${PROJECT_NAME}/g, projectName)
          .replace(/\${PROJECT_DESCRIPTION}/g, projectDescription)
          .replace(/\${AUTHOR}/g, author)
          .replace(/\${EMAIL}/g, email)
          .replace(/\${GITHUB}/g, github)
      );
    });
    //move directory
    let realpath = projectName;
    if (options && options.path) realpath = options.path;
    fs.renameSync(path, realpath);
    print("Install complete");
    process.exit();
  }
}

async function walkFile(path, callback) {
  if (typeof callback !== "function") return;

  if (fs.existsSync(path)) {
    if (fs.statSync(path).isDirectory()) {
      //目录
      fs.readdirSync(path).forEach((p) =>
        walkFile(nodepath.join(path, p), callback)
      );
    } else {
      //文件
      if (callback) callback(path);
    }
  }
}

async function main() {
  //VERSION from package.json with babel-plugin-version-transform
  program.version(VERSION).usage(`<command> [options]`);

  program
    .command("list [name]")
    .description("Show templates")
    .action(doShowList);

  program
    .command("install <name>")
    .alias("i")
    .description("Install template name")
    .option("-p, --path <path>", "Install path")
    .action(doInstall);

  program.parse(process.argv);

  if (process.argv.length <= 2) {
    program.help();
  }
}

main();
