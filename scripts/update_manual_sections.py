from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.text.paragraph import Paragraph

import extract_chat_images_from_codex_log as chat_images


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOCX = next(ROOT.glob("*.docx"))
BACKUP_DIR = ROOT / "backups"

FONT_NAME = "Microsoft YaHei"
BLUE = RGBColor(47, 85, 151)
CAPTION_GRAY = RGBColor(112, 126, 146)
HEADING_SIZES = {
    "Heading 1": 14,
    "Heading 2": 12.5,
    "Heading 3": 10.5,
    "Heading 4": 10.5,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generic manual updater for B端后台操作手册.docx. "
            "Uses a small JSON config to update one or more Heading 3 sections, "
            "optionally preserve existing media, and optionally extract chat images."
        )
    )
    parser.add_argument("--config", required=True, help="JSON config path")
    parser.add_argument("--docx", help="Optional docx path override")
    parser.add_argument("--dry-run", action="store_true", help="Validate config and section lookup without saving")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_path(value: str | None, base_dir: Path) -> Path | None:
    if value is None:
        return None
    path = Path(value)
    if not path.is_absolute():
        path = (base_dir / path).resolve()
    return path


def set_run(run, *, size: float = 10, bold: bool = False, color: RGBColor | None = None) -> None:
    run.font.name = FONT_NAME
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
    run._element.rPr.rFonts.set(qn("w:ascii"), FONT_NAME)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_NAME)
    run.font.size = Pt(size)
    run.bold = bold
    if color is not None:
        run.font.color.rgb = color


def insert_after(paragraph, style: str | None = None) -> Paragraph:
    new_p = OxmlElement("w:p")
    paragraph._p.addnext(new_p)
    new_para = Paragraph(new_p, paragraph._parent)
    if style:
        new_para.style = style
    return new_para


def delete_paragraph(paragraph) -> None:
    element = paragraph._element
    element.getparent().remove(element)
    paragraph._p = paragraph._element = None


def paragraph_has_drawing(paragraph) -> bool:
    return bool(paragraph._element.xpath(".//w:drawing"))


def paragraph_is_media(paragraph) -> bool:
    if paragraph_has_drawing(paragraph):
        return True
    if paragraph.style and paragraph.style.name == "Caption":
        return True
    text = paragraph.text.strip()
    return text.startswith(("图：", "圖："))


def find_section_range(
    document: Document,
    title: str,
    heading_style: str = "Heading 3",
    stop_styles: list[str] | None = None,
) -> tuple[int, int]:
    start = None
    for index, paragraph in enumerate(document.paragraphs):
        if paragraph.style.name == heading_style and paragraph.text.strip() == title:
            start = index
            break
    if start is None:
        raise RuntimeError(f"section not found: {title}")

    stop_style_set = set(stop_styles or {"Heading 1", "Heading 2", "Heading 3"})
    end = len(document.paragraphs)
    for index in range(start + 1, len(document.paragraphs)):
        if document.paragraphs[index].style.name in stop_style_set:
            end = index
            break
    return start, end


def style_size(style: str, default: float = 10) -> float:
    return float(HEADING_SIZES.get(style, default))


def format_heading_paragraph(paragraph, style: str) -> None:
    for run in paragraph.runs:
        set_run(run, size=style_size(style), bold=True, color=BLUE)


def reset_section(
    document: Document,
    title: str,
    keep_existing_media: bool,
    heading_style: str = "Heading 3",
    stop_styles: list[str] | None = None,
):
    start, end = find_section_range(document, title=title, heading_style=heading_style, stop_styles=stop_styles)
    for paragraph in list(document.paragraphs[start + 1 : end]):
        if keep_existing_media and paragraph_is_media(paragraph):
            continue
        delete_paragraph(paragraph)

    anchor = document.paragraphs[start]
    format_heading_paragraph(anchor, heading_style)
    return anchor


def resolve_keep_existing_media(config: dict[str, Any], section: dict[str, Any]) -> bool:
    if "keep_existing_media" in section:
        return bool(section["keep_existing_media"])
    if "keep_existing_media" in config:
        return bool(config["keep_existing_media"])
    return True


def add_paragraph_after(anchor, text: str, style: str = "Normal"):
    paragraph = insert_after(anchor, style=style)
    run = paragraph.add_run(text)
    set_run(run, size=10)
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.15
    return paragraph


def add_submodule_title_after(anchor, text: str):
    paragraph = insert_after(anchor, style="Heading 4")
    run = paragraph.add_run(text)
    set_run(run, size=10.5, bold=True, color=BLUE)
    run.font.italic = True
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.15
    return paragraph


def add_heading_after(anchor, text: str, style: str):
    paragraph = insert_after(anchor, style=style)
    run = paragraph.add_run(text)
    set_run(run, size=style_size(style), bold=True, color=BLUE)
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.15
    return paragraph


def add_bullet_after(anchor, label: str | None, text: str):
    paragraph = insert_after(anchor, style="List Bullet")
    if label:
        label_run = paragraph.add_run(label)
        set_run(label_run, size=10, bold=True, color=BLUE)
        body_run = paragraph.add_run("：" + text)
        set_run(body_run, size=10)
    else:
        body_run = paragraph.add_run(text)
        set_run(body_run, size=10)
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.15
    return paragraph


def add_picture_after(anchor, image_path: Path, width: float = 6.4):
    paragraph = insert_after(anchor, style="Normal")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.add_run().add_picture(str(image_path), width=Inches(width))
    paragraph.paragraph_format.space_after = Pt(2)
    return paragraph


