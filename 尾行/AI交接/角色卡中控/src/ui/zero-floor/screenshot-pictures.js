"use strict";
// 截图与角标的公共呈现，供全部教学章节复用。
function createScreenshotPictures({ document, lifecycle, shots }) {
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  let zoom = null;
  function openZoom(id) {
    const shot = shots[id];
    if (!shot) return;
    if (!zoom) {
      zoom = el("dialog", "training-shot-zoom");
      zoom.setAttribute("aria-label", "正式界面原截图");
      const close = el("button", "", "关闭大图 ×");
      close.type = "button";
      zoom.append(close);
      document.body.append(zoom);
      lifecycle.on(close, "click", () => zoom.close());
      lifecycle.cleanup(() => zoom.remove());
    }
    zoom.querySelector(".training-zoom-content")?.remove();
    const wrap = el("div", "training-zoom-content");
    wrap.style.width = Math.round(shot.width * 1.5) + "px";
    wrap.append(picture(id, false, false));
    zoom.append(wrap);
    zoom.showModal();
  }
  function picture(id, descriptions = true, interactive = false) {
    if (shots[id + "-mobile"]) {
      const pair = el("div", "training-shot-pair");
      const desktop = singlePicture(id, descriptions, interactive),
        mobile = singlePicture(id + "-mobile", descriptions, interactive);
      desktop.classList.add("training-shot-desktop");
      mobile.classList.add("training-shot-mobile");
      pair.append(desktop, mobile);
      return pair;
    }
    return singlePicture(id, descriptions, interactive);
  }
  function singlePicture(id, descriptions = true, interactive = false) {
    const data = shots[id],
      holder = el("div", "training-source-picture");
    if (!data) {
      holder.textContent = "截图尚未生成，请运行截图构建。";
      return holder;
    }
    const frame = el("div", "training-shot-frame");
    frame.style.aspectRatio = `${data.width} / ${data.height}`;
    const img = el("img");
    img.src = data.src;
    img.alt = `正式界面截图：${id}`;
    img.width = data.width;
    img.height = data.height;
    frame.append(img);
    const marks = [];
    data.boxes.forEach((box, i) => {
      const mark = el(interactive ? "button" : "span", "training-shot-mark");
      Object.assign(mark.style, {
        left: box.left + "%",
        top: box.top + "%",
        width: box.width + "%",
        height: box.height + "%",
      });
      mark.hidden = !interactive && i !== 0;
      marks.push(mark);
      mark.title = box.title;
      mark.setAttribute("aria-label", box.title + "：" + box.note);
      if (interactive) {
        mark.type = "button";
        mark.dataset.trainingSelect = "scan";
        mark.classList.add("training-capsule-target");
        mark.setAttribute("aria-pressed", "false");
        mark.append(el("strong", "training-click-prompt", "↓ 点这里：打量"));
      }
      frame.append(mark);
    });
    holder.append(frame);
    if (descriptions) {
      const list = el("ol", "training-shot-notes");
      data.boxes.forEach((b, i) => {
        const li = el("li"),
          choice = el("button", "training-shot-choice");
        choice.type = "button";
        choice.setAttribute("aria-pressed", String(i === 0));
        choice.append(
          el("b", "training-shot-number", String(i + 1).padStart(2, "0")),
        );
        const text = el("span", "training-shot-copy");
        text.append(
          el("strong", "", b.title),
          el("span", "training-shot-description", b.note),
        );
        choice.append(text);
        lifecycle.on(choice, "click", () => {
          if (interactive) return;
          marks.forEach((mark, j) => {
            mark.hidden = j !== i;
          });
          list
            .querySelectorAll("button")
            .forEach((button, j) =>
              button.setAttribute("aria-pressed", String(j === i)),
            );
        });
        li.append(choice);
        list.append(li);
      });
      holder.append(
        el("p", "training-shot-instruction", "点击下方说明，查看对应位置"),
        list,
      );
    }
    const enlarge = el("button", "training-shot-enlarge", "放大原截图 ↗");
    enlarge.type = "button";
    lifecycle.on(enlarge, "click", () => openZoom(id));
    if (descriptions) holder.append(enlarge);
    return holder;
  }
  return {
    picture,
    close: () => {
      if (zoom?.open) zoom.close();
    },
  };
}
module.exports = { createScreenshotPictures };
