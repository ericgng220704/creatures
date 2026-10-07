// Renders every creature on the sheet to a PNG in renders/, in a headless browser.
//
//   npm run render                 whole-body shots of every creature
//   npm run render -- --head       also a close-up of each face
//   npm run render -- eagle owl    only these creatures (ids from src/creatures/index.js)
//   npm run render -- --battle     the battle preview instead, in renders/battle/: the default 6 v 6 as it is,
//                                  as silhouettes and with size boxes, then each creature alone at true battle size
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
const battle = args.includes('--battle');
const wanted = args.filter(a => !a.startsWith('--'));
const ids = wanted.length ? ORDER.filter(id => wanted.includes(id)) : ORDER;

mkdirSync('renders', { recursive: true });
const PORT = +process.env.RENDER_PORT || 5199;
const server = await createServer({ server: { port: PORT, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const page = await browser.newPage({ viewport: battle ? { width: 1312, height: 1000 } : { width: 1180, height: 1000 } });
const problems = [];
page.on('pageerror', e => problems.push(e.message));
page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
if (battle) await renderBattle();
else await renderSheet();
await browser.close();
await server.close();
if (problems.length) { console.error('\nProblems:\n' + problems.join('\n')); process.exit(1); }

// the battle preview: frozen at t = 0 so shots compare run to run; the stage is 1280 x 720
async function renderBattle() {
  mkdirSync('renders/battle', { recursive: true });
  const shot = async (name, query) => {
    await page.goto('http://localhost:' + PORT + '/battle.html?still=1&t=0' + query);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
    await (await page.$('#frame')).screenshot({ path: `renders/battle/${name}.png` });
    console.log('rendered battle', name);
  };
  if (!wanted.length) {
    await shot('formation', '');
    await shot('formation-silhouette', '&sil=1');
    await shot('formation-boxes', '&boxes=1');
  }
  const empty = '-,-,-,-,-,-';
  for (const id of ids) {
    await shot(id, `&p=-,${id},-,-,-,-&e=${empty}&boxes=1`);
    await shot(`${id}-silhouette`, `&p=-,${id},-,-,-,-&e=${empty}&sil=1`);
  }
}

async function renderSheet() {
  await page.goto('http://localhost:' + PORT + '/');
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
}
