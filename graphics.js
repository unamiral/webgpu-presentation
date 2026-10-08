/* WebGPU setup stays here; only the two distance-rule lines appear on slide 4.
   CSS underneath each canvas is also the interactive, explicitly labelled fallback. */
(() => {
  const colours = { blue: [56/255,142/255,1], orange: [1,142/255,56/255], purple: [184/255,117/255,1] };
  const spots = [...document.querySelectorAll('[data-spotlight]')].map(host => ({host, canvas:host.querySelector('canvas'), x:.72, y:.58, radius:180, colour:'blue'}));
  const ambient = {canvas:document.querySelector('#ambient'), background:true};
  const surfaces = [ambient, ...spots];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let device, pipeline, frame = 0, active = false, stopped = false, dirty = true, last = 0, elapsed = 0;
  function cssSpot(spot) {
    spot.host.style.setProperty('--x', `${spot.x * 100}%`);
    spot.host.style.setProperty('--y', `${spot.y * 100}%`);
    spot.host.style.setProperty('--radius', `${spot.radius}px`);
    spot.host.style.setProperty('--light', `rgb(${colours[spot.colour].map(c => Math.round(c * 255)).join(',')})`);
    dirty = true; schedule();
  }
  function fallback(error) {
    if (stopped) return;
    stopped = true; active = false;
    cancelAnimationFrame(frame); frame = 0;
    surfaces.forEach(s => {s.canvas.style.visibility = 'hidden';});
    // Keep the demo canvas focusable for keyboard input even in CSS fallback.
    spots.forEach(s => {s.canvas.style.visibility = 'visible';s.canvas.style.opacity = '0';});
    document.querySelector('#render-status').textContent = 'WebGPU unavailable — showing a fallback.';
    document.querySelector('#fun-fact').textContent = 'This presentation includes a WebGPU background and demo.';
    if (error) console.info('Using CSS spotlight fallback:', error.message || error);
    if (device) device.destroy();
  }
  spots.forEach(spot => {
    function move(event) {
      const rect = spot.canvas.getBoundingClientRect();
      spot.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      spot.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      cssSpot(spot);
    }
    spot.canvas.addEventListener('pointermove', move);
    spot.canvas.addEventListener('pointerdown', event => {spot.canvas.setPointerCapture(event.pointerId);move(event);});
    spot.canvas.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      spot.x = Math.max(0,Math.min(1,spot.x + (event.key === 'ArrowRight' ? .025 : event.key === 'ArrowLeft' ? -.025 : 0)));
      spot.y = Math.max(0,Math.min(1,spot.y + (event.key === 'ArrowDown' ? .025 : event.key === 'ArrowUp' ? -.025 : 0)));
      cssSpot(spot);
    });
  });
  const demo = spots[1], slider = document.querySelector('#radius');
  slider.addEventListener('input', () => {demo.radius = Number(slider.value);document.querySelector('#radius-value').value = `${demo.radius} px`;cssSpot(demo);});
  function setColour(colour) {
    demo.colour = colour;
    document.querySelectorAll('[data-colour]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.colour === colour)));
    cssSpot(demo);
  }
  document.querySelectorAll('[data-colour]').forEach(button => button.addEventListener('click', () => setColour(button.dataset.colour)));
  document.querySelector('#reset').addEventListener('click', () => {
    demo.x = demo.y = .5; demo.radius = 180; slider.value = '180';
    document.querySelector('#radius-value').value = '180 px'; setColour('blue');
  });
  const shader = `
struct Params {
  size: vec2f, mouse: vec2f,
  colour: vec4f,
  radius: f32, time: f32, background: f32, padding: f32,
};
@group(0) @binding(0) var<uniform> p: Params;
@vertex fn vertexMain(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let vertices = array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
  return vec4f(vertices[i],0,1);
}
@fragment fn fragmentMain(@builtin(position) pixel: vec4f) -> @location(0) vec4f {
  let base = vec3f(8.0,14.0,26.0) / 255.0;
  if (p.background > 0.5) {
    let uv = pixel.xy / p.size;
    let centre = vec2f(0.76 + 0.08 * sin(p.time * 0.16), 0.28 + 0.09 * cos(p.time * 0.13));
    let glow = max(0.0, 1.0 - distance(uv, centre) / 0.85);
    return vec4f(base + vec3f(0.012,0.031,0.061) * glow,1);
  }
  let d = distance(pixel.xy, p.mouse.xy);
  let brightness = max(0.0, 1.0 - d / p.radius);
  return vec4f(mix(base, p.colour.rgb, brightness),1);
}`;
  function resize(surface) {
    const rect = surface.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    // CSS pixels define the radius. Backing pixels follow display scaling,
    // capped by device limits and a 2x quality budget on very dense screens.
    const scale = Math.min(devicePixelRatio || 1, 2, device.limits.maxTextureDimension2D / Math.max(rect.width,rect.height));
    const width = Math.max(1,Math.round(rect.width * scale)), height = Math.max(1,Math.round(rect.height * scale));
    if (surface.canvas.width !== width || surface.canvas.height !== height) {surface.canvas.width = width; surface.canvas.height = height;}
    surface.scale = width / rect.width;
    return true;
  }
  function render(now) {
    frame = 0;
    if (!active || document.hidden) return;
    if (last) elapsed += Math.min((now - last) / 1000, .1);
    last = now;
    try {
      const encoder = device.createCommandEncoder();
      for (const s of surfaces) {
        if (!s.background && !s.host.closest('.slide').classList.contains('active')) continue;
        // Static spotlight is redrawn only when input, slide, or size changes.
        if (!s.background && !dirty) continue;
        if (!resize(s)) continue;
        const w = s.canvas.width, h = s.canvas.height;
        const colour = colours[s.colour || 'blue'];
        device.queue.writeBuffer(s.buffer, 0, new Float32Array([w,h,(s.x ?? .5)*w,(s.y ?? .5)*h,...colour,1,(s.radius || 180)*s.scale,reduced.matches ? 0 : elapsed,s.background ? 1 : 0,0]));
        const pass = encoder.beginRenderPass({colorAttachments:[{view:s.context.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:{r:0,g:0,b:0,a:1}}]});
        pass.setPipeline(pipeline); pass.setBindGroup(0,s.bindGroup); pass.draw(3); pass.end();
      }
      device.queue.submit([encoder.finish()]); dirty = false;
    } catch (error) {fallback(error);return;}
    if (!reduced.matches) schedule();
  }
  function schedule() {if (active && !document.hidden && !frame) frame = requestAnimationFrame(render);}
  function invalidate() {dirty = true;schedule();}
  const observer = new ResizeObserver(invalidate);
  surfaces.forEach(s => observer.observe(s.canvas));
  window.addEventListener('resize',invalidate);
  // DPR may change when moving between monitors without a CSS size change.
  let densityQuery;
  function watchDensity() {
    if (densityQuery) densityQuery.removeEventListener('change', onDensity);
    densityQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    densityQuery.addEventListener('change',onDensity);
  }
  function onDensity(){watchDensity();invalidate();}
  watchDensity();
  document.addEventListener('slidechange',invalidate);
  reduced.addEventListener('change',invalidate);
  document.addEventListener('visibilitychange', () => {cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden)invalidate();});
  async function init() {
    try {
      // ?fallback=1 makes the fallback easy to rehearse on a compatible machine.
      if (new URLSearchParams(location.search).has('fallback') || !navigator.gpu) throw new Error('WebGPU not available or fallback requested.');
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error('No WebGPU adapter.');
      device = await adapter.requestDevice();
      device.lost.then(info => fallback(new Error(`GPU device lost: ${info.message}`)));
      device.addEventListener('uncapturederror', event => fallback(event.error));
      device.pushErrorScope('validation');
      const format = navigator.gpu.getPreferredCanvasFormat();
      const module = device.createShaderModule({code:shader});
      pipeline = await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vertexMain'},fragment:{module,entryPoint:'fragmentMain',targets:[{format}]},primitive:{topology:'triangle-list'}});
      for (const s of surfaces) {
        s.context = s.canvas.getContext('webgpu');
        if (!s.context) throw new Error('No WebGPU canvas context.');
        s.context.configure({device,format,alphaMode:'opaque'});
        s.buffer = device.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
        s.bindGroup = device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:s.buffer}}]});
      }
      const validation = await device.popErrorScope();
      if (validation) throw new Error(validation.message);
      if (stopped) return;
      active = true;
      document.querySelector('#render-status').textContent = 'WebGPU active';
      document.querySelector('#fun-fact').textContent = 'Fun fact: this presentation uses WebGPU too.';
      schedule();
    } catch (error) {fallback(error);}
  }
  spots.forEach(cssSpot);
  init();
})();
