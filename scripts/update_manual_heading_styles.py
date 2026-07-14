from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.text import WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "\u0042\u7aef\u540e\u53f0\u64cd\u4f5c\u624b\u518c.docx"
BACKUP_DIR = ROOT / "backups"

FONT_NAME = "\u5fae\u8f6f\u96c5\u9ed1"

HEADING_STYLE = {
    "Heading 1": {
        "size": 15,
        "color": "254061",
        "before": 18,
        "after": 12,
        "line": 1.15,
        "bold": True,
    },
    "Heading 2": {
        "size": 12.5,
        "color": "2F5597",
        "before": 12,
        "after": 7,
        "line": 1.12,
        "bold": True,
    },
    "Heading 3": {
        "size": 10.5,
        "color": "2F5597",
        "before": 9,
        "after": 5,
        "line": 1.08,
        "bold": True,
    },
    "Heading 4": {
        "size": 10.5,
        "color": "2F5597",
        "before": 6,
        "after": 3,
        "line": 1.05,
        "bold": True,
    },
}


def set_style_font(style, *, size: float, color: str, bold: bool) -> None:
    font = style.font
    font.name = FONT_NAME
    font.size = Pt(size)
    font.bold = bold
    font.color.rgb = RGBColor.from_string(color)

    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:eastAsia"), FONT_NAME)
    rfonts.set(qn("w:ascii"), FONT_NAME)
    rfonts.set(qn("w:hAnsi"), FONT_NAME)


def clear_paragraph_direct_run_format(paragraph, spec: dict[str, object]) -> None:
    for run in paragraph.runs:
        run.font.name = FONT_NAME
        run.font.size = Pt(float(spec["size"]))
        run.font.bold = bool(spec["bold"])
        run.font.italic = False
        run.font.color.rgb = RGBColor.from_string(str(spec["color"]))

        rpr = run._element.get_or_add_rPr()
        rfonts = rpr.rFonts
        if rfonts is None:
            rfonts = OxmlElement("w:rFonts")
            rpr.append(rfonts)
        rfonts.set(qn("w:eastAsia"), FONT_NAME)
        rfonts.set(qn("w:ascii"), FONT_NAME)
        rfonts.set(qn("w:hAnsi"), FONT_NAME)


def apply_heading_paragraph_format(paragraph, spec: dict[str, object]) -> None:
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(float(spec["before"]))
    fmt.space_after = Pt(float(spec["after"]))
    fmt.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    fmt.line_spacing = float(spec["line"])
    fmt.keep_with_next = True


def set_body_run_font(run, *, size: float) -> None:
    run.font.name = FONT_NAME
    run.font.size = Pt(size)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:eastAsia"), FONT_NAME)
    rfonts.set(qn("w:ascii"), FONT_NAME)
    rfonts.set(qn("w:hAnsi"), FONT_NAME)


def format_body_paragraph(paragraph) -> None:
    if paragraph._element.xpath(".//w:drawing"):
        return
    style_name = paragraph.style.name
    text = paragraph.text.strip()
    is_caption_text = (
        len(text) > 1
        and text[0] in {"图", "圖"}
        and (text[1].isdigit() or text[1] in {"：", ":"})
    )
    if style_name == "Normal" and is_caption_text:
        paragraph.style = "Caption"
        style_name = "Caption"
    if style_name not in {"Normal", "List Bullet", "List Number", "Caption"}:
        return
    if text == "\u5546\u6237\u540e\u53f0\u64cd\u4f5c\u624b\u518c":
        return

    size = 9 if style_name == "Caption" else 10
    for run in paragraph.runs:
        set_body_run_font(run, size=size)
        if style_name == "Caption":
            run.font.bold = False
            run.font.color.rgb = RGBColor.from_string("707E92")

    fmt = paragraph.paragraph_format
    fmt.space_after = Pt(6 if style_name == "Caption" else 3)
    fmt.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    fmt.line_spacing = 1.15


def main() -> None:
    if not DOCX.exists():
        raise FileNotFoundError(DOCX)

    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = BACKUP_DIR / f"{DOCX.stem}.format-style-backup.{stamp}.docx"
    shutil.copy2(DOCX, backup)

    document = Document(DOCX)

    for style_name, spec in HEADING_STYLE.items():
        style = document.styles[style_name]
        set_style_font(
            style,
            size=float(spec["size"]),
            color=str(spec["color"]),
            bold=bool(spec["bold"]),
        )
        para_format = style.paragraph_format
        para_format.space_before = Pt(float(spec["before"]))
        para_format.space_after = Pt(float(spec["after"]))
        para_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        para_format.line_spacing = float(spec["line"])
        para_format.keep_with_next = True

    counts = {name: 0 for name in HEADING_STYLE}
    body_counts = {name: 0 for name in ("Normal", "List Bullet", "List Number", "Caption")}
    for paragraph in document.paragraphs:
        style_name = paragraph.style.name
        if style_name in HEADING_STYLE:
            spec = HEADING_STYLE[style_name]
            counts[style_name] += 1
            apply_heading_paragraph_format(paragraph, spec)
            clear_paragraph_direct_run_format(paragraph, spec)
            continue
        format_body_paragraph(paragraph)
        normalized_style = paragraph.style.name
        if normalized_style in body_counts:
            body_counts[normalized_style] += 1

    document.save(DOCX)

    print(f"backup={backup}")
    print("counts=" + ",".join(f"{name}:{counts[name]}" for name in sorted(counts)))
    print("body_counts=" + ",".join(f"{name}:{body_counts[name]}" for name in sorted(body_counts)))


if __name__ == "__main__":
    main()
