# CASANOVA — The Atlantic City 🇲🇦

Independent Casablanca-inspired open-world game prototype set in **2006–2007**. Main character: Yassine “YSL” Sbai Lahlou.

> **WORK IN PROGRESS.** This repository currently contains recoverable development source files, but not the complete game assets. Do not delete your original downloads or project ZIP backups.

## Current contents

- [WebGPU V2 engine source](webgpu/casanova_engine_v2.js) — actual game JavaScript from the WebGPU V2 prototype.
- [WebGPU V2 source HTML](webgpu/CASANOVA_V2_SOURCE_NO_EMBEDDED_GLBS.html) — has user interface and original map images, but the 19 bundled GLBs were stripped to keep the file under GitHub’s normal limit. Choose original models through the in-game asset picker.
- [Godot V0.7 project settings](godot/project.godot) and [main scene](godot/scenes/main.tscn) — partial only; other scenes, scripts and assets are still pending.
- [License notes](docs/ASSET_LICENSES.md) and [upload status](docs/UPLOAD_STATUS.md).

## Still missing

- All **67 full-detail original GLBs** (approximately **1.92 GB**), including the 20 building, 19 vehicle, 7 road, and 21 infrastructure models.
- Full standalone WebGPU V2 HTML with embedded models (roughly 116 MB).
- Remaining Godot source scripts, scenes, textures and previews.

These require a supported binary transfer path, and several large files require Git LFS. This repository is **not yet a complete backup**.

## About the project

The map has 18 major locations and one intended continuous city. The prototypes include first-person controls, basic driving, moving traffic and procedural city generation. Visual fidelity, AI, road placement, and mobile performance are still in development.

## Asset licensing

The uploaded models originate from various third-party sources; source licenses were not verified. Keep the repository **private** unless redistribution rights have been confirmed.
