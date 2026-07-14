from pathlib import Path

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
DOCX = next(ROOT.glob("*.docx"))
OUT = ROOT / "custom" / "assets" / "manual-ad-management"
OUT.mkdir(parents=True, exist_ok=True)

document = Document(DOCX)
targets = {
    "广告消耗数据": "ad-consumption",
    "投放数据报表": "delivery-report",
    "渠道报表": "channel-report",
    "渠道报表明细": "channel-report-detail",
}
current = None
counters = {key: 0 for key in targets.values()}
for paragraph in document.paragraphs:
    title = paragraph.text.strip()
    if paragraph.style.name == "Heading 2" and title in targets:
        current = targets[title]
        continue
    if paragraph.style.name == "Heading 1":
        current = None
    if not current:
        continue
    drawings = paragraph._p.xpath(".//w:drawing")
    for drawing in drawings:
        blips = drawing.xpath(".//a:blip")
        if not blips:
            continue
        embed = blips[0].get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
        if not embed:
            continue
        image_part = document.part.related_parts[embed]
        counters[current] += 1
        output = OUT / f"{current}-{counters[current]}.png"
        output.write_bytes(image_part.blob)
        print(output)
