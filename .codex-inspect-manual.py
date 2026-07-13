from pathlib import Path

from docx import Document


TITLE = "".join(map(chr, [0x5151, 0x6362, 0x7801, 0x4E2D, 0x5FC3]))

document_path = next(Path(".").glob("*.docx"))
document = Document(document_path)
paragraphs = document.paragraphs
matches = [index for index, paragraph in enumerate(paragraphs) if paragraph.text.strip() == TITLE]

print(f"document={document_path.name}")
print(f"matches={matches}")

for match in matches:
    start = match
    end = len(paragraphs)
    for index in range(match + 1, len(paragraphs)):
        if paragraphs[index].style.name in {"Heading 1", "Heading 2"}:
            end = index
            break
    for index in range(start, end):
        paragraph = paragraphs[index]
        drawings = len(paragraph._element.xpath(".//w:drawing"))
        print(
            f"{index:04d}\t{paragraph.style.name}\tdraw={drawings}\t"
            f"{paragraph.text.strip()[:240]}"
        )

    section = paragraphs[start:end]
    drawing_count = sum(len(p._element.xpath(".//w:drawing")) for p in section)
    captions = [p.text.strip() for p in section if p.style.name == "Caption"]
    submodules = [p.text.strip() for p in section if p.style.name == "Heading 4"]
    question_marks = sum(p.text.count("?") for p in section)
    print(f"section_range={start}:{end}")
    print(f"heading_style={paragraphs[start].style.name}")
    print(f"drawings={drawing_count}")
    print(f"captions={len(captions)}")
    print(f"submodules={submodules}")
    print(f"question_marks={question_marks}")
    print(f"next={paragraphs[end].style.name}:{paragraphs[end].text.strip()}")
