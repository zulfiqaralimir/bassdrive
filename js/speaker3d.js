// 3D hero speaker (Three.js r128 global). Desktop only; falls back silently to the 2D SVG speaker.
(function () {
  if (!window.THREE) return;
  const T = THREE, old = document.querySelector(".hero .speaker");
  if (!old) return;
  let renderer;
  try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); } catch (e) { return; }
  const S = 340, wrap = document.createElement("div");
  wrap.className = "speaker3d"; wrap.setAttribute("aria-hidden", "true");
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(S, S);
  wrap.appendChild(renderer.domElement);
  old.parentNode.insertBefore(wrap, old);

  const scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, .1, 50);
  cam.position.z = 6.4;
  scene.add(new T.AmbientLight(0x7a7a96, 1.4));
  const red = new T.PointLight(0xff3b2f, 2.2, 14); red.position.set(-1.5, 1.2, 3.8); scene.add(red);
  const amb = new T.PointLight(0xffb020, 1.8, 14); amb.position.set(1.8, -1, 3.8); scene.add(amb);

  const g = new T.Group(); scene.add(g);
  const dark = new T.MeshStandardMaterial({ color: 0x141418, metalness: .6, roughness: .45 });
  const dark2 = new T.MeshStandardMaterial({ color: 0x3a3a46, metalness: .35, roughness: .38, side: T.DoubleSide });
  const amberM = new T.MeshStandardMaterial({ color: 0x3a2a08, emissive: 0xffb020, emissiveIntensity: .6, metalness: .3, roughness: .4 });
  const redM = new T.MeshStandardMaterial({ color: 0x3a0f0c, emissive: 0xff3b2f, emissiveIntensity: .6, metalness: .3, roughness: .4 });

  const baffle = new T.Mesh(new T.CylinderGeometry(1.25, 1.25, .25, 72), dark); baffle.rotation.x = Math.PI / 2; g.add(baffle);
  const rim = new T.Mesh(new T.TorusGeometry(1.2, .06, 16, 96), amberM); rim.position.z = .13; g.add(rim);
  const surround = new T.Mesh(new T.TorusGeometry(.95, .09, 16, 96), dark2); surround.position.z = .13; g.add(surround);

  const cone = new T.Group(); cone.position.z = .1; g.add(cone);
  const pts = [[.9, .02], [.8, -.1], [.6, -.27], [.4, -.38], [.22, -.42]].map(p => new T.Vector2(p[0], p[1]));
  const lathe = new T.Mesh(new T.LatheGeometry(pts, 64), dark2); lathe.rotation.x = Math.PI / 2; cone.add(lathe);
  const ring = new T.Mesh(new T.TorusGeometry(.6, .04, 12, 96), redM); ring.position.z = -.25; cone.add(ring);
  const dome = new T.Mesh(new T.SphereGeometry(.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), redM); dome.rotation.x = Math.PI / 2; dome.position.z = -.4; cone.add(dome);

  // Audio analyser attaches to the "Hear the Bass" element once the user has played it.
  let an, bins, ctx;
  function hook(au) {
    if (an || !au) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const src = ctx.createMediaElementSource(au);
      an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = .6;
      src.connect(an); an.connect(ctx.destination);
      bins = new Uint8Array(an.frequencyBinCount);
      au.addEventListener("play", () => ctx.resume());
      ctx.resume();
    } catch (e) { an = null; }
  }
  if (window.__bdAudio) hook(window.__bdAudio);
  addEventListener("bd-audio", e => hook(e.detail));

  let mx = 0, my = 0, ry = 0, rx = 0, lvl = 0, vis = true, tab = true;
  addEventListener("mousemove", e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  document.addEventListener("visibilitychange", () => { tab = !document.hidden; });
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(wrap);

  const clock = new T.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!vis || !tab) return;
    const t = clock.getElapsedTime();
    let target = .1 + .06 * Math.sin(t * 2.2);          // idle breathing
    if (an && window.__bdAudio && !window.__bdAudio.paused) {
      an.getByteFrequencyData(bins);
      target = (bins[1] + bins[2] + bins[3] + bins[4]) / 4 / 255;
    }
    lvl += (target - lvl) * .35;
    cone.position.z = .1 + lvl * .16;
    dome.scale.setScalar(1 + lvl * .4);
    redM.emissiveIntensity = .5 + lvl * 2;
    amberM.emissiveIntensity = .5 + lvl * 1.2;
    red.intensity = 2 + lvl * 3; amb.intensity = 1.6 + lvl * 2.2;
    const rtl = document.documentElement.dir === "rtl";
    const base = Math.sin(t * .4) * .5 * (rtl ? -1 : 1);
    ry += (base + mx * .35 - ry) * .06;
    rx += (my * .2 - rx) * .06;
    g.rotation.set(rx, ry, 0);
    renderer.render(scene, cam);
  }
  frame();
  wrap.classList.add("ready");
  document.querySelector(".hero").classList.add("has3d");
})();
