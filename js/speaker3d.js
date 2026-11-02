// 3D hero speaker (Three.js r128 global). Desktop only; falls back silently to the 2D SVG speaker.
(function () {
  if (!window.THREE) return;
  const T = THREE, old = document.querySelector(".hero .speaker");
  if (!old) return;
  let renderer;
  try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); } catch (e) { return; }
  const S = 400, wrap = document.createElement("div");
  wrap.className = "speaker3d"; wrap.setAttribute("aria-hidden", "true");
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(S, S);
  wrap.appendChild(renderer.domElement);
  old.parentNode.insertBefore(wrap, old);

  const scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .1, 50);
  cam.position.set(0, 0, 7.6);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;

  // Studio-style reflections: a tiny emissive "room" baked once into an environment map (gives real metal/gloss).
  (function () {
    const env = new T.Scene(), add = (w, h, x, y, z, r, gg, bb) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ side: T.DoubleSide }));
      m.material.color.setRGB(r, gg, bb); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    env.add(new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x08080b, side: T.BackSide })));
    add(14, 3, 0, 9, 6, 4, 4, 4.2);       // soft top box
    add(3, 12, -9, 1, 4, 3.6, .5, .35);   // red strip, left
    add(3, 12, 9, -1, 4, 3.4, 2.1, .3);   // amber strip, right
    add(10, 2, 0, -8, 5, 1, .8, .7);      // warm floor bounce
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, .03).texture;
    pm.dispose();
  })();

  scene.add(new T.AmbientLight(0x6a6a82, .35));
  const key = new T.DirectionalLight(0xfff1e0, 1.4); key.position.set(-3, 4, 5); scene.add(key);
  const red = new T.PointLight(0xff3b2f, 2, 12); red.position.set(-2.6, .4, 2.2); scene.add(red);
  const amb = new T.PointLight(0xffb020, 1.6, 12); amb.position.set(2.8, -1, 2.4); scene.add(amb);

  const g = new T.Group(); scene.add(g);
  const L = (pts, mat, segs) => new T.Mesh(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), segs || 96), mat);
  const gloss = new T.MeshStandardMaterial({ color: 0x15151a, metalness: .85, roughness: .28, envMapIntensity: 1.2, side: T.DoubleSide });
  const rubber = new T.MeshStandardMaterial({ color: 0x0e0e11, metalness: .1, roughness: .75 });
  const paper = new T.MeshStandardMaterial({ color: 0x17171c, metalness: .25, roughness: .7, envMapIntensity: .45, side: T.DoubleSide });
  const steel = new T.MeshStandardMaterial({ color: 0x9a9aa6, metalness: 1, roughness: .3 });
  const amberM = new T.MeshStandardMaterial({ color: 0x2a1c05, emissive: 0xffb020, emissiveIntensity: .7, metalness: .5, roughness: .35 });
  const redM = new T.MeshStandardMaterial({ color: 0x7a160f, emissive: 0xff3b2f, emissiveIntensity: .75, metalness: .4, roughness: .35, envMapIntensity: .9 });

  // Deep chamfered cabinet with a recessed cavity (this is what gives the real sense of depth)
  const body = L([[0, -.95], [1.2, -.95], [1.38, -.8], [1.44, -.6], [1.44, .02], [1.38, .14], [1.22, .17], [1.1, .1], [1.04, -.05], [1.04, -.55], [0, -.55]], gloss);
  body.rotation.x = Math.PI / 2; g.add(body);
  const lip = new T.Mesh(new T.TorusGeometry(1.14, .028, 16, 120), amberM); lip.position.z = .15; g.add(lip);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8, bolt = new T.Mesh(new T.CylinderGeometry(.05, .05, .04, 16), steel);
    bolt.rotation.x = Math.PI / 2; bolt.position.set(Math.cos(a) * 1.31, Math.sin(a) * 1.31, .17); g.add(bolt);
  }
  const surround = new T.Mesh(new T.TorusGeometry(.98, .075, 20, 120), rubber); surround.scale.z = .55; surround.position.z = -.12; g.add(surround);

  // Concave cone with ribs, voice-coil dust cap, all inside one group so the whole thing pumps with the bass
  const cone = new T.Group(); cone.position.z = -.1; g.add(cone);
  const cp = [], depth = .75;
  for (let i = 0; i <= 14; i++) { const u = i / 14, r = .92 - u * .7; cp.push([r, -depth * Math.pow(u, 1.5)]); }
  const lathe = L(cp, paper, 96); lathe.rotation.x = Math.PI / 2; cone.add(lathe);
  const yAt = r => -depth * Math.pow((.92 - r) / .7, 1.5);
  [.8, .66, .52, .38].forEach(r => { const t = new T.Mesh(new T.TorusGeometry(r, .012, 8, 96), rubber); t.position.z = yAt(r) + .005; cone.add(t); });
  const ring = new T.Mesh(new T.TorusGeometry(.6, .03, 12, 96), redM); ring.position.z = yAt(.6) + .01; cone.add(ring);
  const dome = new T.Mesh(new T.SphereGeometry(.24, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), redM);
  dome.rotation.x = Math.PI / 2; dome.scale.set(1, 1, .9); dome.position.z = -depth - .02; cone.add(dome);

  g.rotation.x = -.06;

  // Shockwave rings fired on each bass hit
  const waves = [0, 1, 2].map(() => {
    const m = new T.Mesh(new T.TorusGeometry(1.1, .02, 8, 96), new T.MeshBasicMaterial({ color: 0xff5a2f, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    m.userData.a = 1; g.add(m); return m;
  });
  let wi = 0, prev = 0;
  function fire(c) { const w = waves[wi++ % 3]; w.userData.a = 0; w.material.color.setHex(c); }

  // Audio analyser (read-only tap): the <audio> element keeps playing natively, so sound can never be
  // muted by the Web Audio graph. If captureStream is unsupported (Safari) the speaker just breathes.
  let an, bins, ctx, src;
  function hook(au) {
    if (an || !au) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = .6;
      bins = new Uint8Array(an.frequencyBinCount);
      const cap = au.captureStream || au.mozCaptureStream;
      const attach = () => {
        if (ctx.state === "suspended") ctx.resume();
        if (src || !cap) return;
        try { const st = cap.call(au); if (st.getAudioTracks().length) { src = ctx.createMediaStreamSource(st); src.connect(an); } } catch (e) {}
      };
      au.addEventListener("playing", attach);
      if (!au.paused) attach();
    } catch (e) { an = null; }
  }
  if (window.__bdAudio) hook(window.__bdAudio);
  addEventListener("bd-audio", e => hook(e.detail));

  let drive = false, t0 = 0, peak = .2, mx = 0, my = 0, ry = 0, rx = 0, lvl = 0, vis = true, tab = true;
  addEventListener("mousemove", e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  document.addEventListener("visibilitychange", () => { tab = !document.hidden; });
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(wrap);

  const clock = new T.Clock();
  // "Hear the Bass" pressed: instant punch + a steady kick pattern, so the speaker always reacts
  addEventListener("bd-bass", e => {
    drive = !!e.detail;
    if (drive) { t0 = clock.getElapsedTime(); lvl = 1; fire(0xff3b2f); }
  });
  function frame() {
    requestAnimationFrame(frame);
    if (!vis || !tab) return;
    const t = clock.getElapsedTime();
    let target = .16 + .1 * Math.sin(t * 2.2);          // idle breathing
    if (an && src && window.__bdAudio && !window.__bdAudio.paused) {
      an.getByteFrequencyData(bins);
      const raw = (bins[1] + bins[2] + bins[3] + bins[4] + bins[5]) / 5 / 255;
      peak = Math.max(peak * .995, raw, .2);   // auto-gain so quiet devices still pulse hard
      target = Math.min(1, raw / peak);
    }
    if (drive) { const kick = Math.exp(-(((t - t0) * 2.2) % 1) * 5.5); target = Math.max(target, .3 + .7 * kick); }
    lvl += (target - lvl) * .4;
    if (lvl > .55 && prev <= .55) fire(Math.random() < .5 ? 0xff3b2f : 0xffb020);
    prev = lvl;
    waves.forEach(w => { const u = w.userData; if (u.a < 1) { u.a = Math.min(1, u.a + .035); w.scale.setScalar(1 + u.a * .9); w.position.z = .2 + u.a * .6; w.material.opacity = (1 - u.a) * .8; } else w.material.opacity = 0; });
    wrap.style.setProperty("--l", lvl.toFixed(3));
    g.scale.setScalar(1 + lvl * .07);
    cone.position.z = -.1 + lvl * .34;
    dome.scale.setScalar(1 + lvl * .65);
    redM.emissiveIntensity = .75 + lvl * 3.2;
    amberM.emissiveIntensity = .7 + lvl * 2.4;
    red.intensity = 2.4 + lvl * 7; amb.intensity = 2 + lvl * 5;
    const rtl = document.documentElement.dir === "rtl";
    const base = Math.sin(t * .45) * .6 * (rtl ? -1 : 1);
    ry += (base + mx * .5 - ry) * .07;
    rx += (my * .3 - rx) * .07;
    g.rotation.set(rx - .06, ry, 0);
    renderer.render(scene, cam);
  }
  frame();
  wrap.classList.add("ready");
  document.querySelector(".hero").classList.add("has3d");
})();
