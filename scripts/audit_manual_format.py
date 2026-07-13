from collections import Counter, defaultdict
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


TARGETS = {
    "\u5206\u4eab\u914d\u7f6e",
    "\u5206\u4eab\u5361\u7247\u7ba1\u7406",
}
HEADING_STYLES = {"Heading 1", "Heading 2", "Heading 3", "Heading 4"}
SECTION_STOP_STYLES = {"Heading 1", "Heading 2"}


def run_signature(run):
    rpr = run._element.rPr
    east_asia = None
    if rpr is not None and rpr.rFonts is not None:
        east_asia = rpr.rFonts.get(qn("w:eastAsia"))
    return (
        run.font.name,
        east_asia,
        run.font.size.pt if run.font.size else None,
        run.bold,
        str(run.font.color.rgb) if run.font.color and run.font.color.rgb else None,
    )


def drawing_relationships(paragraph):
    relationships = []
    for blip in paragraph._element.xpath(".//a:blip"):
        relationship_id = blip.get(qn("r:embed"))
        if not relationship_id:
            continue
        part = paragraph.part.related_parts.get(relationship_id)
        relationships.append(
            (
                relationship_id,
                getattr(part, "partname", None),
                len(part.blob) if part is not None else None,
            )
        )
    return relationships


def main():
    path = next(Path(".").glob("*.docx"))
    document = Document(path)
    paragraphs = document.paragraphs
    print(
        "DOC",
        path.name,
        "paragraphs",
        len(paragraphs),
        "inline_shapes",
        len(document.inline_shapes),
    )

    target_indexes = [
        index
        for index, paragraph in enumerate(paragraphs)
        if paragraph.text.strip() in TARGETS
    ]
    print("TARGETS", target_indexes)
    for start in target_indexes:
        print("---SECTION", start, paragraphs[start].text.strip(), "---")
        for index in range(start, len(paragraphs)):
            paragraph = paragraphs[index]
            if index > start and paragraph.style.name in SECTION_STOP_STYLES:
                break
            drawings = drawing_relationships(paragraph)
            print(
                f"{index:04d}\t{paragraph.style.name}\t"
                f"draw={drawings}\t{paragraph.text.strip()}"
            )

    print("STYLES", Counter(p.style.name for p in paragraphs).most_common())
    signatures = defaultdict(Counter)
    examples = defaultdict(dict)
    for paragraph in paragraphs:
        style = paragraph.style.name
        if style not in HEADING_STYLES | {"Normal", "Caption"}:
            continue
        for run in paragraph.runs:
            if not run.text.strip() or run._element.xpath(".//w:drawing"):
                continue
            signature = run_signature(run)
            signatures[style][signature] += len(run.text.strip())
            examples[style].setdefault(signature, paragraph.text.strip()[:50])

    for style in (
        "Heading 1",
        "Heading 2",
        "Heading 3",
        "Heading 4",
        "Normal",
        "Caption",
    ):
        print("---FORMAT", style, "---")
        for signature, count in signatures[style].most_common(12):
            print(count, signature, examples[style][signature])


if __name__ == "__main__":
    main()