def add_caption_after(anchor, text: str):
    paragraph = insert_after(anchor, style="Caption")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(text)
    set_run(run, size=9, color=CAPTION_GRAY)
    paragraph.paragraph_format.space_after = Pt(6)
    return paragraph


def materialize_chat_images(task: dict[str, Any], config_dir: Path) -> list[Path]:
    output_dir = resolve_path(task["output_dir"], config_dir)
    assert output_dir is not None
    output_dir.mkdir(parents=True, exist_ok=True)

    if task.get("thread_read_file"):
        _, message, images = chat_images.extract_from_thread_read_file(
            resolve_path(task["thread_read_file"], config_dir),
            message_text=task.get("message_text"),
            message_id=task.get("message_id"),
        )
        source = "thread_read_file"
    else:
        thread_id = task.get("thread_id")
        if not thread_id:
            raise RuntimeError("chat_image task requires thread_read_file or thread_id")
        _, _, message, images = chat_images.locate_from_logs(
            thread_id=thread_id,
            message_text=task.get("message_text"),
            message_id=task.get("message_id"),
            date=task.get("date"),
        )
        source = "local_codex_logs"

    chat_images.validate_count(len(images), task.get("expected_count"))
    prefix = task.get("prefix", "chat")
    written = chat_images.write_images(images, output_dir=output_dir, prefix=prefix)

    rename_to = task.get("rename_to") or []
    if rename_to:
        if len(rename_to) != len(written):
            raise RuntimeError("rename_to count does not match extracted image count")
        renamed: list[Path] = []
        for src, target_name in zip(written, rename_to):
            target = output_dir / target_name
            src.replace(target)
            renamed.append(target)
        written = renamed

    print(f"chat_images source={source} message_id={message.get('id', '')} count={len(written)}")
    for path in written:
        print(path)
    return written


def run_image_tasks(section: dict[str, Any], config_dir: Path) -> None:
    for task in section.get("chat_image_tasks", []):
        materialize_chat_images(task, config_dir=config_dir)


def apply_blocks(anchor, blocks: list[dict[str, Any]], config_dir: Path):
    last = anchor
    for block in blocks:
        block_type = block["type"]
        if block_type == "paragraph":
            last = add_paragraph_after(last, block["text"], style=block.get("style", "Normal"))
            continue
        if block_type == "submodule_title":
            last = add_submodule_title_after(last, block["text"])
            continue
        if block_type == "heading":
            last = add_heading_after(last, block["text"], style=block.get("style", "Heading 3"))
            continue
        if block_type == "bullet":
            last = add_bullet_after(last, block.get("label"), block["text"])
            continue
        if block_type == "image":
            image_path = resolve_path(block["path"], config_dir)
            if image_path is None or not image_path.exists():
                raise FileNotFoundError(image_path)
            last = add_picture_after(last, image_path=image_path, width=float(block.get("width", 6.4)))
            caption = block.get("caption")
            if caption:
                last = add_caption_after(last, caption)
            continue
        if block_type == "module":
            last = add_submodule_title_after(last, block["title"])
            intro = block.get("intro")
            if intro:
                last = add_paragraph_after(last, intro, style=block.get("intro_style", "Normal"))
            if block.get("pre_blocks"):
                last = apply_blocks(last, block.get("pre_blocks", []), config_dir=config_dir)
            image_path = resolve_path(block["path"], config_dir)
            if image_path is None or not image_path.exists():
                raise FileNotFoundError(image_path)
            last = add_picture_after(last, image_path=image_path, width=float(block.get("width", 6.4)))
            caption = block.get("caption")
            if caption:
                last = add_caption_after(last, caption)
            last = apply_blocks(last, block.get("blocks", []), config_dir=config_dir)
            continue
        raise RuntimeError(f"unsupported block type: {block_type}")
    return last


def backup_docx(docx_path: Path, tag: str) -> Path:
    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = BACKUP_DIR / f"{docx_path.stem}.{tag}-{stamp}.bak{docx_path.suffix}"
    shutil.copy2(docx_path, backup)
    return backup


def validate_titles(document: Document, titles: list[str]) -> None:
    text = "\n".join(p.text for p in document.paragraphs)
    for title in titles:
        if title not in text:
            raise RuntimeError(f"title validation failed: {title}")


def main() -> None:
    args = parse_args()
    config_path = Path(args.config).resolve()
    config_dir = config_path.parent
    config = load_json(config_path)

    docx_path = resolve_path(args.docx or config.get("docx"), config_dir) or DEFAULT_DOCX
    if not docx_path.exists():
        raise FileNotFoundError(docx_path)

    sections = config.get("sections", [])
    if not sections:
        raise RuntimeError("config.sections is empty")

    for section in sections:
        run_image_tasks(section, config_dir=config_dir)

    document = Document(docx_path)
    for section in sections:
        anchor = reset_section(
            document,
            title=section["title"],
            keep_existing_media=resolve_keep_existing_media(config, section),
            heading_style=section.get("heading_style", "Heading 3"),
            stop_styles=section.get("stop_styles"),
        )
        apply_blocks(anchor, section.get("blocks", []), config_dir=config_dir)

    validate_titles(document, [section["title"] for section in sections])

    if args.dry_run:
        print(f"dry_run ok docx={docx_path}")
        return

    backup = backup_docx(docx_path, tag=config.get("backup_tag", "manual-sections"))
    try:
        document.save(docx_path)
    except PermissionError:
        print(f"PERMISSION_ERROR backup={backup}")
        raise

    print(f"updated manual docx={docx_path}")
    print(f"backup={backup}")


if __name__ == "__main__":
    main()
