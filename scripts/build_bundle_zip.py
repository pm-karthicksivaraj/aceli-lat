#!/usr/bin/env python3
"""
Build the Aceli LAT documentation bundle ZIP.
Includes all available .docx files from sprint folders + budget files + README.
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

# Top-level files to include (look in budget/ subfolder if not in top-level)
TOP_LEVEL_FILES = [
    "Aceli_LAT_Budget_Timeline_Costing.xlsx",
    "Aceli_LAT_Budget_Timeline_Costing.docx",
    "README.md",
]


def main():
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    file_count = 0
    total_size = 0
    summary_lines = []

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        # Top-level files
        for fname in TOP_LEVEL_FILES:
            # Budget docx lives in download/budget/ subfolder, but also copied to top-level
            src = DOWNLOAD_DIR / fname
            if not src.exists():
                src = DOWNLOAD_DIR / "budget" / fname
            if not src.exists():
                print(f"  ! Missing: {fname}")
                continue
            zf.write(src, arcname=fname)
            size = src.stat().st_size
            total_size += size
            file_count += 1
            print(f"  + {fname}  ({size:,} bytes)")

        # Sprint folders — include only .docx files
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

    zip_size = OUTPUT_ZIP.stat().st_size
    print(f"\n{'=' * 60}")
    print(f"Bundle complete: {OUTPUT_ZIP}")
    print(f"  Files in archive : {file_count}")
    print(f"  Uncompressed size: {total_size:,} bytes  ({total_size/1024/1024:.2f} MB)")
    print(f"  Compressed size  : {zip_size:,} bytes  ({zip_size/1024/1024:.2f} MB)")
    print(f"  Compression ratio: {(1 - zip_size/total_size)*100:.1f}%")

    # Verify
    print(f"\nVerifying archive integrity…")
    with zipfile.ZipFile(OUTPUT_ZIP, "r") as zf:
        bad = zf.testzip()
        if bad is None:
            print(f"  ✓ ZIP integrity OK (all {file_count} files readable)")
        else:
            print(f"  ✗ ZIP integrity BAD: {bad}")


if __name__ == "__main__":
    main()
