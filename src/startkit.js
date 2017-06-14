#!/usr/bin/env node

import download from "download-github-repo";
import program from "commander";
import promptly from "promptly";
import fs from "fs";
import nodepath from "path";

import templates from "./templates";

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
    let path = template.name;
    if (options && options.path) path = options.path;
    download(template.github, path, err => {
      if (err) print(err);
      else {
        print("Download complete");
        doReplace(path);
      }
    });
  } else {
    print(`Not Found ${name}`);
  }
}

async function doReplace(path) {
  print("Installing...");
  let projectName = "your project name";
  let projectDescription = "your project description";
  let author = "your name";
  projectName = await promptly.prompt(`Project Name(${projectName}): `, {
    default: projectName
  });
  projectDescription = await promptly.prompt(
    `Project Description(${projectDescription}): `,
    { default: projectDescription }
  );
  author = await promptly.prompt(`Author Name(${author}): `, {
    default: author
  });
  let confirm = await promptly.confirm("Are you sure?(yes or no)");
  if (!confirm) {
    doReplace(path);
  } else {
    walkFile(path, file => {
      let input = fs.readFileSync(file).toString();
      fs.writeFileSync(
        file,
        input
          .replace(/\${PROJECT_NAME}/g, projectName)
          .replace(/\${PROJECT_DESCRIPTION}/g, projectDescription)
          .replace(/\${AUTHOR}/g, author)
      );
    });
    print("Install complete");
  }
}

async function walkFile(path, callback) {
  if (typeof callback !== "function") return;

  if (fs.existsSync(path)) {
    if (fs.statSync(path).isDirectory()) {
      //目录
      fs
        .readdirSync(path)
        .forEach(p => walkFile(nodepath.join(path, p), callback));
    } else {
      //文件
      if (callback) callback(path);
    }
  }
}

//VERSION from package.json with babel-plugin-version-transform
program.version(VERSION).usage(`<command> [options]`);

program.command("list [name]").description("Show templates").action(doShowList);

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
