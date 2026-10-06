// Renders every creature on the sheet to a PNG in renders/, in a headless browser.
//
//   npm run render                 whole-body shots of every creature
//   npm run render -- --head       also a close-up of each face
//   npm run render -- eagle owl    only these creatures (ids from src/creatures/index.js)
//
// A browser is needed: `npx playwright install chromium`, or point CHROMIUM_PATH at one you have.
// WebGL runs on the software renderer (SwiftShader), so no GPU is needed, but it is slow.
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

// the registry draws on a canvas when it loads, so read the ids from its text instead of importing it
const ORDER = [...readFileSync('src/creatures/index.js', 'utf8').match(/export const ORDER = \[(.*?)\]/s)[1].matchAll(/'(\w+)'/g)].map(m => m[1]);

const args = process.argv.slice(2);
const heads = args.includes('--head');
const wanted = args.filter(a => !a.startsWith('--'));
const ids = wanted.length ? ORDER.filter(id => wanted.includes(id)) : ORDER;

mkdirSync('renders', { recursive: true });
const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
const problems = [];
page.on('pageerror', e => problems.push(e.message));
page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
await page.goto('http://localhost:5199/');
const cards = await page.$$('.card');
for (const id of ids) {
  const card = cards[ORDER.indexOf(id)];
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);               // the creature is built when its card nears the screen
  await card.screenshot({ path: `renders/${id}.png` });
  if (heads) {
    await (await card.$('[data-a="head"]')).click();
    await page.waitForTimeout(700);
    await card.screenshot({ path: `renders/${id}-head.png` });
    await (await card.$('[data-a="body"]')).click();
  }
  console.log('rendered', id);
}
await browser.close();
await server.close();
if (problems.length) { console.error('\nProblems:\n' + problems.join('\n')); process.exit(1); }
