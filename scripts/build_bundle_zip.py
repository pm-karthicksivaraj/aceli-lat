#!/usr/bin/env python3
"""
Build the Aceli LAT complete documentation bundle ZIP.

Includes:
  - Aceli_LAT_Budget_Timeline_Costing.xlsx  (top-level)
  - Aceli_LAT_Budget_Timeline_Costing.docx  (top-level)
  - README.md                                (top-level manifest)
  - Sprint0_Mobilization/*.docx
  - Sprint1_Discovery/*.docx
  - Sprint2_Architecture/*.docx
  - Sprint3_Foundation/*.docx
  - Sprint4_Capture_AI/*.docx
  - Sprint5_Review_Sync/*.docx
  - Sprint7_Rollout/*.docx
"""

import os
import zipfile
from pathlib import Path

DOWNLOAD_DIR = Path("/home/z/my-project/download")
OUTPUT_ZIP = DOWNLOAD_DIR / "Aceli_LAT_Complete_Documentation_Bundle.zip"

# Sprint folder mapping: source folder -> archive folder name
SPRINT_FOLDERS = [
    ("sprint0", "Sprint0_Mobilization"),
    ("sprint1", "Sprint1_Discovery"),
    ("sprint2", "Sprint2_Architecture"),
    ("sprint3", "Sprint3_Foundation"),
    ("sprint4", "Sprint4_Capture_AI"),
    ("sprint5", "Sprint5_Review_Sync"),
    ("sprint7", "Sprint7_Rollout"),
]

# Top-level files to include
TOP_LEVEL_FILES = [
    "Aceli_LAT_Budget_Timeline_Costing.xlsx",
    "Aceli_LAT_Budget_Timeline_Costing.docx",
    "README.md",
]


def main():
    # Remove old zip if exists
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        # Top-level files
        for fname in TOP_LEVEL_FILES:
            # Budget docx lives in download/budget/ subfolder
            if fname == "Aceli_LAT_Budget_Timeline_Costing.docx":
                src = DOWNLOAD_DIR / "budget" / fname
            else:
                src = DOWNLOAD_DIR / fname
            if not src.exists():
                print(f"  ! Missing: {src}")
                continue
            zf.write(src, arcname=fname)
            size = src.stat().st_size
            total_size += size
            file_count += 1
            print(f"  + {fname}  ({size:,} bytes)")

        # Sprint folders — include only .docx files (exclude .js generators)
        for src_folder, archive_folder in SPRINT_FOLDERS:
            src_dir = DOWNLOAD_DIR / src_folder
            if not src_dir.exists():
                print(f"  ! Missing sprint folder: {src_dir}")
                continue

            docx_files = sorted(src_dir.glob("*.docx"))
            print(f"\n  [{archive_folder}]  {len(docx_files)} .docx files")
            for docx in docx_files:
                arcname = f"{archive_folder}/{docx.name}"
                zf.write(docx, arcname=arcname)
                size = docx.stat().st_size
                total_size += size
                file_count += 1
                print(f"    + {docx.name}  ({size:,} bytes)")

    # Stats
    zip_size = OUTPUT_ZIP.stat().st_size
    print(f"\n{'=' * 60}")
    print(f"Bundle complete: {OUTPUT_ZIP}")
    print(f"  Files in archive : {file_count}")
    print(f"  Uncompressed size: {total_size:,} bytes  ({total_size/1024/1024:.2f} MB)")
    print(f"  Compressed size  : {zip_size:,} bytes  ({zip_size/1024/1024:.2f} MB)")
    print(f"  Compression ratio: {(1 - zip_size/total_size)*100:.1f}%")

    # Verify by listing contents
    print(f"\nArchive contents:")
    with zipfile.ZipFile(OUTPUT_ZIP, "r") as zf:
        for info in zf.infolist():
            print(f"  {info.file_size:>9,}  {info.filename}")


if __name__ == "__main__":
    main()
