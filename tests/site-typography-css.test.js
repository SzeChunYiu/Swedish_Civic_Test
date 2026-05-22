const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const siteRoot = path.join(__dirname, '..', 'site');
const stylesPath = path.join(siteRoot, 'styles.css');

function siteCssFiles() {
  return fs
    .readdirSync(siteRoot)
    .filter((fileName) => fileName.endsWith('.css'))
    .map((fileName) => path.join(siteRoot, fileName));
}

test('static site CSS uses nonnegative letter spacing', () => {
  const offenders = [];

  for (const cssPath of siteCssFiles()) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const fileName = path.relative(path.join(__dirname, '..'), cssPath);

    for (const match of css.matchAll(/letter-spacing\s*:\s*(-[^;]+);/g)) {
      offenders.push(`${fileName}: ${match[0]}`);
    }
  }

  assert.deepEqual(offenders, []);
});

test('static typography keeps deliberate nonnegative label tracking', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /letter-spacing:\s*0;/);
  assert.match(css, /\.hero h1\s*{[\s\S]*letter-spacing:\s*0;/);
  assert.match(css, /\.practice__title\s*{[\s\S]*letter-spacing:\s*0;/);
  assert.match(css, /\.quiz__q\s*{[\s\S]*letter-spacing:\s*0;/);
  assert.match(css, /\.doc h1\s*{[\s\S]*letter-spacing:\s*0;/);
  assert.match(css, /\.ebook__h1\s*{[\s\S]*letter-spacing:\s*0;/);
  assert.match(css, /letter-spacing:\s*0\.14em;/);
  assert.match(css, /letter-spacing:\s*0\.12em;/);
  assert.doesNotMatch(css, /letter-spacing:\s*-\d/);
});
