// 3D hero car (Three.js r128 + GLTFLoader). Desktop only; loads only if models/car.glb exists.
(function () {
  if (!window.THREE) return;
  const T = THREE, host = document.querySelector(".hero .wrap");
  if (!host) return;
  const base = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/";
  fetch("models/car.glb", { method: "HEAD" }).then(r => {
    if (!r.ok) return;
    const load = (src, sri) => new Promise((ok, no) => {
      const s = document.createElement("script");
      s.src = base + src; s.integrity = sri; s.crossOrigin = "anonymous"; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
    Promise.all([
      load("loaders/GLTFLoader.js", "sha384-fljlqkjWlmSFjkESkQvm77heIZpoWmXEOzlCA7kOpGUH+95Zk0yGfQieWM2q136E"),
      load("loaders/DRACOLoader.js", "sha384-TNRcLasZnnfIJJskDY5XlrfmsKTjBSy98MtyLuX+3rQWRbpSQvtFIdikNpcOh3SN")
    ]).then(init).catch(() => {});
  }).catch(() => {});

  function init() {
    let renderer;
    try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); } catch (e) { return; }
    const W = 600, H = 320, wrap = document.createElement("div");
    wrap.className = "car3d"; wrap.setAttribute("aria-hidden", "true");
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
    wrap.appendChild(renderer.domElement);

    const scene = new T.Scene(), cam = new T.PerspectiveCamera(30, W / H, .1, 100);
    scene.add(new T.AmbientLight(0xffffff, .35));
    const red = new T.PointLight(0xff3b2f, 2.2, 0, 2), amb = new T.PointLight(0xffb020, 2, 0, 2);
    red.position.set(-4, 2.5, 3); amb.position.set(4, 2, -3);
    scene.add(red, amb);
    const key = new T.DirectionalLight(0xffffff, .6); key.position.set(0, 5, 4); scene.add(key);

    const draco = new T.DRACOLoader(); draco.setDecoderPath(base + "libs/draco/gltf/");
    const loader = new T.GLTFLoader(); loader.setDRACOLoader(draco);
    loader.load("models/car.glb", gltf => {
      const car = gltf.scene, box = new T.Box3().setFromObject(car), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
      car.position.sub(c);                       // center on origin
      const k = 5.6 / Math.max(size.x, size.y, size.z);
      const g = new T.Group(); g.scale.setScalar(k); g.add(car); scene.add(g);
      cam.position.set(0, 1.1, 8.2); cam.lookAt(0, 0, 0);
      host.appendChild(wrap);
      document.querySelector(".hero").classList.add("hascar");
      requestAnimationFrame(() => wrap.classList.add("ready"));

      // Click/tap (without dragging) toggles "Open all doors" animation
      const clip = (gltf.animations || []).find(a => a.name === "Open all doors");
      const mixer = clip ? new T.AnimationMixer(car) : null, clock = new T.Clock();
      let act = null, open = false;
      if (mixer) { act = mixer.clipAction(clip); act.setLoop(T.LoopOnce); act.clampWhenFinished = true; wrap.style.cursor = "pointer"; wrap.title = "Click to open/close doors"; }
      const toggle = () => {
        if (!act) return;
        open = !open;
        act.paused = false; act.enabled = true;
        act.timeScale = open ? 1 : -1;
        if (open && act.time >= clip.duration) act.time = 0;
        if (!open && act.time <= 0) act.time = clip.duration;
        act.play();
      };
      let drag = false, lx = 0, ly = 0, vy = 0, vis = true, tab = true, sx = 0, sy = 0;
      const el = renderer.domElement;
      el.addEventListener("pointerdown", e => { drag = true; lx = sx = e.clientX; ly = sy = e.clientY; el.setPointerCapture(e.pointerId); });
      el.addEventListener("pointermove", e => { if (!drag) return; const d = e.clientX - lx; lx = e.clientX; g.rotation.y += d * .01; vy = d * .01; g.rotation.x = Math.max(-.5, Math.min(.8, g.rotation.x + (e.clientY - ly) * .008)); ly = e.clientY; });
      const up = () => { drag = false; };
      el.addEventListener("pointerup", e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) < 5) toggle(); });
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
      document.addEventListener("visibilitychange", () => { tab = !document.hidden; });
      new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(wrap);
      const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
      (function frame() {
        requestAnimationFrame(frame);
        const dt = clock.getDelta();
        if (mixer) mixer.update(dt);
        if (!vis || !tab) return;
        if (!drag) { g.rotation.x *= .96; vy *= .95; g.rotation.y += vy + (reduce ? 0 : .0035); }
        renderer.render(scene, cam);
      })();
    }, undefined, () => {});
  }
})();
