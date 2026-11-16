# Upload all 67 original CASANOVA GLBs to this private repository

The original 67 GLBs total 1,920,099,248 bytes. Their uploaded source models are preserved exactly, not re-encoded or mesh-compressed. These are six **ZIP_STORED** packages; ZIP is only a container.

## From a phone

1. Download these **six** ready-made CASANOVA_ASSETS ZIPs from the ChatGPT conversation:
   - CASANOVA_ASSETS_01_BUILDINGS_CORE.zip (18 GLBs)
   - CASANOVA_ASSETS_02_BALI_VILLA.zip (1 GLB)
   - CASANOVA_ASSETS_03_TUSCAN_VILLA.zip (1 GLB)
   - CASANOVA_ASSETS_04_VEHICLES.zip (19 GLBs)
   - CASANOVA_ASSETS_05_ROADS.zip (7 GLBs)
   - CASANOVA_ASSETS_06_INFRASTRUCTURE.zip (21 GLBs)
2. On GitHub.com in Chrome, enable **Desktop site** if needed and open this private repo's **Releases → Draft a new release**.
3. Use the **new tag** `casanova-originals-67`, targeting `main`. Enter a release title (e.g. `Original 67 CASANOVA assets`).
4. Attach **all six ZIPs** as binary release assets, let them finish uploading, then **Publish release**.
5. The `Import CASANOVA's 67 original GLBs` GitHub Actions workflow should run. If it does not, open **Actions**, choose the workflow, select **Run workflow**, and enter release tag `casanova-originals-67`.
6. After it succeeds, the actual original models will appear under `assets/original-glb/` as Git LFS objects with their original SHA-256 hashes. The ZIPs remain as release assets.

Do not mark the transfer complete if any release ZIP is missing, or if the action fails. Check its logs.

GitHub normal web file uploads cannot accept hundreds-of-megabyte GLBs, but release assets accept files under 2 GiB; Git LFS handles the unpacked original models.

**Privacy:** Keep the repository private until all third-party model redistribution rights are reviewed. GitHub Actions may require **Settings → Actions → General → Workflow permissions → Read and write permissions** if the final push is refused.

**Current status:** The ZIPs have been created and verified in the conversation. Until the release is uploaded and GitHub Actions succeeds, the 67 GLBs are **NOT on GitHub**.
