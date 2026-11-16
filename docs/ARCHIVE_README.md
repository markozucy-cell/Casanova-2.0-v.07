# CASANOVA — The Atlantic City (development archive)

Private development repository staging layout for **CASANOVA**, a Casablanca-inspired 2006–2007 open-world game.

## Contents

- `webgpu/`: latest available WebGPU V2 browser prototype and JavaScript engine. Note: the standalone HTML file is >100 MB and therefore **must use Git LFS**.
- `godot/`: latest available Godot V0.7 street infrastructure project, with `godot/project.godot` (earlier Android crash reports remain unresolved).
- `assets/original-glb/`: **67 user-uploaded original GLB models** (unchanged). Total ~1.92 GB.
- `asset_manifest.json`: exact asset inventory and sizes.
- `ASSET_LICENSES.md`: reminder that downloaded source model licenses have not been verified.

## Development status

This repository is a source archive and **not a finished game**. Browser visual quality and Android stability are unverified. WebGPU's rendering requires a supported browser and secure context. Some HTML content was optimized into the file previously, but the original user-supplied GLBs remain untouched under `assets/original-glb`.

## Important GitHub limits

The original models include several files **over 100 MB** and require Git LFS. The `.gitattributes` file marks those. A normal GitHub browser upload will reject oversized files. GitHub LFS storage/bandwidth quotas may apply.

## Content safety and rights

Many 3D models were downloaded from external websites. They are **not automatically licensed for commercial redistribution**. This repository should remain private until licenses have been reviewed. See `ASSET_LICENSES.md`.