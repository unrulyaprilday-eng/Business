from __future__ import annotations

import shutil
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "B端后台操作手册.docx"
BACKUP_DIR = ROOT / "backups"

REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
DOC_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
ET.register_namespace("", REL_NS)


def collect_used_document_rids(zip_file: zipfile.ZipFile) -> set[str]:
    root = ET.fromstring(zip_file.read("word/document.xml"))
    used: set[str] = set()
    for element in root.iter():
        for attr_name, attr_value in element.attrib.items():
            if attr_name in {f"{{{DOC_REL_NS}}}embed", f"{{{DOC_REL_NS}}}link", f"{{{DOC_REL_NS}}}id"}:
                used.add(attr_value)
    return used


def clean_docx_media() -> tuple[Path, list[str]]:
    if not DOCX.exists():
        raise FileNotFoundError(DOCX)

    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = BACKUP_DIR / f"{DOCX.stem}.clean-unused-media-{stamp}.bak.docx"
    shutil.copy2(DOCX, backup)

    removed_media: list[str] = []
    with zipfile.ZipFile(DOCX, "r") as source:
        used_rids = collect_used_document_rids(source)
        rels_root = ET.fromstring(source.read("word/_rels/document.xml.rels"))

        unused_targets: set[str] = set()
        for rel in list(rels_root):
            rel_id = rel.attrib.get("Id")
            rel_type = rel.attrib.get("Type", "")
            target = rel.attrib.get("Target", "")
            if rel_type.endswith("/image") and target.startswith("media/") and rel_id not in used_rids:
                unused_targets.add("word/" + target)
                rels_root.remove(rel)

        rels_bytes = ET.tostring(rels_root, encoding="utf-8", xml_declaration=True)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx", dir=ROOT) as handle:
            temp_path = Path(handle.name)

        try:
            with zipfile.ZipFile(temp_path, "w", compression=zipfile.ZIP_DEFLATED) as target_zip:
                for item in source.infolist():
                    if item.filename in unused_targets:
                        removed_media.append(item.filename)
                        continue
                    if item.filename == "word/_rels/document.xml.rels":
                        target_zip.writestr(item, rels_bytes)
                        continue
                    target_zip.writestr(item, source.read(item.filename))

            shutil.move(str(temp_path), DOCX)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    return backup, removed_media


if __name__ == "__main__":
    backup_path, removed = clean_docx_media()
    print(f"backup={backup_path}")
    print("removed=" + ",".join(removed))
