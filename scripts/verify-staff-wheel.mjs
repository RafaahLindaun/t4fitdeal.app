import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// Use the compiled cascade, including legacy layers, and the same roster/card
// classes as AdminArea. No credentials, student data or backend calls are needed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "dist/assets");
const css = fs.readdirSync(assets).filter((name) => name.endsWith(".css"))
  .sort((a, b) => Number(!a.startsWith("index-")) - Number(!b.startsWith("index-")))
  .map((name) => fs.readFileSync(path.join(assets, name), "utf8")).join("\n");
const cards = Array.from({ length: 36 }, (_, i) => `<button type="button" class="admin-student-card accqua-pressable">
  <span class="admin-student-avatar">AT</span>
  <span class="admin-student-copy">
    <span class="admin-student-card-title"><strong>Aluno de teste ${i + 1}</strong><em class="is-active">Autorizado</em></span>
    <small class="admin-student-meta">Cadastro de teste</small><b class="admin-student-objective">Condicionamento</b>
    <span class="admin-student-flags"><i class="is-linked">Professor de teste</i><i class="is-workout">ABC</i></span>
  </span><svg width="20" height="20" viewBox="0 0 20 20"><path d="m7 4 6 6-6 6"/></svg>
</button>`).join("");
const html = `<!doctype html><html data-accqua-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root">
  <div class="accqua-staff-layout uses-unified-mobile-scroll">
    <aside class="accqua-staff-sidebar"><nav><button>Alunos</button></nav></aside>
    <nav class="accqua-staff-mobile-nav"><button>Alunos</button><button>Aulas</button><button>Loja</button></nav>
    <section class="accqua-staff-content"><div class="accqua-staff-route"><div class="admin-area-screen"><main class="admin-area-shell is-dashboard"><div class="admin-area-content">
      <header class="admin-area-header is-dashboard-header"><button>Voltar</button><strong>Área Accqua Sports</strong></header>
      <div class="admin-dashboard-search-wrap"><input aria-label="Buscar aluno"><div class="admin-area-filters"><button>Todos</button><button>Meus alunos</button></div></div>
      <div class="admin-dashboard-roster-heading"><h2>Todos os alunos</h2></div>
      <div class="admin-area-list admin-dashboard-roster">${cards}</div>
    </div></main></div></div></section>
  </div></div></body></html>`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || (process.platform === "win32" ? "msedge" : undefined), headless: true });
try {
  for (const [width, height] of [[375, 812], [639, 698], [1024, 768], [1280, 800], [1920, 1080]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    await page.setContent(html);
    await page.addStyleTag({ content: css });
    const owner = page.locator(".accqua-staff-content");
    const roster = page.locator(".admin-dashboard-roster");
    const scrollTop = () => owner.evaluate((el) => el.scrollTop);
    for (const selector of [".admin-student-avatar", ".admin-student-card-title strong", ".admin-student-card-title em", ".admin-student-meta", ".admin-student-flags .is-linked", ".admin-student-flags .is-workout", ".admin-student-card > svg"]) {
      await owner.evaluate((el) => { el.scrollTop = 0; });
      const target = page.locator(selector).first();
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      assert.ok(box, `${selector} missing at ${width}px`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      const before = await scrollTop();
      await page.mouse.wheel(0, 130);
      await page.waitForFunction((top) => document.querySelector(".accqua-staff-content").scrollTop > top + 20, before, { timeout: 2000 }).catch(() => { throw new Error(`Wheel trapped over ${selector} at ${width}px (scrollTop=${before})`); });
      const after = await scrollTop();
      await page.mouse.wheel(0, -130);
      await page.waitForFunction((top) => document.querySelector(".accqua-staff-content").scrollTop < top - 20, after, { timeout: 2000 });
    }
    // Cover card padding and the gutter between rows, not just text elements.
    for (const target of ["padding", "row gap"]) {
      await owner.evaluate((el) => { el.scrollTop = 0; });
      const boxes = await page.locator(".admin-student-card").evaluateAll((nodes) => nodes.map((el) => {
        const { x, y, width, height } = el.getBoundingClientRect(); return { x, y, width, height };
      }));
      const first = boxes[0];
      const nextRow = boxes.find((box) => box.y > first.y + first.height);
      assert.ok(nextRow, "Missing second row");
      const x = target === "padding" ? first.x + 6 : first.x + first.width / 2;
      const y = target === "padding" ? first.y + first.height / 2 : (first.y + first.height + nextRow.y) / 2;
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, 130);
      await page.waitForFunction(() => document.querySelector(".accqua-staff-content").scrollTop > 20, null, { timeout: 2000 }).catch(() => { throw new Error(`Wheel trapped over ${target} at ${width}px`); });
      const after = await scrollTop();
      await page.mouse.wheel(0, -130);
      await page.waitForFunction((top) => document.querySelector(".accqua-staff-content").scrollTop < top - 20, after, { timeout: 2000 });
    }
    // Keep the pointer inside the roster while moving through multiple screens.
    await owner.evaluate((el) => { el.scrollTop = 0; });
    const box = await owner.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * .75);
    for (let i = 0; i < 4; i++) {
      const before = await scrollTop();
      await page.mouse.wheel(0, 250);
      await page.waitForFunction((top) => document.querySelector(".accqua-staff-content").scrollTop > top + 20, before, { timeout: 2000 });
    }
    await page.mouse.wheel(0, 100000);
    await page.waitForFunction(() => { const el = document.querySelector(".accqua-staff-content"); return el.scrollTop + el.clientHeight >= el.scrollHeight - 2; });
    const last = await page.locator(".admin-student-card").last().boundingBox();
    assert.ok(last.y + last.height <= height + 1, `Last student inaccessible at ${width}px`);
    assert.equal(await roster.evaluate((el) => el.scrollTop), 0, "Roster became a second scrolling area");
    assert.equal(await page.evaluate(() => document.scrollingElement.scrollTop), 0, "Document scrolled instead of Staff");
    await page.mouse.wheel(0, -100000);
    await page.waitForFunction(() => document.querySelector(".accqua-staff-content").scrollTop === 0);
    console.log(`PASS ${width}x${height}: 7 card targets + padding/gap, both directions, repeated wheel, first/last student.`);
    await page.close();
  }
} finally {
  await browser.close();
}
