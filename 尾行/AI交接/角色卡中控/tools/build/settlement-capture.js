"use strict";
// 截图只观察真实判定UI；不跳动画、不伪造筹码，不修改游戏数值。
async function waitForSettlement(b, action, { timeoutMs = 20000 } = {}) {
  const expectedChips =
    (action.attr ? 1 : 0) +
    (action.mods || []).length +
    (action.targetMod || action.darkReveal ? 1 : 0);
  const expected = {
    d20: action.d20,
    dc: action.dc,
    total: action.total,
    chips: expectedChips,
  };
  const deadline = Date.now() + timeoutMs;
  let state;
  do {
    state = await b.evaluate(
      `(()=>{const d=document.getElementById('wx-settle-dialog'),hud=document.getElementById('settleHudStatus')?.textContent||'',math=document.getElementById('settleMathLine')?.textContent||'',chips=[...document.querySelectorAll('#settleModsStack .chip-item')].map(e=>e.textContent),ledger=[...document.querySelectorAll('#settleLedgerWrap .ledger-row')].map(e=>e.textContent);return{open:!!d?.open,hud,math,chips,ledger}})()`,
    );
    if (
      state.open &&
      state.hud.includes(
        `RESULT LOCKED: [ ${expected.d20} ] · CHECK FINISHED`,
      ) &&
      state.chips.length === expected.chips &&
      state.math.includes(`DC ${expected.dc}`) &&
      state.math.includes(String(expected.total)) &&
      state.ledger.length &&
      !state.ledger.some((t) => t.includes("等待定格"))
    ) {
      // 账目行与过渡动画均完成后再次核实，禁止沿用上一组的锁定文字。
      await b.delay(700);
      const current = await b.evaluate(
        "({hud:document.getElementById('settleHudStatus').textContent,chips:document.querySelectorAll('#settleModsStack .chip-item').length,ledger:[...document.querySelectorAll('#settleLedgerWrap .ledger-row')].map(e=>e.textContent)})",
      );
      if (
        current.hud === state.hud &&
        current.chips === expected.chips &&
        !current.ledger.some((t) => t.includes("等待定格"))
      )
        return {
          complete: true,
          d20: expected.d20,
          dc: expected.dc,
          total: expected.total,
          chips: state.chips,
          ledger: current.ledger,
        };
    }
    await b.delay(100);
  } while (Date.now() < deadline);
  throw Error(
    `判定截图未完成，禁止保存：${JSON.stringify({ expected, state })}`,
  );
}
async function closeSettlement(b) {
  await b.evaluate(
    "new Promise(resolve=>{const d=document.getElementById('wx-settle-dialog');if(!d?.open){requestAnimationFrame(()=>resolve(true));return;}d.addEventListener('close',()=>requestAnimationFrame(()=>resolve(true)),{once:true});d.close();})",
  );
}
module.exports = { waitForSettlement, closeSettlement };
