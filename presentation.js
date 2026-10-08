/* Navigation is independent of graphics: a GPU failure cannot block the deck. */
(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  let current = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  function show(index, focus = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => { slide.classList.toggle('active', i === current); slide.inert = i !== current; });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.querySelector('#counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    history.replaceState(null, '', `#${current + 1}`);
    if (focus) slides[current].querySelector('h1').focus({preventScroll:true});
    document.dispatchEvent(new Event('slidechange'));
  }
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.matches('input, textarea, select, canvas, [contenteditable], #sample-pixel, #team-demo, #flow-demo')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  window.addEventListener('hashchange', () => show((parseInt(location.hash.slice(1), 10) || 1) - 1));
  document.querySelector('#notes-toggle').addEventListener('click', event => {
    const on = document.body.classList.toggle('show-notes');
    event.currentTarget.setAttribute('aria-pressed', String(on));
  });
  const fullscreen = document.querySelector('#fullscreen');
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else throw new Error('Fullscreen is not supported here.');
    } catch { document.querySelector('#ui-status').textContent = 'Fullscreen unavailable. Use your browser’s fullscreen command.'; }
  });
  document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'; });
  // Interactive teaching diagrams run in HTML/CSS, including on fallback machines.
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const brightness = (distance, radius = 180) => Math.max(0, 1 - distance / radius);
  const mosaic = document.querySelector('.mosaic');
  const tiles = Array.from({length: 96}, () => {
    const tile = document.createElement('i'); mosaic.append(tile); return tile;
  });
  function interactivePosition(element, update) {
    let x = .5, y = .5;
    element.addEventListener('pointermove', event => {
      const r = element.getBoundingClientRect();
      x = clamp((event.clientX-r.left)/r.width,0,1);
      y = clamp((event.clientY-r.top)/r.height,0,1); update(x,y);
    });
    element.addEventListener('pointerdown', event => {
      element.setPointerCapture(event.pointerId);
      const r = element.getBoundingClientRect();
      x = clamp((event.clientX-r.left)/r.width,0,1);
      y = clamp((event.clientY-r.top)/r.height,0,1); update(x,y);
    });
    element.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      x = clamp(x + (event.key==='ArrowRight'?.05:event.key==='ArrowLeft'?-.05:0),0,1);
      y = clamp(y + (event.key==='ArrowDown'?.05:event.key==='ArrowUp'?-.05:0),0,1); update(x,y);
    });
    update(x,y);
  }
  interactivePosition(document.querySelector('#team-demo'), (x,y) => {
    document.querySelector('#mouse-readout').textContent = `Mouse · ${Math.round(x*100)}%, ${Math.round(y*100)}%`;
    tiles.forEach((tile,i) => {
      const d = Math.hypot((i%16+.5)/16-x,(Math.floor(i/16)+.5)/6-y);
      tile.style.opacity = String(.12 + .88*brightness(d,.65));
    });
  });
  interactivePosition(document.querySelector('#flow-demo'), (x,y) => {
    document.querySelector('#flow-readout').textContent = `${Math.round(x*100)}%, ${Math.round(y*100)}%`;
    const image = document.querySelector('.flow-image');
    image.style.setProperty('--fx',`${x*100}%`);image.style.setProperty('--fy',`${y*100}%`);
  });
  const sample = document.querySelector('#sample-pixel');
  const world = document.querySelector('.diagram-world');
  let sampleX=240, sampleY=270, dragging=false, highlightTimer;
  function updateSample(highlight=true) {
    const dx=sampleX-240, dy=sampleY-180, d=Math.hypot(dx,dy), b=brightness(d);
    sample.style.left=`${sampleX}px`;sample.style.top=`${sampleY}px`;
    sample.style.background=`rgb(${8+48*b},${14+128*b},${26+229*b})`;
    document.querySelector('.distance-line').style.width=`${d}px`;
    document.querySelector('.distance-line').style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
    document.querySelector('#distance-value').value=`${Math.round(d)} px`;
    document.querySelector('#brightness-value').value=b.toFixed(2);
    sample.setAttribute('aria-label',`Sample pixel: distance ${Math.round(d)} pixels, brightness ${b.toFixed(2)}. Arrow keys move; Home centres; End moves to edge.`);
    if (highlight) {
      clearTimeout(highlightTimer);
      document.querySelector('#distance-code').classList.add('code-lit');
      document.querySelector('#brightness-code').classList.add('code-lit');
      highlightTimer=setTimeout(()=>document.querySelectorAll('.code-lit').forEach(el=>el.classList.remove('code-lit')),700);
    }
  }
  function dragSample(event) {
    const r=world.getBoundingClientRect();
    sampleX=clamp((event.clientX-r.left)*480/r.width,10,470);
    sampleY=clamp((event.clientY-r.top)*360/r.height,10,350);updateSample();
  }
  sample.addEventListener('pointerdown', event=>{dragging=true;sample.setPointerCapture(event.pointerId);event.preventDefault();});
  sample.addEventListener('pointermove', event=>{if(dragging)dragSample(event);});
  sample.addEventListener('pointerup',()=>{dragging=false;});
  sample.addEventListener('pointercancel',()=>{dragging=false;});
  sample.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    if(event.key==='Home'){sampleX=240;sampleY=180;}
    else if(event.key==='End'){sampleX=420;sampleY=180;}
    else {sampleX=clamp(sampleX+(event.key==='ArrowRight'?10:event.key==='ArrowLeft'?-10:0),10,470);sampleY=clamp(sampleY+(event.key==='ArrowDown'?10:event.key==='ArrowUp'?-10:0),10,350);}
    updateSample();
  });
  updateSample(false);
  // Inert excludes hidden slides from keyboard navigation, but all print normally.
  window.addEventListener('beforeprint', () => slides.forEach(slide => {slide.inert = false;}));
  window.addEventListener('afterprint', () => show(current, false));
  document.body.classList.add('ready');
  show(current, false);
})();
