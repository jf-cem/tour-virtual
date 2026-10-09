const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const root = path.resolve(__dirname, '..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cem-look-'));
  try {
    fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
    fs.copyFileSync(path.join(root, 'vendor/three.module.js'), path.join(temp, 'three.module.js'));
    fs.copyFileSync(path.join(root, 'vendor/three.core.js'), path.join(temp, 'three.core.js'));
    const source = fs.readFileSync(path.join(root, 'phone-look.js'), 'utf8').replace("from 'three'", "from './three.module.js'");
    const modulePath = path.join(temp, 'phone-look.mjs');
    fs.writeFileSync(modulePath, source);
    const THREE = await import(pathToFileURL(path.join(temp, 'three.module.js')));
    const { createFixedLook } = await import(pathToFileURL(modulePath));
    const euler = q => new THREE.Euler().setFromQuaternion(q, 'YXZ');
    const angle = (a, b) => a.angleTo(b);
    const view = new THREE.Quaternion();
    const sample = (look, alpha, beta, gamma = 0, screen = 0) => look.sample({ alpha, beta, gamma }, screen, view);

    const directionCheck=createFixedLook();sample(directionCheck,0,90);
    const actual=sample(directionCheck,20,90);
    const expected=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,20*Math.PI/180,0,'YXZ'));
    assert(angle(actual,expected)<1e-7,'Horizontal rotation must follow the sensor, not reverse its sign');

    function trajectory(name, readings, maxStep = .65) {
      const look = createFixedLook();
      const frames = readings.map(([alpha, beta, gamma = 0, screen = 0]) => sample(look, alpha, beta, gamma, screen));
      const steps = frames.slice(1).map((q, i) => angle(frames[i], q));
      assert(steps.every(step => step < maxStep), `${name}: camera jump ${Math.max(...steps)}`);
      assert(frames.every(q => Math.abs(euler(q).z) < 1e-7), `${name}: unexpected roll`);
      return { look, frames, steps };
    }

    // Front -> down through vertical -> beyond -> front again, then reverse.
    const down = trajectory('front-down-front', Array.from({ length: 37 }, (_, i) => [15, 90 - Math.min(i, 36 - i) * 5]), .3);
    assert(angle(down.frames[0], down.frames.at(-1)) < 1e-7, 'returning from straight down changed the camera direction');
    const downDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(down.frames[18]);
    assert(downDirection.y < -.999, 'full downward view was artificially limited');

    // Same heading sweep from several phone inclinations and across north.
    for (const beta of [25, 50, 75, 110, 145]) {
      const turned = trajectory(`heading-beta-${beta}`, [[350, beta, -18], [355, beta, -18], [0, beta, -18], [5, beta, -18], [10, beta, -18]]);
      assert(turned.steps.at(-1) > .001, `heading at beta ${beta} was lost`);
    }
    const wrapped = trajectory('360-wrap', [[350, 65, 12], [355, 65, 12], [0, 65, 12], [5, 65, 12], [10, 65, 12]]);
    assert(wrapped.steps.every(step => step < .2), '360° passage took the long way');
    const fullCircleReadings = Array.from({ length: 37 }, (_, i) => [i === 36 ? 0 : i * 10, 65, 12]);
    const fullCircle = trajectory('complete-turn', fullCircleReadings, .3);
    assert(angle(fullCircle.frames[0], fullCircle.frames.at(-1)) < 1e-6, 'a complete 360° turn did not return to the starting view');

    // Simulate screen-angle change: reanchor preserves active view, then look remains responsive.
    const screen = createFixedLook();
    sample(screen, 28, 62, 17, 0);
    const beforeChange = sample(screen, 36, 58, 17, 0);
    screen.reanchor();
    const afterChange = screen.sample({ alpha: 36, beta: 58, gamma: 17 }, 90, beforeChange);
    assert(angle(beforeChange, afterChange) < 1e-7, 'portrait/landscape switch jumped the view');
    const afterMove = screen.sample({ alpha: 40, beta: 55, gamma: 17 }, 90, afterChange);
    assert(angle(afterChange, afterMove) < .5 && angle(afterChange, afterMove) > .001, 'landscape sensor movement was not continuous');

    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
    const panel = html.match(/<section class="control-section look-section"[\s\S]*?<\/section>/)?.[0] || '';
    assert(panel.includes('id="motion-toggle"') && !panel.includes('recenter') && !panel.includes('Recentrar'), 'look panel control markup');
    assert(!/recenter|Recentrar|recentr/.test(fs.readFileSync(path.join(root, 'phone.js'), 'utf8')), 'recenter handler remains');
    assert(css.includes('.controls .look-section{padding:8px 0 9px}'), 'compact look-section spacing missing');
    assert(css.includes('min-height:40px'), 'touch target minimum missing');
    assert(css.includes('@media(max-width:520px)') && css.includes('width:min(460px,calc(100% - 32px))'), '390px iPhone layout rules missing');
    assert(html.includes('name="viewport"'), 'responsive mobile viewport missing');
    console.log('PASS: front/down/front at full -90° elevation, 5 inclination sweeps, 360° wrap and full-circle return, portrait/landscape reanchor, zero roll; iPhone markup and 40px touch-target checks passed.');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
