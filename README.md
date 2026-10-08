# WebGPU: a spotlight, one pixel at a time

A seven-slide, roughly five-minute presentation. No framework, build step, external font, CDN, login, or viewer installation. All graphics, text, and notes are included.

## Open and preview

1. Extract the ZIP first. Keep all six files together.
2. Open `index.html` in a browser for a quick preview. Local-file WebGPU support varies; the CSS spotlight is available if WebGPU cannot start.
3. For a reliable development preview, use an existing local static server. If Python is already installed, open a terminal in this folder and run:

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

4. Open http://localhost:8000. Localhost is treated as a secure context by supporting browsers. This server is optional for authors; viewers of the HTTPS version need only a browser. Stop the server with Ctrl+C.

## Publish on GitHub Pages

1. Create a GitHub repository, for example `webgpu-presentation`. A public repository supports Pages on GitHub Free.
2. Upload the **contents** of this folder to the root of the repository: `index.html`, `styles.css`, `presentation.js`, `graphics.js`, `README.md`, and `.nojekyll`. Do not upload only the ZIP. `index.html` must be at the root, not inside an extra `webgpu-presentation` folder.
3. Commit the files to `main`. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, then **main** and **/(root)**. Save.
5. Wait for deployment to finish. Use **Visit site** in Pages settings. A project site's address is normally `https://YOUR-USERNAME.github.io/webgpu-presentation/`.
6. Open that HTTPS URL on the teacher's computer. Confirm that all seven slides load, then try the demo and the fallback URL: `https://YOUR-USERNAME.github.io/webgpu-presentation/?fallback=1#6`.

No build command, package installation, API key, or server-side code is needed. All asset paths are relative, so repository subpaths work. The empty `.nojekyll` file disables Jekyll processing; it may be hidden by your file manager. If needed, create it with GitHub's **Add file → Create new file**.

