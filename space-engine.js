/* =========================================================
   FLOW N HUB: WSPÓLNY SILNIK KOSMOSU, INTERAKCJI I LOGO 3D
   ========================================================= */

const isMobile = window.innerWidth < 768;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- GSAP + ScrollTrigger ---------- */
window.initScrollReveal = function() {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) { els.forEach(e => e.style.opacity = 1); return; }
    gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true });
    els.forEach(el => {
        const d = (el.className.match(/reveal-delay-(\d)/) || [0, 0])[1] * 0.12;
        gsap.from(el, {
            y: 60, opacity: 0, duration: 1.1, delay: d, ease: 'power3.out', clearProps: 'transform,opacity',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true }
        });
    });
    gsap.to('#scroll-bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    ScrollTrigger.refresh();
};

/* ---------- 3D Tilt ---------- */
window.initTilt = function() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.tilt').forEach(card => {
        const max = parseFloat(card.dataset.tilt) || 10;
        let raf = null;
        card.addEventListener('pointermove', e => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = null;
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
                card.classList.remove('leave');
                card.style.setProperty('--ry', ((px - .5) * 2 * max).toFixed(2) + 'deg');
                card.style.setProperty('--rx', ((.5 - py) * 2 * max).toFixed(2) + 'deg');
                card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            });
        });
        card.addEventListener('pointerleave', () => {
            card.classList.add('leave');
            card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
        });
    });
};

