// Space Weed: the eclipse. Age gate, the scroll film, the moon crossing on page change, the corona light.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('rm');
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ramp(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t * t * (3 - 2 * t); }

  // 21+ gate (remembered for this browser; "No" goes to the under-21 page)
  var gate = document.getElementById('gate');
  var cleared = false;
  try { cleared = localStorage.getItem('sw-21') === 'yes'; } catch (e) {}
  if (gate) {
    if (cleared) gate.hidden = true;
    else {
      gate.hidden = false;
      document.body.style.overflow = 'hidden';
      gate.querySelector('[data-yes]').addEventListener('click', function () {
        try { localStorage.setItem('sw-21', 'yes'); } catch (e) {}
        document.body.style.overflow = '';
        if (reduce) { gate.hidden = true; return; }
        gate.classList.add('clearing');
        setTimeout(function () { gate.hidden = true; }, 1250);
      });
      setTimeout(function () { gate.focus({ preventScroll: true }); }, 50);
    }
  }

  // Menu (phones and narrow screens)
  var mb = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  if (mb && menu) {
    mb.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open; mb.setAttribute('aria-expanded', String(open)); mb.textContent = open ? 'Close' : 'Menu';
      document.body.style.overflow = open ? 'hidden' : '';
      root.classList.toggle('menu-open', open);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) mb.click(); });
  }

  // The page change: the moon crosses the screen, and the next page comes up behind it
  var transit = document.querySelector('.transit');
  if (transit) {
    if (root.classList.contains('arriving')) {
      try { sessionStorage.removeItem('sw-cross'); } catch (e) {}
      if (reduce) root.classList.remove('arriving');
      else requestAnimationFrame(function () { requestAnimationFrame(function () {
        transit.classList.add('out');
        setTimeout(function () { root.classList.remove('arriving'); transit.classList.remove('out'); }, 820);
      }); });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) return;
      if (reduce) return;
      e.preventDefault();
      transit.classList.remove('out');
      transit.classList.add('in');
      try { sessionStorage.setItem('sw-cross', '1'); } catch (err) {}
      setTimeout(function () { location.href = url.href; }, 640);
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { transit.classList.remove('in', 'out'); root.classList.remove('arriving'); }
    });
  }

  // Frame sequence: loads every frame, draws the nearest one that has arrived
  function Seq(dir, n, canvas, fit) {
    var imgs = new Array(n), ctx = canvas.getContext('2d'), last = -1;
    function pad(i) { return ('00' + (i + 1)).slice(-3); }
    function load(i) { var im = new Image(); im.onload = function () { imgs[i] = im; if (last < 0 || i === want) draw(want, true); }; im.src = dir + pad(i) + '.webp'; }
    var want = 0;
    for (var s = 8; s >= 1; s = s >> 1) for (var i = 0; i < n; i += s) if (!imgs[i] && !(s < 8 && i % (s * 2) === 0)) load(i);
    function draw(i, force) {
      want = i;
      var k = i, d = 0;
      while (!imgs[k] && d < n) { d++; if (imgs[i - d]) k = i - d; else if (imgs[i + d]) k = i + d; }
      if (!imgs[k] || (k === last && !force)) return;
      last = k; fit(ctx, imgs[k], canvas);
    }
    return { draw: draw };
  }

  // The landing: scroll drives the whole eclipse
  var stage = document.getElementById('stage');
  if (stage && !reduce) (function () {
    var day = stage.querySelector('.daycv'), tot = stage.querySelector('.tot'), corona = stage.querySelector('.corona'),
      flash = stage.querySelector('.flashcv'), hole = stage.querySelector('.jarhole'), jar = stage.querySelector('.jar'),
      copy = stage.querySelector('.hero-copy'), scrim = stage.querySelector('.dayscrim'), totscrim = stage.querySelector('.totscrim'),
      white = stage.querySelector('.whiteout'), factsWrap = stage.querySelector('.facts-wrap'),
      facts = [].slice.call(stage.querySelectorAll('.facts li')), cue = stage.querySelector('.cue'), skip = stage.querySelector('.skip');
    var SUNX = 0.502, SUNY = 0.181, SUND = 0.022, CORONA_F = 0.42; // measured from the shots
    var W, H, D, side, sx, sy, sMax;

    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var seqDay = Seq('assets/seq/day/', +day.getAttribute('data-frames'), day, function (c, im, cv) {
      var s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
      c.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    });
    var flashN = +flash.getAttribute('data-frames');
    var seqFlash = Seq('assets/seq/flash/', flashN, flash, function (c, im, cv) { c.drawImage(im, 0, 0, cv.width, cv.height); });

    function size() {
      W = innerWidth; H = stage.querySelector('.pin').clientHeight;
      D = W < 860 ? Math.min(W * 0.8, H * 0.46) : Math.min(H, W) * 0.66;
      side = D / CORONA_F;
      tot.style.width = tot.style.height = side + 'px';
      hole.style.width = hole.style.height = D * 0.93 + 'px';
      day.width = Math.round(W * dpr); day.height = Math.round(H * dpr);
      var c = Math.max(W / 1280, H / 720), fw = 1280 * c, fh = 720 * c;
      sx = (W - fw) / 2 + SUNX * fw; sy = (H - fh) / 2 + SUNY * fh;
      sMax = D / (SUND * fw);
      target = current = progress();
      paint(current, true);
    }

    function progress() { var r = stage.getBoundingClientRect(), run = r.height - H; return clamp(-r.top / run, 0, 1); }

    function paint(p, force) {
      // A: daylight dies. B: push into the sun. C: totality, the jar. D: the diamond ring whites out the screen.
      seqDay.draw(Math.round(ramp(p, 0, 0.30) * 150), force);
      var t = ease(ramp(p, 0.30, 0.45));
      var s = Math.pow(sMax, t);
      var cx = W < 860 ? W / 2 : W * 0.62, cy = W < 860 ? H * 0.36 : H / 2;
      var px = sx + (cx - sx) * t, py = sy + (cy - sy) * t;
      day.style.transform = 'translate(' + (px - sx * s).toFixed(1) + 'px,' + (py - sy * s).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      day.style.opacity = 1 - ramp(t, 0.62, 0.86);
      day.style.visibility = t >= 0.86 ? 'hidden' : 'visible';
      scrim.style.opacity = 1 - ramp(p, 0.06, 0.2);
      var k = s / sMax, breathe = 1 + ramp(p, 0.45, 0.74) * 0.035;
      var pointer = t >= 1 ? 1 : 0;
      tot.style.transform = 'translate(' + (px + mx * 18 * pointer - side / 2).toFixed(1) + 'px,' + (py + my * 18 * pointer - side / 2).toFixed(1) + 'px) scale(' + (k * breathe).toFixed(4) + ')';
      tot.style.opacity = ramp(t, 0.18, 0.5);
      var hs = D * 0.93;
      hole.style.transform = 'translate(' + (px - hs / 2).toFixed(1) + 'px,' + (py - hs / 2).toFixed(1) + 'px)';
      hole.style.opacity = ramp(p, 0.445, 0.47);
      var jr = ease(ramp(p, 0.45, 0.53));
      jar.style.setProperty('--jy', ((1 - jr) * 120).toFixed(1) + '%');
      jar.style.setProperty('--jb', (1 - ramp(p, 0.76, 0.82) * 0.6).toFixed(3));
      jar.style.opacity = 1 - ramp(p, 0.79, 0.835);
      jar.style.transform = 'translate(calc(-50% + ' + (mx * -8).toFixed(1) + 'px), calc(-50% + ' + ((1 - jr) * 120).toFixed(1) + '% + ' + (my * -8).toFixed(1) + 'px))';
      // copy
      var c = 1 - ramp(p, 0.015, 0.075);
      copy.style.opacity = c; copy.style.visibility = c <= 0 ? 'hidden' : 'visible';
      copy.style.transform = 'translateY(' + (-30 * (1 - c)).toFixed(1) + 'px)';
      var fa = ramp(p, 0.5, 0.53) * (1 - ramp(p, 0.75, 0.78));
      factsWrap.style.opacity = fa;
      factsWrap.style.pointerEvents = fa > 0.5 ? 'auto' : 'none';
      totscrim.style.opacity = fa;
      var fi = p < 0.59 ? 0 : p < 0.67 ? 1 : 2;
      if (fi !== paint.fi) { paint.fi = fi; facts.forEach(function (li, i) { li.classList.toggle('on', i === fi); }); }
      // flash
      var fl = ramp(p, 0.75, 0.93);
      flash.style.opacity = ramp(p, 0.74, 0.77);
      seqFlash.draw(Math.round(fl * (flashN - 1)), force);
      white.style.opacity = ramp(p, 0.83, 0.895);
      var ui = 1 - ramp(p, 0.02, 0.05);
      cue.style.opacity = ui;
      skip.style.opacity = 1 - ramp(p, 0.9, 0.93); skip.style.visibility = p > 0.93 ? 'hidden' : 'visible';
      // the corona only plays while it can be seen
      var showC = p > 0.3 && p < 0.86;
      if (showC && corona.paused) { var pr = corona.play(); if (pr && pr.catch) pr.catch(function () {}); }
      if (!showC && !corona.paused) corona.pause();
      stage.__white = p > 0.905;
    }

    var target = 0, current = 0, raf = 0, mx = 0, my = 0;
    function loop() {
      raf = 0;
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0002) current = target;
      paint(current);
      lightCheck();
      if (current !== target) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    window.addEventListener('scroll', function () { target = progress(); kick(); }, { passive: true });
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) { mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; if (target > 0.45 && target < 0.8) kick(); }, { passive: true });
    size();
    window.__eclipse = { size: size, paint: paint };
  })();

  // The header goes dark over daylight
  var lights = [].slice.call(document.querySelectorAll('[data-light]'));
  var stageEl = stage;
  function lightCheck() {
    var on = false;
    lights.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top < 40 && r.bottom > 40) on = true; });
    if (stageEl && stageEl.__white) { var b = stageEl.getBoundingClientRect(); if (b.bottom > 40) on = true; }
    root.classList.toggle('on-light', on);
  }
  window.addEventListener('scroll', lightCheck, { passive: true });
  lightCheck();

  // Technology: the moon crosses the sun, one step at a time
  var cover = document.getElementById('cover');
  if (cover && !reduce) (function () {
    var pin = cover.querySelector('.cover-pin'), items = [].slice.call(cover.querySelectorAll('li')), sun = cover.querySelector('.c-sun'), i0 = -1;
    function on() {
      var r = cover.getBoundingClientRect(), p = clamp(-r.top / (r.height - innerHeight), 0, 1);
      // moon: from just off the right edge of the sun to dead centre by the last step
      var m = 1 - ease(ramp(p, 0.02, 0.8));
      pin.style.setProperty('--mx', (m * 1.1).toFixed(4));
      pin.style.setProperty('--co', ramp(p, 0.78, 0.88).toFixed(3));
      sun.style.visibility = p > 0.88 ? 'hidden' : 'visible';
      var i = p < 0.3 ? 0 : p < 0.62 ? 1 : 2;
      if (i !== i0) { i0 = i; items.forEach(function (li, k) { li.classList.toggle('on', k === i); }); }
    }
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on); on();
  })();

  // Products: your cursor is the corona, and the flower lights up under it
  var lit = document.getElementById('lit');
  if (lit) (function () {
    var top = lit.querySelector('.lit-top');
    if (reduce) { lit.querySelector('.lit-base').style.visibility = 'hidden'; return; }
    top.classList.add('lit-mask');
    var touched = false, seen = false, raf = 0, x = 0.5, y = 0.5, tx = 0.5, ty = 0.5, t0 = performance.now();
    function loop(now) {
      raf = 0;
      if (!touched) { var a = (now - t0) / 2600; tx = 0.5 + Math.cos(a) * 0.26; ty = 0.5 + Math.sin(a * 1.4) * 0.2; }
      x += (tx - x) * 0.09; y += (ty - y) * 0.09;
      top.style.setProperty('--lx', (x * 100).toFixed(1) + '%');
      top.style.setProperty('--ly', (y * 100).toFixed(1) + '%');
      if (seen) raf = requestAnimationFrame(loop);
    }
    lit.addEventListener('pointermove', function (e) {
      var r = top.getBoundingClientRect();
      touched = true; tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
    });
    lit.addEventListener('pointerleave', function () { touched = false; t0 = performance.now(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      seen = es[0].isIntersecting; if (seen && !raf) raf = requestAnimationFrame(loop);
    }).observe(lit);
  })();

  // Rooms and loops only play on screen
  [].slice.call(document.querySelectorAll('.room-media[autoplay], .totroom-c')).forEach(function (v) {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    }).observe(v);
  });

  // Cursor: a small moon
  var cur = document.querySelector('.cursor');
  if (cur && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) (function () {
    var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    function loop() {
      raf = 0; x += (tx - x) * 0.32; y += (ty - y) * 0.32;
      cur.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(loop);
    }
    window.addEventListener('pointermove', function (e) {
      if (!cur.classList.contains('on')) { x = e.clientX; y = e.clientY; cur.classList.add('on'); }
      tx = e.clientX; ty = e.clientY;
      cur.classList.toggle('big', !!(e.target.closest && e.target.closest('a, button, label, input, textarea')));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
  })();

  // Entrances
  var items = [].slice.call(document.querySelectorAll('.rise'));
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el, i) { el.style.transitionDelay = ((i % 3) * 80) + 'ms'; io.observe(el); });
})();
