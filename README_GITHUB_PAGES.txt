SOFT WEEK FILE TOOLBOX — GitHub Pages V1

This package is the GitHub Pages-ready starting point for the Toolbox.

IMPORTANT:
The HTML contains COOP/COEP meta tags, but GitHub Pages response headers
cannot be changed by HTML meta tags alone. Therefore these tags do NOT by
themselves enable SharedArrayBuffer on GitHub Pages.

The current index.html keeps the proven FFmpeg single-thread engine and the
existing Text to PDF and Image Converter untouched. It is ready to upload
as the basis for the hosted version.

To actually enable FFmpeg multi-threading, the hosted origin must return:
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp

If the browser reports crossOriginIsolated=false, FFmpeg must use the
single-thread fallback.

The next step is to add a service-worker/header strategy compatible with
GitHub Pages, then switch to @ffmpeg/core-mt only when isolation is active.
