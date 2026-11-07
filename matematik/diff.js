// Fælles hjælpere til alle sider: tegn grafer i SVG, træk i punkter, små quizzer.
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
  }
  if (parent) parent.appendChild(e);
  return e;
}
const fmt = (n, d = 1) => {
  const r = Math.round(n * 10 ** d) / 10 ** d;
  return (Object.is(r, -0) ? 0 : r).toLocaleString('da-DK', { maximumFractionDigits: d });
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const slopeOf = (f, x, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
const signClass = (m, eps = 0.06) => (m > eps ? 'up' : m < -eps ? 'down' : 'flat');
const signColor = (m, eps) => `var(--${signClass(m, eps)})`;
const signText = (m, eps) => ({ up: 'cu', down: 'cd', flat: 'cl' })[signClass(m, eps)];

class Plot {
  constructor(svg, o) {
    Object.assign(this, { pad: 30, grid: 1, xlabel: '', ylabel: '', axes: true }, o);
    this.svg = svg;
    svg.setAttribute('viewBox', `0 0 ${this.w} ${this.h}`);
    this.bg = el('g', {}, svg);
    this.top = el('g', {}, svg);
    if (this.grid) this.drawGrid();
  }
  sx(x) { return this.pad + (x - this.x0) / (this.x1 - this.x0) * (this.w - 2 * this.pad); }
  sy(y) { return this.h - this.pad - (y - this.y0) / (this.y1 - this.y0) * (this.h - 2 * this.pad); }
  ix(px) { return this.x0 + (px - this.pad) / (this.w - 2 * this.pad) * (this.x1 - this.x0); }
  drawGrid() {
    const g = el('g', {}, this.bg);
    const step = this.grid;
    for (let x = Math.ceil(this.x0 / step) * step; x <= this.x1 + 1e-9; x += step)
      el('line', { x1: this.sx(x), x2: this.sx(x), y1: this.sy(this.y0), y2: this.sy(this.y1), class: 'g-grid' }, g);
    for (let y = Math.ceil(this.y0 / step) * step; y <= this.y1 + 1e-9; y += step)
      el('line', { x1: this.sx(this.x0), x2: this.sx(this.x1), y1: this.sy(y), y2: this.sy(y), class: 'g-grid' }, g);
    if (this.axes) {
      const ay = clamp(0, this.y0, this.y1), ax = clamp(0, this.x0, this.x1);
      el('line', { x1: this.sx(this.x0), x2: this.sx(this.x1), y1: this.sy(ay), y2: this.sy(ay), class: 'g-axis' }, g);
      el('line', { x1: this.sx(ax), x2: this.sx(ax), y1: this.sy(this.y0), y2: this.sy(this.y1), class: 'g-axis' }, g);
      if (this.xlabel) el('text', { x: this.sx(this.x1) - 4, y: this.sy(ay) - 8, 'text-anchor': 'end', class: 'g-ax-label', text: this.xlabel }, g);
      if (this.ylabel) el('text', { x: this.sx(ax) + 8, y: this.sy(this.y1) + 14, class: 'g-ax-label', text: this.ylabel }, g);
    }
  }
  pathD(f, a = this.x0, b = this.x1, n = 220) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n;
      d += (i ? 'L' : 'M') + this.sx(x).toFixed(1) + ' ' + this.sy(f(x)).toFixed(1);
    }
    return d;
  }
  curve(f, cls = 'g-f', a, b, parent = this.bg) { return el('path', { d: this.pathD(f, a, b), class: cls }, parent); }
  // linje gennem (x, y) med hældning m, fra x-a til x+a
  lineAt(line, x, y, m, a = 1.6) {
    line.setAttribute('x1', this.sx(x - a)); line.setAttribute('y1', this.sy(y - m * a));
    line.setAttribute('x2', this.sx(x + a)); line.setAttribute('y2', this.sy(y + m * a));
  }
  place(c, x, y) { c.setAttribute('cx', this.sx(x)); c.setAttribute('cy', this.sy(y)); }
  // gør et element trækbart vandret; cb får matematisk x
  drag(target, cb) {
    const toX = (ev) => {
      const pt = this.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      return this.ix(pt.matrixTransform(this.svg.getScreenCTM().inverse()).x);
    };
    let on = false;
    target.addEventListener('pointerdown', (e) => { on = true; target.setPointerCapture?.(e.pointerId); cb(toX(e)); e.preventDefault(); });
    target.addEventListener('pointermove', (e) => { if (on) cb(toX(e)); });
    const off = () => { on = false; };
    target.addEventListener('pointerup', off); target.addEventListener('pointercancel', off);
    // ældre Safari: stop siden i at rulle, mens man trækker
    target.addEventListener('touchmove', (e) => { if (on) e.preventDefault(); }, { passive: false });
  }
}

// Quiz: <div class="quiz" data-quiz='[{"q":"..","o":["a","b"],"a":0,"why":".."}]'>
function initQuiz() {
  document.querySelectorAll('.quiz[data-quiz]').forEach((box) => {
    JSON.parse(box.dataset.quiz).forEach((item, qi) => {
      const q = document.createElement('div'); q.className = 'q';
      q.innerHTML = `<h3>${item.q}</h3><div class="opts"></div><p class="fb" aria-live="polite"></p>`;
      const opts = q.querySelector('.opts'), fb = q.querySelector('.fb');
      item.o.forEach((txt, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.innerHTML = txt; b.id = `q${qi}o${i}`;
        b.onclick = () => {
          opts.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
          const ok = i === item.a;
          fb.className = 'fb ' + (ok ? 'ok' : 'no');
          fb.innerHTML = (ok ? 'Rigtigt! ' : 'Ikke helt. ') + item.why;
        };
        opts.appendChild(b);
      });
      box.appendChild(q);
    });
  });
}
document.addEventListener('DOMContentLoaded', initQuiz);

// Touch-venlige skydere: på iPad/iPhone kan man kun flytte en standard-skyder ved at ramme selve knappen.
// Her flytter et tryk eller træk hvor som helst på skyderen værdien derhen.
function enhanceRanges() {
  document.querySelectorAll('input[type="range"]').forEach((r) => {
    let on = false;
    const setFrom = (e) => {
      const b = r.getBoundingClientRect(), thumb = 28;
      const u = clamp((e.clientX - b.left - thumb / 2) / (b.width - thumb), 0, 1);
      const min = +r.min || 0, max = r.max === '' ? 100 : +r.max, step = r.step === 'any' ? 0 : +r.step || 1;
      let v = min + u * (max - min);
      if (step) v = min + Math.round((v - min) / step) * step;
      r.value = v;
      r.dispatchEvent(new Event('input', { bubbles: true }));
    };
    r.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      on = true; r.setPointerCapture?.(e.pointerId); setFrom(e); e.preventDefault();
    });
    r.addEventListener('pointermove', (e) => { if (on) { setFrom(e); e.preventDefault(); } });
    const off = () => { if (on) { on = false; r.dispatchEvent(new Event('change', { bubbles: true })); } };
    r.addEventListener('pointerup', off); r.addEventListener('pointercancel', off);
    r.addEventListener('touchmove', (e) => { if (on) e.preventDefault(); }, { passive: false });
  });
}
document.addEventListener('DOMContentLoaded', enhanceRanges);
