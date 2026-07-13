from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "custom" / "assets" / "manual-share-pages"
TARGETS = {
    "\u5206\u4eab\u914d\u7f6e": [
        "share-config-overview",
        "share-config-edit-modal",
    ],
    "\u5206\u4eab\u5361\u7247\u7ba1\u7406": [
        "share-card-list",
        "share-card-edit-modal",
    ],
}


def image_parts(paragraph):
    for blip in paragraph._element.xpath(".//a:blip"):
        relationship_id = blip.get(qn("r:embed"))
        if not relationship_id:
            continue
        part = paragraph.part.related_parts.get(relationship_id)
        if part is not None:
            yield part


def main():
    document_path = next(ROOT.glob("*.docx"))
    document = Document(document_path)
    OUTPUT.mkdir(parents=True, exist_ok=True)

    extracted = []
    paragraphs = document.paragraphs
    for index, paragraph in enumerate(paragraphs):
        title = paragraph.text.strip()
        if title not in TARGETS:
            continue
        names = TARGETS[title]
        parts = []
        for following in paragraphs[index + 1 :]:
            if following.style.name in {"Heading 1", "Heading 2"}:
                break
            parts.extend(image_parts(following))
        if len(parts) != len(names):
            raise RuntimeError(
                f"{title}: expected {len(names)} images, found {len(parts)}"
            )
        for name, part in zip(names, parts):
            suffix = Path(str(part.partname)).suffix.lower() or ".png"
            output_path = OUTPUT / f"{name}{suffix}"
            output_path.write_bytes(part.blob)
            extracted.append(output_path)

    if len(extracted) != sum(map(len, TARGETS.values())):
        raise RuntimeError(f"expected 4 extracted images, found {len(extracted)}")
    for path in extracted:
        print(path.relative_to(ROOT), path.stat().st_size)


if __name__ == "__main__":
    main()
