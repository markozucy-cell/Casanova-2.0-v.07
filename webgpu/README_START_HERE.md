# CASANOVA — WebGPU V2 / Original-Asset City

## What's inside

This is a **browser prototype**, not a finished GTA-scale game. One continuous concept-map-based world with a 12.3 km approximate east–west span, 18 map destinations, streamed street cells, first-person movement, basic driving and NPC routes.

**All 67 GLB files that the user uploaded** are catalogued in `asset_catalog.json`: 20 building, 19 vehicle, 7 road, 21 street-infrastructure files. SHA-256 checksums refer to the ORIGINAL files.

The standalone HTML embeds **19 original, unmodified GLB files**, plus source road texture images at their original pixel dimensions. Additional GLBs are **NOT** silently included: they can be chosen from the phone via the **67 MODELS** panel. This is important for large files, including two villas exceeding 400 MB each.

The 67 catalogued files are NOT all imported simultaneously. The browser deliberately loads nearby available originals, one at a time. The model file is not decimated or texture-downscaled. The game does apply a **world-space instance scale** so that cars, houses and landmarks have plausible relative sizes, since the source files were exported in wildly inconsistent units. These are curated estimates, NOT surveyed 1:1 dimensions of real Casablanca.

## Play on a Redmi Note 12 4G

1. Download `CASANOVA_WEBGPU_V2_PLAY.html` and open it in Chrome on your phone (not inside a chat preview).
2. Tap **ENTER CASANOVA**. The 19 embedded GLBs are available in the standalone HTML; initial startup loads only a smaller number for safety, then additional nearby models stream in.
3. Tap **67 MODELS** at the top and **SELECT GLB / ZIP FILES**. Pick original `.glb` files that you previously downloaded, or any of the original-asset ZIP packs supplied alongside this project. You can select multiple files.
4. Tap **CLOSE** and move around. Models from available original files appear in geographically planned positions as you approach their districts. You can tap a model's LOAD / GO TO control to try it individually; giant models show a warning first.
5. Use the left touch stick to walk, swipe the right half to look around, and use MAP / DRIVE buttons. ECO can reduce rendering workload without altering GLB file contents.

ZIP import supports **ZIP_STORED** (uncompressed ZIP members). Original model ZIP files can remain zipped; you do not need to extract them first. The browser reads only the selected model from the ZIP.

## What actually changed

- One approximate 12.3-km-scale 3D world, not separate neighborhood scenes. Based on the user's illustrated map, NOT GIS street data.
- 233 explicit original-building placements across district territories, not just around the district labels. There are also 246 planned parked-vehicle placements and 214 planned infrastructure placements.
- Every selected GLB is normalized using per-asset physical length/height, not arbitrary `scale = 1`.
- Orientation fixes for car models whose length axis is X instead of Z.
- Imported-building collisions based on visible approximate footprints; fallback buildings stop short of the curb, allowing road access.
- Original uploaded road materials at their source pixel dimensions used for different road classes; source road meshes themselves are included only if selected into the asset library, because some are full-road-scene meshes with incompatible scale.
- Moving traffic and first-person driving from the previous build retained and tested; period-incompatible cars (2009 Logan, post-2007 Sandero, Duster and electric Berlingo) are available for asset inspection, not placed in 2006 traffic.
- Asset library allows loading the original files from the user’s phone, including their two giant villas, rather than decimating them.

## Tests and limits

- JavaScript parse check: PASS.
- Simulated world movement: all 18 destinations spawned on land outside initial building collision: PASS.
- Simulation driving: starter vehicle traveled ~98.8 metres in 6.4 simulated seconds without colliding, speed ~64.8 km/h at end: PASS.
- Input ZIP import / raw byte reader: PASS using a small ZIP_STORED test pack with three originals.
- Ten original GLBs: parsed successfully by the game loader in a synthetic renderer test.
- SHA-256 hashes: all 67 original source files recorded; no mesh decimation applied to source files.
- **Live Android/WebGPU display, frame rate, lighting and crash-free operation: NOT VERIFIED.** The available automated browser is blocked from testing local WebGPU rendering. No claim of a fully complete AAA city or advanced rigid-body AI is being made.

## Important practical limits

- Storage is not GPU RAM. An uncompressed 400-MB villa may expand to hundreds of MB of geometry and textures, plus temporary copies; tapping LOAD for such a model can cause a crash even if the phone has free storage.
- Imported assets from external websites have **unverified reuse licenses**, so this build should remain private testing until creator pages/licenses are checked.
- Street shapes are approximations of the uploaded concept map. Many backstreets and interiors are procedurally generated or missing.
- Complex road intersections, rich NPC AI, full traffic navigation, realistic shadows, suspension and car crashes are still prototype-grade, not production-quality.