#!/usr/bin/env python3
"""
Rebuild the Aceli LAT documentation bundle ZIP — Rebid v2.0
============================================================
- Replaces the previous bundle's budget files with the new Rebid v2.0 versions
- Keeps all 64 sprint docs from the previous bundle
- Adds the new Goldstone-vs-Ours comparison workbook
"""
import os
import zipfile
from pathlib import Path

DOWNLOAD_DIR = Path("/home/z/my-project/download")
PREV_BUNDLE_EXTRACT = Path("/tmp/bundle_extract")
OUTPUT_ZIP = DOWNLOAD_DIR / "Aceli_LAT_Complete_Documentation_Bundle.zip"

# Files to take from current download/ (NEW rebid versions)
NEW_TOP_LEVEL_FILES = [
    "Aceli_LAT_Budget_Timeline_Costing.xlsx",       # rebid v2.0
    "Aceli_LAT_Budget_Timeline_Costing.docx",       # rebid v2.0
    "Aceli_LAT_Goldstone_vs_Ours_Comparison.xlsx",  # NEW comparison
    "README.md",
]

# Sprint folders to take from previous bundle extract (unchanged)
SPRINT_FOLDERS = [
    "Sprint0_Mobilization",
    "Sprint1_Discovery",
    "Sprint2_Architecture",
    "Sprint3_Foundation",
    "Sprint4_Capture_AI",
    "Sprint5_Review_Sync",
    "Sprint7_Rollout",
]


def main():
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        # 1. New top-level files (rebid budget xlsx, docx, comparison xlsx, README)
        for fname in NEW_TOP_LEVEL_FILES:
            src = DOWNLOAD_DIR / fname
            if not src.exists():
                print(f"  ! Missing: {fname}")
                continue
            zf.write(src, arcname=fname)
            file_count += 1
            total_size += src.stat().st_size
            print(f"  + {fname}  ({src.stat().st_size:,} bytes)")

        # 2. Sprint folder docs from previous bundle
        for folder in SPRINT_FOLDERS:
            folder_path = PREV_BUNDLE_EXTRACT / folder
            if not folder_path.exists():
                print(f"  ! Missing folder: {folder_path}")
                continue
            for docx_file in sorted(folder_path.glob("*.docx")):
                arcname = f"{folder}/{docx_file.name}"
                zf.write(docx_file, arcname=arcname)
                file_count += 1
                total_size += docx_file.stat().st_size

    print()
    print("=" * 60)
    print(f"Bundle complete: {OUTPUT_ZIP}")
    print(f"  Files in archive : {file_count}")
    print(f"  Uncompressed size: {total_size:,} bytes  ({total_size/1024/1024:.2f} MB)")
    print(f"  Compressed size  : {OUTPUT_ZIP.stat().st_size:,} bytes  ({OUTPUT_ZIP.stat().st_size/1024/1024:.2f} MB)")
    print(f"  Compression ratio: {(1 - OUTPUT_ZIP.stat().st_size/total_size)*100:.1f}%")

    # Verify
    print()
    print("Verifying archive integrity…")
    with zipfile.ZipFile(OUTPUT_ZIP, "r") as zf:
        bad = zf.testzip()
        if bad:
            print(f"  ✗ Corrupt file: {bad}")
        else:
            print(f"  ✓ ZIP integrity OK (all {file_count} files readable)")


if __name__ == "__main__":
    main()
