# CASANOVA GitHub upload status (2026-11-16)

**Repository visibility:** private.

## Confirmed on the main branch
- WebGPU V2 engine source and browser source without embedded GLBs
- Godot V0.7 project configuration, main and city scenes, menu and player controller
- Documentation and asset license warning
- Git LFS configuration
- `.github/workflows/import-original-glbs.yml`: automatic verified import from GitHub Release
- `docs/IMPORT_67_GLBS_FROM_RELEASE.md`: phone upload directions

## Original model files
- **67 of 67 original GLBs located and SHA256 verified in the ChatGPT working files**
- **67 of 67 included across six ZIP_STORED release packs in the current chat**
- **0 of 67 GLBs in this repository currently** (until a GitHub Release with the six packs is published and the workflow completes)
- Model total: 1,920,099,248 original bytes (~1.92 GB); 20 buildings, 19 vehicles, 7 roads, 21 infrastructure

## To complete
Upload the six `CASANOVA_ASSETS_*.zip` packs to a GitHub Release named `casanova-originals-67` and publish it. The workflow then extracts, verifies original SHA256 hashes, and commits actual GLBs through Git LFS. Check the Actions run and `assets/original-glb/` tree before declaring completion.

**Keep the user's original local assets until a verified successful GitHub Actions run.** Large original files cannot be transferred directly using the available GitHub connector. The Godot project also still has dependencies that are not all migrated.
