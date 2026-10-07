'use strict';
// A browser harness, not a production SillyTavern/build.js/ship.js run.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');
const slider = require('./timepoint-slider.cjs');

const fixtureRoster = [{ id: 'fixture-flower', name: '测试角色', image: '', relicIcon: '', relicName: '测试纹章' }];
function loadGenerator(filename) {
  const sandbox = {
    module: { exports: {} }, __dirname, require: name => {
      if (name === 'node:fs') return { readFileSync: () => '/* fixture CSS only */' };
      if (name === 'node:path') return path;
      if (name === './flower-roster.cjs') return { FLOWER_ROSTER: fixtureRoster };
      if (name === './timepoint-slider.cjs') return slider;
      throw new Error(`Unexpected require: ${name}`);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, filename), 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}
const generator = loadGenerator('menu-builder.cjs');
const oldGenerator = loadGenerator('menu-builder.original.cjs');
const menu = id => generator.buildMenuHtml({ instanceId: id });
const source = fs.readFileSync(path.join(__dirname, 'timepoint-slider.cjs'), 'utf8');
const results = [];

function check(name, callback) {
  callback();
  results.push({ name, passed: true });
}

check('Eight exact preset dates and one March 3 default', () => {
  assert.equal(slider.POINTS.length, 8);
  assert.equal(slider.DEFAULT_INDEX, 2);
  assert.equal(slider.DEFAULT_VALUE, '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三');
  const oldValues = [...oldGenerator.MENU_HTML.matchAll(/data-xds-fill="custom_timepoint" data-xds-value="([^"]*)"/g)].map(match => match[1]);
  assert.deepEqual(slider.POINTS.map(point => point.value), oldValues);
  slider.POINTS.forEach(point => {
    const value = slider.resolveTimepoint(point.value);
    assert.equal(value.date.year, point.year);
    assert.equal(value.date.month, point.month);
    assert.equal(value.day, point.day);
  });
  assert.equal(slider.resolveTimepoint('').day, 3);
});
check('Opening restoration ignores earlier background dates and rejects ambiguous/missing fields', () => {
  const intro = '【启卷入世 · 自设命途】\n• 来历：仙盟历 1577 年 · 七月初一\n• 当前时点：仙盟历 1579 年 · 六月初七\n• 获取机缘：仙盟历 1578 年 · 三月初三';
  const resolved = slider.resolveFromIntro(intro);
  assert.equal(resolved.ym, 1579.06);
  assert.equal(resolved.day, 7);
  assert.throws(() => slider.resolveFromIntro('正文里提到仙盟历 1577 年 · 七月初一'));
  assert.throws(() => slider.resolveFromIntro(intro + '\n• 当前时点：仙盟历 1580 年 · 一月初一'));
});
check('Custom dates remain exact; invalid/multiple dates never silently default', () => {
  const value = '仙盟历 1579 年 · 六月初七';
  assert.equal(slider.resolveTimepoint(value).value, value);
  assert.equal(slider.resolveTimepoint(value).day, 7);
  assert.equal(slider.describe(value).index, 6);
  for (const invalid of ['仙盟历 1579 年 · 十三月初七', '仙盟历 1579 年 · 六月初零', '仙盟历 1579 年 · 六月三十二', '仙盟历 1579 年 · 六月初二十', '胡乱填写', '仙盟历 1578 年三月初三 / 仙盟历 1579 年六月初七']) {
    assert.equal(slider.parseDate(invalid), null);
    assert.throws(() => slider.resolveTimepoint(invalid));
  }
  for (const [text, day] of [['六月廿一', 21], ['六月二十', 20], ['六月卅', 30], ['6月7日', 7], ['十二月初十', 10]]) {
    assert.equal(slider.resolveTimepoint(`仙盟历 1579 年 ${text}`).day, day);
  }
  assert.equal(slider.describe('仙盟历 1576 年 一月初一').index, 0);
  assert.equal(slider.describe('仙盟历 1581 年 一月初一').index, 7);
});
check('Generated HTML has no script/inline handlers; range has no submit name', () => {
  const html = menu('fixture-one');
  assert.ok(!/<script\b|\bon(?:input|change|click)\s*=/i.test(html));
  assert.equal((html.match(/name="custom_timepoint"/g) || []).length, 1);
  assert.ok(html.includes('data-xds-timepoint-enhancer hidden'));
  assert.ok(!/data-xds-timepoint-fallback hidden/.test(html));
});

async function run() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const exceptions = [];
    page.on('pageerror', error => exceptions.push(error.message));
    await page.setContent(menu('fixture-one'));
    await page.addScriptTag({ content: source });

    async function test(name, callback) {
      await callback();
      results.push({ name, passed: true });
      console.log(`PASS ${name}`);
    }

    await test('Before JS initialization: old chips visible, enhancer hidden', async () => {
      assert.deepEqual(await page.evaluate(() => {
        const box = document.querySelector('[data-xds-timepoint-box]');
        return [getComputedStyle(box.querySelector('[data-xds-timepoint-enhancer]')).display,
          getComputedStyle(box.querySelector('[data-xds-timepoint-fallback]')).display === 'none'];
      }), ['none', false]);
    });

    await page.evaluate(() => {
      window.writeCount = 0;
      window.enhanceErrors = [];
      window.writeField = (input, value) => {
        window.writeCount += 1;
        const view = input.ownerDocument.defaultView;
        Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new view.Event('input', { bubbles: true }));
      };
      window.mountSlider = ownerWindow => {
        window.sliderHandle = xdsTimepointModule().install({
          host: window, ownerWindow: ownerWindow || window, setValue: window.writeField,
          onError: error => window.enhanceErrors.push(error.message),
        });
      };
      window.mountSlider();
    });

    await test('Startup enhances before any HUD exists and never fills/commits an empty field', async () => {
      const state = await page.evaluate(() => {
        const box = document.querySelector('[data-xds-timepoint-box]');
        return [box.querySelector('[data-xds-field]').value, box.querySelector('[data-xds-timepoint-range]').value,
          box.querySelector('[data-xds-timepoint-fallback]').hidden, window.writeCount,
          box.querySelector('[data-xds-timepoint-range]').getBoundingClientRect().height];
      });
      assert.deepEqual(state.slice(0, 4), ['', '2', true, 0]);
      assert.ok(state[4] >= 44);
    });

    await test('Every preset writes its exact value once; input followed by change is deduplicated', async () => {
      for (let index = 0; index < 8; index += 1) {
        const value = await page.evaluate(index => {
          const range = document.querySelector('[data-xds-timepoint-range]');
          range.value = String(index);
          range.dispatchEvent(new Event('input', { bubbles: true }));
          range.dispatchEvent(new Event('change', { bubbles: true }));
          return document.querySelector('[data-xds-field="custom_timepoint"]').value;
        }, index);
        assert.equal(value, slider.POINTS[index].value);
      }
      assert.equal(await page.evaluate(() => window.writeCount), 8);
    });

    await test('Manual June 7 remains June 7; a parked thumb has an explicit apply button', async () => {
      assert.deepEqual(await page.evaluate(() => {
        const input = document.querySelector('[data-xds-field="custom_timepoint"]');
        input.value = '仙盟历 1579 年 · 六月初七';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const box = input.closest('[data-xds-timepoint-box]');
        return [input.value, box.querySelector('[data-xds-timepoint-range]').value,
          box.querySelector('[data-xds-timepoint-apply]').hidden, window.writeCount];
      }), ['仙盟历 1579 年 · 六月初七', '6', false, 8]);
      const selected = await page.evaluate(() => {
        document.querySelector('[data-xds-timepoint-apply]').click();
        return document.querySelector('[data-xds-field="custom_timepoint"]').value;
      });
      assert.equal(selected, slider.POINTS[6].value);
    });

    await test('Out-of-range/invalid custom text remains untouched and visibly marked', async () => {
      for (const [value, position, mode] of [['仙盟历 1576 年 一月初一', '0', 'custom'], ['仙盟历 1581 年 一月初一', '7', 'custom'], ['尚未定好', '2', 'invalid']]) {
        assert.deepEqual(await page.evaluate(value => {
          const input = document.querySelector('[data-xds-field="custom_timepoint"]');
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const box = input.closest('[data-xds-timepoint-box]');
          return [input.value, box.querySelector('[data-xds-timepoint-range]').value, box.getAttribute('data-xds-timepoint-mode')];
        }, value), [value, position, mode]);
      }
    });

    await test('Dynamically rendered second menu initializes and changes only its own field', async () => {
      await page.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), menu('fixture-two'));
      await page.waitForFunction(() => document.querySelectorAll('[data-xds-timepoint-ready="true"]').length === 2);
      assert.deepEqual(await page.evaluate(() => {
        const roots = document.querySelectorAll('[data-xds-menu]');
        const range = roots[1].querySelector('[data-xds-timepoint-range]');
        range.value = '3';
        range.dispatchEvent(new Event('input', { bubbles: true }));
        return [...roots].map(root => root.querySelector('[data-xds-field="custom_timepoint"]').value);
      }), ['尚未定好', slider.POINTS[3].value]);
    });

    await test('Reinstallation/re-rendering leaves one effective handler; existing custom text survives', async () => {
      const state = await page.evaluate(() => {
        const input = document.querySelector('[data-xds-field="custom_timepoint"]');
        input.value = '仙盟历 1579 年 · 六月初七';
        window.mountSlider();
        window.mountSlider();
        return [input.value, document.querySelector('[data-xds-timepoint-range]').value];
      });
      assert.deepEqual(state, ['仙盟历 1579 年 · 六月初七', '6']);
      await page.evaluate(html => document.querySelector('[data-xds-menu]').outerHTML = html, menu('fixture-one'));
      await page.waitForFunction(() => document.querySelectorAll('[data-xds-timepoint-ready="true"]').length === 2);
      assert.equal(await page.evaluate(() => {
        const before = window.writeCount;
        const range = document.querySelector('[data-xds-timepoint-range]');
        range.value = '4';
        range.dispatchEvent(new Event('input', { bubbles: true }));
        return window.writeCount - before;
      }), 1);
    });

    await test('Replacing inner output controls reinitializes their bindings', async () => {
      await page.evaluate(() => {
        const output = document.querySelector('[data-xds-timepoint-out]');
        output.outerHTML = '<output data-xds-timepoint-out>replacement</output>';
      });
      await page.waitForFunction(() => document.querySelector('[data-xds-timepoint-out]').textContent.includes('天溪兽潮'));
    });

    await test('Native ArrowRight keyboard changes exactly one preset', async () => {
      const range = page.locator('[data-xds-timepoint-range]').first();
      await range.focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('[data-xds-field="custom_timepoint"]').first().inputValue(), slider.POINTS[5].value);
    });

    await test('Iframe-owned listener uses the chat host document and cleans up on owner pagehide', async () => {
      await page.evaluate(source => {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        window.ownerFrame = frame;
        frame.contentWindow.eval(source);
        window.sliderHandle = frame.contentWindow.xdsTimepointModule().install({
          host: window, ownerWindow: frame.contentWindow, setValue: window.writeField,
          onError: error => window.enhanceErrors.push(error.message),
        });
      }, source);
      assert.equal(await page.evaluate(() => {
        const range = document.querySelector('[data-xds-timepoint-range]');
        range.value = '7';
        range.dispatchEvent(new Event('input', { bubbles: true }));
        return document.querySelector('[data-xds-field="custom_timepoint"]').value;
      }), slider.POINTS[7].value);
      await page.evaluate(() => window.ownerFrame.contentWindow.dispatchEvent(new window.ownerFrame.contentWindow.Event('pagehide')));
      assert.deepEqual(await page.evaluate(() => {
        const box = document.querySelector('[data-xds-timepoint-box]');
        return [box.querySelector('[data-xds-timepoint-enhancer]').hidden, box.querySelector('[data-xds-timepoint-fallback]').hidden];
      }), [true, false]);
    });

    await test('Old menus without enhancer remain unchanged', async () => {
      await page.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), oldGenerator.buildMenuHtml({ instanceId: 'old-fixture' }));
      await page.evaluate(() => window.mountSlider());
      assert.equal(await page.evaluate(() => document.querySelectorAll('[data-xds-timepoint-ready="true"]').length), 2);
      assert.equal(await page.locator('#old-fixture-custom_timepoint').inputValue(), '');
    });

    await test('Malformed enhancer retains the existing chips', async () => {
      await page.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), menu('broken-fixture').replace('data-xds-timepoint-range aria-label', 'data-broken-range aria-label'));
      await page.waitForFunction(() => window.enhanceErrors.length > 0);
      assert.equal(await page.evaluate(() => document.querySelector('#broken-fixture-custom_timepoint').closest('[data-xds-timepoint-box]').querySelector('[data-xds-timepoint-fallback]').hidden), false);
    });

    await test('A setter failure degrades enhancement and preserves a working old entry', async () => {
      await page.evaluate(() => {
        window.sliderHandle = xdsTimepointModule().install({ host: window, setValue: () => { throw new Error('fixture setter failure'); }, onError: () => {} });
        const range = document.querySelector('[data-xds-timepoint-range]');
        range.value = '0';
        range.dispatchEvent(new Event('input', { bubbles: true }));
      });
      assert.deepEqual(await page.evaluate(() => {
        const box = document.querySelector('[data-xds-timepoint-box]');
        return [box.querySelector('[data-xds-timepoint-enhancer]').hidden, box.querySelector('[data-xds-timepoint-fallback]').hidden];
      }), [true, false]);
      await page.evaluate(() => {
        window.sliderHandle.dispose();
        // Fixture for the *existing* data-xds-fill handler; not its actual source.
        document.addEventListener('click', event => {
          const button = event.target.closest('[data-xds-fill]');
          if (!button) return;
          const input = button.closest('[data-xds-menu]').querySelector('[data-xds-field="' + button.getAttribute('data-xds-fill') + '"]');
          window.writeField(input, button.getAttribute('data-xds-value'));
        });
        document.querySelector('[data-xds-timepoint-fallback] [data-xds-value]').click();
      });
      assert.equal(await page.locator('[data-xds-field="custom_timepoint"]').first().inputValue(), slider.POINTS[0].value);
    });

    assert.deepEqual(exceptions, []);
    fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify({
      browser: await browser.version(),
      scope: 'Chromium harness; roster/CSS/old fill handler are fixtures. No live SillyTavern, production submit or card build tested.',
      results,
    }, null, 2) + '\n');
    console.log(`${results.length} checks passed; see verification.json`);
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
