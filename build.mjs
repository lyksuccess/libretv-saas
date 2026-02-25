import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// 需要拷贝到 dist 的目录/文件
const INCLUDE_DIRS = [
  "css",
  "js",
  "libs",
  "image",
  ".well-known",
];

const INCLUDE_FILES = [
  "index.html",
  "watch.html",
  "player.html",
  "manifest.json",
  "robots.txt",
  "about.html",
];

const EXCLUDE = new Set([
  "node_modules",
  ".git",
  ".github",
  "dist",
]);

function emptyDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.lstatSync(full);
    if (stat.isDirectory()) {
      emptyDir(full);
      fs.rmdirSync(full);
    } else {
      fs.unlinkSync(full);
    }
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.lstatSync(src);
  if (stat.isDirectory()) {
    if (EXCLUDE.has(path.basename(src))) return;
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// 清空 dist
emptyDir(DIST);
ensureDir(DIST);

// 拷贝目录
for (const dir of INCLUDE_DIRS) {
  const srcDir = path.join(ROOT, dir);
  const destDir = path.join(DIST, dir);
  copyRecursive(srcDir, destDir);
}

// 拷贝单文件
for (const file of INCLUDE_FILES) {
  const srcFile = path.join(ROOT, file);
  if (fs.existsSync(srcFile)) {
    const destFile = path.join(DIST, file);
    copyRecursive(srcFile, destFile);
  }
}

console.log("Build completed. Output in ./dist");