/* ---------- Magnetic Buttons ---------- */
window.initMagnetic = function() {
    if (!finePointer || reduceMotion || !window.gsap) return;
    document.querySelectorAll('.magnetic').forEach(el => {
        if (el.dataset.mag) return; el.dataset.mag = 1;
        const qx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
        const qy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
        el.addEventListener('pointermove', e => {
            const r = el.getBoundingClientRect();
            qx((e.clientX - (r.left + r.width / 2)) * .35);
            qy((e.clientY - (r.top + r.height / 2)) * .35);
        });
        el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
};

/* ---------- Nawigacja ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initMagnetic();
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('bg-ngen-dark/90', window.scrollY > 50);
            navbar.classList.toggle('backdrop-blur-md', window.scrollY > 50);
            navbar.classList.toggle('shadow-lg', window.scrollY > 50);
        }, { passive: true });
    }
    const menuBtn = document.getElementById('menu-btn'), mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const open = mobileMenu.classList.toggle('hidden') === false;
            menuBtn.setAttribute('aria-expanded', open);
        });
        mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.add('hidden')));
    }
});

/* ---------- TŁO KOSMICZNE: Three.js (Uruchamia się na KAŻDEJ podstronie) ---------- */
(function initSpaceBackground() {
    if (!window.THREE) return;
    const canvas = document.getElementById('webgl');
    if (!canvas) return;
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { console.warn('[Flow N Hub] WebGL niedostępny', e); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
    let VW = canvas.clientWidth || innerWidth, VH = canvas.clientHeight || innerHeight;
    renderer.setSize(VW, VH, false);

    const FOV = 50, CAM_Z = 10, M = reduceMotion ? .25 : 1;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.03);
    const camera = new THREE.PerspectiveCamera(FOV, VW / VH, 0.1, 100);
    camera.position.z = CAM_Z;
    scene.add(new THREE.AmbientLight(0x6655aa, 0.6));
    const lCyan = new THREE.PointLight(0x00f3ff, 2, 40); lCyan.position.set(6, 4, 6); scene.add(lCyan);
    const lRed = new THREE.PointLight(0xff3366, 1.6, 40); lRed.position.set(-7, -3, 4); scene.add(lRed);

    const radial = (stops) => {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
        stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    };
    const dotTex = radial([[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.8)'], [1, 'rgba(255,255,255,0)']]);

    /* Mgławica */
    const nebula = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        depthTest: false, depthWrite: false, defines: { OCT: isMobile ? 3 : 4 },
        uniforms: { uT: { value: 0 }, uH: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uM: { value: new THREE.Vector2() } },
        vertexShader: 'void main(){gl_Position=vec4(position.xy,1.0,1.0);}',
        fragmentShader: `
            uniform float uT,uH; uniform vec2 uRes,uM;
            float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
            float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
                return mix(mix(h(i),h(i+vec2(1.0,0.0)),f.x),mix(h(i+vec2(0.0,1.0)),h(i+vec2(1.0,1.0)),f.x),f.y);}
            float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<OCT;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=0.5;}return v;}
            void main(){
                vec2 uv=gl_FragCoord.xy/uRes;
                vec2 p=(uv-0.5)*vec2(uRes.x/uRes.y,1.0)*2.2+uM*0.25;
                float t=uT*0.05;
                vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
                float f=fbm(p+2.0*q+vec2(t*0.7,-t*0.5));
                vec3 c=vec3(0.015,0.015,0.045);
                c=mix(c,vec3(0.16,0.07,0.38),smoothstep(0.25,0.85,f)*0.9);
                c+=mix(vec3(0.0,0.5,0.65),vec3(0.75,0.1,0.35),uH)*pow(q.x,2.5)*0.7;
                c+=vec3(0.05,0.1,0.25)*pow(q.y,3.0);
                c*=0.62*(1.15-length(uv-0.5)*0.9);
                c+=(h(gl_FragCoord.xy)-0.5)*0.012;
                gl_FragColor=vec4(c,1.0);
            }`
    }));
    nebula.frustumCulled = false; nebula.renderOrder = -10;
    const resolution = nebula.material.uniforms.uRes.value;
    let rt = null, nebScene = null, rtFrame = 0;
    if (isMobile) {
        rt = new THREE.WebGLRenderTarget(8, 8); nebScene = new THREE.Scene(); nebScene.add(nebula);
        const show = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
            depthTest: false, depthWrite: false, uniforms: { t: { value: rt.texture } },
            vertexShader: 'varying vec2 v; void main(){v=uv; gl_Position=vec4(position.xy,1.0,1.0);}',
            fragmentShader: 'uniform sampler2D t; varying vec2 v; void main(){gl_FragColor=texture2D(t,v);}'
        }));
        show.frustumCulled = false; show.renderOrder = -10; scene.add(show);
    } else scene.add(nebula);

    /* Gwiazdy */
    const stars = (n, size, color, spread, opacity) => {
        const p = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * spread * 1.6; p[i * 3 + 1] = (Math.random() - .5) * spread; p[i * 3 + 2] = -Math.random() * spread * .9 - 2; }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
        const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: dotTex, alphaTest: .01, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
        scene.add(pts); return pts;
    };
    const farStars = stars(isMobile ? 260 : 1100, .09, 0xffffff, 34, .75);
    const nearStars = stars(isMobile ? 70 : 220, .16, 0x00f3ff, 20, .9);

    /* Warp (smugi) */
    const SN = isMobile ? 70 : 180, sp = new Float32Array(SN * 6), sd = new Float32Array(SN * 2);
    for (let i = 0; i < SN; i++) {
        const x = (Math.random() - .5) * 34, y = Math.random() * 40 - 20, z = -1 - Math.random() * 13;
        for (let k = 0; k < 2; k++) { sp.set([x, y, z], (i * 2 + k) * 3); sd[i * 2 + k] = k; }
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('side', new THREE.BufferAttribute(sd, 1));
    const streakMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uStretch: { value: 0 }, uOff: { value: 0 } },
        vertexShader: `attribute float side; uniform float uStretch,uOff; varying float vA;
            void main(){vec3 p=position; p.y=mod(p.y+uOff+20.0,40.0)-20.0; p.y-=side*uStretch; vA=1.0-side;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
        fragmentShader: 'varying float vA; void main(){gl_FragColor=vec4(0.2,0.95,1.0,vA*0.55);}'
    });
    const streaks = new THREE.LineSegments(sg, streakMat); streaks.frustumCulled = false; scene.add(streaks);

    /* Meteory */
    const mc = document.createElement('canvas'); mc.width = 128; mc.height = 4;
    const mx = mc.getContext('2d'), mg = mx.createLinearGradient(0, 0, 128, 0);
    mg.addColorStop(0, 'rgba(0,243,255,0)'); mg.addColorStop(.85, 'rgba(150,250,255,.8)'); mg.addColorStop(1, 'rgba(255,255,255,1)');
    mx.fillStyle = mg; mx.fillRect(0, 0, 128, 4);
    const metTex = new THREE.CanvasTexture(mc);
    const meteors = Array.from({ length: isMobile ? 1 : 3 }, () => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .02), new THREE.MeshBasicMaterial({ map: metTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        m.visible = false; m.userData = { life: 0, dur: 1.2, next: 1.5 + Math.random() * 3, dx: 0, dy: 0 }; scene.add(m); return m;
    });
    function meteorStep(dt) {
        if (reduceMotion) return;
        const hh = Math.tan(FOV * Math.PI / 360) * (CAM_Z + 3), hw = hh * camera.aspect;
        meteors.forEach(m => {
            const u = m.userData;
            if (!m.visible) {
                if ((u.next -= dt) > 0) return;
                const a = Math.PI * (1.1 + Math.random() * .12);
                u.dx = Math.cos(a); u.dy = Math.sin(a); u.life = 0;
                m.rotation.z = a; m.position.set(hw * (.1 + Math.random() * .9), hh * (.1 + Math.random() * .9), -3); m.visible = true;
            } else {
                u.life += dt; m.position.x += u.dx * 16 * dt; m.position.y += u.dy * 16 * dt;
                m.material.opacity = Math.sin(Math.PI * Math.min(u.life / u.dur, 1));
                if (u.life > u.dur) { m.visible = false; u.next = (isMobile ? 7 : 3) + Math.random() * 5; }
            }
        });
    }

    /* Asteroidy */
    const geos = [new THREE.IcosahedronGeometry(.5), new THREE.OctahedronGeometry(.5), new THREE.DodecahedronGeometry(.45), new THREE.TetrahedronGeometry(.55)];
    const rocks = [];
    for (let i = 0; i < (isMobile ? 3 : 7); i++) {
        const m = new THREE.Mesh(geos[i % 4], new THREE.MeshStandardMaterial({ color: 0x231b4b, metalness: .8, roughness: .35, flatShading: true, emissive: i % 3 === 0 ? 0x330011 : 0x001a24 }));
        m.position.set((i % 2 ? 1 : -1) * (5 + Math.random() * 6), (Math.random() - .5) * 10, -4 - Math.random() * 8);
        m.scale.setScalar(.6 + Math.random() * .8);
        m.userData = { s: .2 + Math.random() * .4, o: Math.random() * 6.28, y: m.position.y };
        scene.add(m); rocks.push(m);
    }

    const clock = new THREE.Clock();
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    if (finePointer) window.addEventListener('pointermove', e => {
        mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1;
        document.documentElement.style.setProperty('--cx', e.clientX + 'px'); document.documentElement.style.setProperty('--cy', e.clientY + 'px');
    }, { passive: true });

    let docH = 1, hue = 0, stretch = 0, lastY = scrollY, frame = 0, n = 0, raf = 0, last = 0, accT = 0, accN = 0, degraded = false;
    const sizeRT = () => { if (!rt) return; const h = 200, w = Math.max(8, Math.round(h * VW / VH)); rt.setSize(w, h); resolution.set(w, h); };
    const measure = () => { docH = Math.max(1, document.documentElement.scrollHeight - innerHeight); if (!rt) renderer.getDrawingBufferSize(resolution); };
    const resizeAll = () => {
        VW = canvas.clientWidth || innerWidth; VH = canvas.clientHeight || innerHeight;
        camera.aspect = VW / VH; camera.updateProjectionMatrix(); renderer.setSize(VW, VH, false); sizeRT(); measure();
    };
    let lw = innerWidth, lh = innerHeight;
    window.addEventListener('resize', () => {
        const w = innerWidth, h = innerHeight;
        if (!finePointer && w === lw && Math.abs(h - lh) < 160) return;
        lw = w; lh = h; resizeAll();
    });
    window.addEventListener('load', measure); resizeAll();
    document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) loop(); });

    function loop() {
        raf = requestAnimationFrame(loop);
        if ((isMobile || reduceMotion) && (++frame % 2)) return;
        const t = clock.getElapsedTime(), dt = Math.min(t - last, .1); last = t;
        if (!degraded && t > 2) { accT += dt; if (++accN === 90) { if (accT / 90 > (isMobile ? .05 : .03)) { degraded = true; renderer.setPixelRatio(1); measure(); } accT = 0; accN = 0; } }
        if (++n % 60 === 0) measure();
        mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
        const u = nebula.material.uniforms, sy = scrollY;
        hue += (Math.min(sy / docH, 1) - hue) * .05;
        u.uT.value = t * M; u.uH.value = hue; u.uM.value.set(mouse.x, -mouse.y);
        const vel = (sy - lastY) / Math.max(dt, .001); lastY = sy;
        stretch += ((reduceMotion ? 0 : Math.max(-7, Math.min(7, vel * .0025))) - stretch) * .12;
        streakMat.uniforms.uStretch.value = stretch; streakMat.uniforms.uOff.value = sy * .006;
        meteorStep(dt);
        rocks.forEach(m => { const d = m.userData; m.rotation.x += d.s * dt * M; m.rotation.y += d.s * 1.4 * dt * M; m.position.y = d.y + Math.sin(t * M * d.s + d.o) * .6; });
        farStars.position.y = sy * .0006; nearStars.position.y = sy * .0015;
        farStars.rotation.y = t * M * .012 + mouse.x * .08; nearStars.rotation.y = t * M * .02 + mouse.x * .16; nearStars.rotation.x = mouse.y * .08;
        lCyan.position.x = 6 + mouse.x * 4; lCyan.position.y = 4 - mouse.y * 3;
        if (rt && (rtFrame++ % 3 === 0)) { renderer.setRenderTarget(rt); renderer.render(nebScene, camera); renderer.setRenderTarget(null); }
        renderer.render(scene, camera);
    }
    loop();
})();

/* ---------- LOGO 3D (Włącza się TYLKO gdy na stronie jest element #hero-stage) ---------- */
window.initHeroLogo = function () {
    const stage = document.getElementById('hero-stage');
    if (!stage) return; // Na innych podstronach po prostu się nie uruchomi!
    const fail = e => { console.warn('[Flow N Hub] logo 3D niedostępne, pokazuję logo 2D:', e); document.documentElement.classList.add('no-3d'); };
    if (!window.THREE) return fail('brak THREE');
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;left:-30%;top:-30%;width:160%;height:160%;pointer-events:none';
    stage.appendChild(canvas);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { canvas.remove(); return fail(e); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    const FOV = 50, CAM_Z = 10, M = reduceMotion ? .25 : 1;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, 1, .1, 100); camera.position.z = CAM_Z;
    const logo = { group: new THREE.Group(), ready: false, aspect: 1, t0: 0, halo: null, rings: [] };
    scene.add(logo.group);
    const clock = new THREE.Clock();

    const radial = stops => {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
        stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    };
    const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('nie wczytano ' + src)); im.src = src; });

    function buildMask(im) {
        const k = Math.min(1, 640 / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0, w, h);
        const px = cx.getImageData(0, 0, w, h).data;
        const alphaMode = px[3] < 250;
        const a = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) {
            const o = i * 4;
            a[i] = alphaMode ? px[o + 3] : Math.min(255, (Math.abs(px[o] - px[0]) + Math.abs(px[o + 1] - px[1]) + Math.abs(px[o + 2] - px[2])) * 1.5);
        }
        const rowOn = y => { let n = 0; for (let i = 0; i < w; i++) if (a[y * w + i] > 128) n++; return n > 1; };
        const gap = Math.max(3, Math.round(h * .012));
        let y0 = -1, y1 = h - 1, empty = 0;
        for (let y = 0; y < h; y++) {
            const on = rowOn(y);
            if (y0 < 0) { if (on) y0 = y; continue; }
            if (on) { empty = 0; y1 = y; } else if (++empty >= gap) break;
        }
        if (y0 < 0) throw new Error('puste logo');
        let x0 = w, x1 = 0;
        for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) if (a[y * w + i] > 128) { if (i < x0) x0 = i; if (i > x1) x1 = i; }
        const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
        const out = document.createElement('canvas'); out.width = cw; out.height = ch;
        const ox = out.getContext('2d'), id = ox.createImageData(cw, ch);
        for (let y = 0; y < ch; y++) for (let i = 0; i < cw; i++) {
            const o = (y * cw + i) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = 255; id.data[o + 3] = a[(y + y0) * w + x0 + i];
        }
        ox.putImageData(id, 0, 0);
        return out;
    }

    let base = 1;
    const fit = () => {
        const cW = canvas.clientWidth || 1, cH = canvas.clientHeight || 1;
        renderer.setSize(cW, cH, false); camera.aspect = cW / cH; camera.updateProjectionMatrix();
        const wpp = 2 * Math.tan(FOV * Math.PI / 360) * CAM_Z / cH;
        base = Math.min(stage.clientHeight, stage.clientWidth / logo.aspect) * .72 * wpp;
    };

    function buildLogo(mask) {
        const g = logo.group; logo.aspect = mask.width / mask.height;
        const gl2 = renderer.capabilities.isWebGL2;
        const tex = new THREE.CanvasTexture(mask);
        tex.generateMipmaps = gl2; tex.minFilter = gl2 ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        const geo = new THREE.PlaneGeometry(logo.aspect, 1);
        const L = isMobile ? 8 : 18, D = .1, cA = new THREE.Color(0x7ef6ff), cB = new THREE.Color(0x0a4a8c);
        for (let i = 0; i < L; i++) {
            const t = i / (L - 1);
            const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, color: i === 0 ? 0xffffff : cA.clone().lerp(cB, t) }));
            m.position.z = -t * D; g.add(m);
        }
        const rim = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .35, color: 0x00f3ff, blending: THREE.AdditiveBlending, depthWrite: false }));
        rim.scale.setScalar(1.05); rim.position.z = -D - .01; g.add(rim);
        logo.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(0,243,255,.5)'], [.4, 'rgba(0,120,255,.16)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false }));
        logo.halo.position.z = -D - .05; g.add(logo.halo);
        [[.8, 0x00f3ff, 1.15, .35, .5, 0xffffff], [.7, 0xff3366, 1.4, -.6, .45, 0xffb3c6]].forEach(([R, col, rx, ry, op, sc], k) => {
            const pivot = new THREE.Group(); pivot.rotation.set(rx, ry, 0); pivot.position.z = -D / 2;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(R, .004, 6, isMobile ? 72 : 140), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op }));
            const sat = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 12), new THREE.MeshBasicMaterial({ color: sc }));
            sat.position.set(R, 0, 0); ring.add(sat); pivot.add(ring); g.add(pivot);
            logo.rings.push({ ring, dir: k ? -1 : 1, sp: .35 + k * .15 });
        });
        logo.ready = true; logo.t0 = clock.getElapsedTime(); fit();
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    if (finePointer) window.addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

    let raf = 0, last = 0, visible = true;
    function frame() {
        raf = requestAnimationFrame(frame);
        const t = clock.getElapsedTime(), dt = Math.min(t - last, .1); last = t;
        if (!logo.ready) return;
        mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
        const w = t * M, e = reduceMotion ? 1 : 1 - Math.pow(1 - Math.min((t - logo.t0) / 1.8, 1), 3);
        logo.group.scale.setScalar(base * (.55 + .45 * e));
        logo.group.position.y = Math.sin(w * .9) * .08;
        logo.group.rotation.y = (1 - e) * -1.6 + Math.sin(w * .6) * .22 + mouse.x * .45;
        logo.group.rotation.x = Math.sin(w * .45) * .06 + mouse.y * .25;
        logo.halo.scale.setScalar(2.8 + Math.sin(w * 1.4) * .12);
        logo.rings.forEach(o => { o.ring.rotation.z += o.dir * o.sp * dt * M; });
        renderer.render(scene, camera);
    }
    const run = () => { if (!raf && visible && !document.hidden) frame(); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage); else window.addEventListener('resize', fit);
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? run() : stop(); }, { rootMargin: '100px' }).observe(stage);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : run(); });
    fit(); run();

    loadImg('LOGO FLOW-N-HUB BEZ TŁA.png').catch(() => loadImg('Gemini_Generated_Image_qyc351qyc351qyc3.jpeg')).then(buildMask).then(buildLogo)
        .catch(err => { stop(); canvas.remove(); fail(err); });
};

/* ---------- OBSŁUGA COOKIES I ANALITYKI (Globalna) ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const GA_TRACKING_ID = 'G-EEXYZY2BZ2';
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');
    const openSettingsBtn = document.getElementById('open-cookie-settings');
    if (!cookieBanner) return;

    const openCookie = () => { cookieBanner.classList.add('cookie-open'); cookieBanner.setAttribute('aria-hidden', 'false'); };
    const closeCookie = () => { cookieBanner.classList.remove('cookie-open'); cookieBanner.setAttribute('aria-hidden', 'true'); };

    function loadGoogleAnalytics() {
        if (!GA_TRACKING_ID || GA_TRACKING_ID === 'G-XXXXXXXXXX' || document.getElementById('ga-script')) return;
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
        script.async = true;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', GA_TRACKING_ID, { 'anonymize_ip': true });
    }

    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent === 'accepted') loadGoogleAnalytics();
    else if (!cookieConsent) setTimeout(openCookie, 3500);

    if (acceptBtn) acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        closeCookie();
        loadGoogleAnalytics();
    });

    if (declineBtn) declineBtn.addEventListener('click', () => {
        const prev = localStorage.getItem('cookieConsent');
        localStorage.setItem('cookieConsent', 'declined');
        closeCookie();
        if (prev === 'accepted') window.location.reload();
    });

    if (openSettingsBtn) openSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCookie();
    });
});
