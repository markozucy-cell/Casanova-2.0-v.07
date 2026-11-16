# CASANOVA GitHub upload status — 16 November 2026

**Repository:** private — `markozucy-cell/Casanova-2.0-v.07`

## All 67 original 3D models: UPLOADED AND VERIFIED

- **67 of 67 original GLB files** now tracked as Git LFS objects under `assets/original-glb/`.
- Unmodified original model bytes: **1,920,099,248** bytes (approximately 1.92 GB).
- Asset categories: **20 buildings, 19 vehicles, 7 roads, 21 infrastructure**.
- `assets/ASSET_MANIFEST.json` and `assets/ORIGINAL_SHA256SUMS.txt` are committed alongside the models.
- All **six losslessly packaged source ZIPs** remain preserved in GitHub Release `casanova-originals-67`.
- GitHub Actions run [43827010052](https://github.com/markozucy-cell/Casanova-2.0-v.07/actions/runs/43827010052) **succeeded**: downloaded all six packs, verified all 67 original SHA-256 hashes, and imported them through Git LFS.
- Model commit: [a85529da215afc8380399a7a17125b37a08734bc](https://github.com/markozucy-cell/Casanova-2.0-v.07/commit/a85529da215afc8380399a7a17125b37a08734bc).
- Independently verified GitHub main tree contains **67 GLB paths** and manifest reports `file_count=67` and `total_original_bytes=1920099248`. Sample LFS pointer SHA matched the manifest.

## How to retrieve the real binary models

GitHub's normal Git repository stores small **LFS pointer files**; actual original GLB bytes live in the Git LFS object store. With a Git LFS-capable client:

```bash
git lfs install
git clone https://github.com/markozucy-cell/Casanova-2.0-v.07.git
cd Casanova-2.0-v.07
git lfs pull
```

An ordinary Git-only ZIP download may contain pointers instead of full GLB bytes. The six GitHub Release packs are an alternative original-asset backup.

## Current project limitations

- WebGPU V2 engine/browser source is committed; the huge all-in-one standalone HTML is not part of the ordinary source tree.
- Godot V0.7 has selected project files committed but some scripts/scenes and runtime dependencies are still missing.
- **All 67 original models are backed up; this does NOT mean the game is complete or all models are integrated into a playable build.**
- Redistribution licenses for third-party assets have not yet been checked; keep the repository private.