Official instructions: [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

You can also upload these files together to any HTTPS static web host. Ordinary HTTP on a lab network may disable WebGPU. Browser viewers need no login or installation. The presentation is ready for a public GitHub repository and GitHub Pages. See the repository status supplied with the deliverable.

## Lab-computer check

Do this on the actual teacher computer before presenting:

- Open the HTTPS link in a current browser with WebGPU support for that operating system and GPU. Check the top-right status: **WebGPU active** confirms successful initialization. Browser name alone does not guarantee compatibility.
- Move the pointer across slide 1. On slide 6, try the radius, all three colours, and Reset. A touch drag also moves the spotlight.
- Test the projector resolution and fullscreen. Confirm you can read the slide text from the back of the room.
- If the status says **WebGPU unavailable — showing a fallback.**, the presentation remains usable with its interactive CSS spotlight. The fun-fact line changes accordingly. Managed browser settings, GPU drivers, browser support, or device failure may prevent WebGPU.
- To rehearse fallback deliberately, append `?fallback=1` before any slide fragment, for example `index.html?fallback=1#6`. Remove it to try WebGPU again. Reload after recovering from device loss.

MDN documents WebGPU's secure-context requirement and compatibility limitations: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API

## Present, practise, and print

- Previous / Next or Left / Right arrows change slides. The first and last buttons stop at the deck boundaries. `#1` through `#7` link to individual slides.
- Speaker notes toggles the notes under the current slide. Notes are visible on the same screen, so hide them before projecting. Each slide includes a suggested timing; total: five minutes.
- Fullscreen enters or exits browser fullscreen when available. Escape also exits. If unavailable, use the browser's own fullscreen command.
- The radius slider supports keyboard arrows, Home, and End without changing slides. Tab to either spotlight canvas and use arrow keys to move the light. Touch and pointer movement use the same coordinate mapping.
- Slides 3 and 4 respond to pointer movement or arrow keys when their diagrams are focused. These are illustrative HTML/CSS diagrams, not hardware benchmarks.
- On slide 5, drag the outlined pixel or focus it and use arrow keys. Home places it at the mouse (brightness 1.00); End puts it at the 180-pixel edge (0.00). The diagram scales to fit the screen; displayed distance uses its logical pixel coordinates.
- The spotlight follows input immediately. Slide entry reveals are brief; reduced-motion settings remove them.
- Print with Ctrl+P (Windows/Linux) or Cmd+P (macOS), then choose Save as PDF. Use A4 landscape, default scale, disable browser headers/footers, and enable background graphics. The print stylesheet shows **all seven slides and their notes**, regardless of the notes toggle. Inspect the preview for seven pages before saving. The spotlight prints as a static CSS image; the PDF is not interactive.

## Submit to Moodle

Submit `webgpu-presentation.zip` containing:

- `index.html` — all seven slides and notes
- `styles.css` — screen, responsive, and print layouts
- `presentation.js` — navigation, notes, fullscreen, and mosaic
- `graphics.js` — WebGPU/WGSL, input handling, and fallback
- `README.md` — these instructions and validation details
- `.nojekyll` — GitHub Pages static-site marker

If the assignment expects individual files, submit all six. If it expects a URL, submit the HTTPS hosting URL as instructed by your teacher. A Moodle attachment preview may restrict scripts; download and extract the ZIP or use the HTTPS site. A PDF can be a supplementary handout, but keep the HTML files for the interactive demo.

## Why the extra CPU slide?

Slide 2 explains that the CPU can do the job. The GPU is a suitable choice for a large amount of repeated per-pixel work. The 1080p/60 fps example is arithmetic (1920 × 1080 × 60 = 124,416,000), not a benchmark or performance promise. Notes also explain that a simple CSS spotlight is practical and may use browser GPU acceleration.

## Implementation notes

The CPU reads input and sends pixel positions, colour, and radius to a fragment shader. A single triangle covers each WebGPU canvas. The shader applies linear distance-based brightness. The slide 5 example uses a fixed 180-pixel radius; the live shader uses the slider's value. Radius is measured in CSS pixels and converted to backing pixels for the device pixel ratio (capped at 2x and the GPU texture limit).

One device renders both spotlight canvases and the restrained animated background. Only the active slide's spotlight draws, and only after an input or layout change. Rendering pauses while the page is hidden. Reduced-motion preference freezes the ambient animation but keeps input responsive. Navigation has no dependency on WebGPU. Missing APIs, a null adapter, initialization errors, uncaptured GPU errors, and device loss switch to CSS and update both status messages.

## Validation performed

The redesigned deck was checked locally in the Codex in-app browser. Safari also initialized WebGPU successfully.

- Live WebGPU spotlight and background rendered with no browser warning/error logs observed.
- The original six-slide redesign was reviewed at 1366 × 768 and checked for page overflow at 1920 × 1080 (none). The added CPU-workload slide and updated seven-slide navigation were checked separately. Narrow layouts checked at 390 × 844; tall explanatory slides scroll normally on phones.
- Navigation, counters, end buttons, notes toggle, fullscreen, keyboard controls, pointer movement, radius endpoints, all colours, and Reset checked.
- CPU mosaic and shader-flow position updates checked. Sample pixel checked at centre (1.00), 180-pixel edge (0.00), and beyond the edge (0.00).
- Forced CSS fallback checked in the browser, including interactive diagram, colour/radius controls, navigation, exact fallback status, and revised fun fact.
- Isolated Node lifecycle tests simulated missing WebGPU, null adapter, adapter rejection, device rejection, pipeline failure, validation failure, device loss, and uncaptured errors. All switched to fallback and retained demo controls. Mocked reduced-motion and hidden-page tests confirmed rendering scheduling stops and resumes as intended. These tests simulate failures; they do not induce hardware loss.
- Both JavaScript files passed syntax checks. All local script/style references exist and use relative paths for GitHub Pages project URLs.
- Safari exported the revised seven-page A4 landscape handout. All seven pages contain notes, and the added slide was visually checked in the PDF.

Still requires a short check on the actual teacher computer. Physical touchscreen hardware, real GPU loss, and a deployed GitHub Pages HTTPS URL were not available for verification. Native WebGPU cannot be guaranteed on every browser/GPU; the complete lesson and interactive CSS diagrams remain available in fallback mode.
