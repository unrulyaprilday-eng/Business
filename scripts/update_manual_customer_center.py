from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "B端后台操作手册.docx"
BACKUP_DIR = ROOT / "backups"
ASSET_DIR = ROOT / "custom" / "assets" / "manual-customer-center"
USER_SCREENSHOT = ASSET_DIR / "customer-center-screenshot.png"

FONT_NAME = "微软雅黑"
BLUE = RGBColor(47, 85, 151)
CAPTION_GRAY = RGBColor(112, 126, 146)


def set_run(run, *, size: float = 10, bold: bool = False, color: RGBColor | None = None) -> None:
    run.font.name = FONT_NAME
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
    run._element.rPr.rFonts.set(qn("w:ascii"), FONT_NAME)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_NAME)
    run.font.size = Pt(size)
    run.bold = bold
    if color is not None:
        run.font.color.rgb = color


def insert_after(paragraph, text: str = "", style: str | None = None):
    new_p = OxmlElement("w:p")
    paragraph._p.addnext(new_p)
    new_para = paragraph._parent.add_paragraph()
    new_para._p = new_p
    if style:
        new_para.style = style
    if text:
        new_para.add_run(text)
    return new_para


def delete_paragraph(paragraph) -> None:
    element = paragraph._element
    element.getparent().remove(element)
    paragraph._p = paragraph._element = None


def add_heading_after(anchor, text: str, level: int):
    paragraph = insert_after(anchor, style=f"Heading {level}")
    run = paragraph.add_run(text)
    set_run(run, size=11 if level >= 4 else 12.5, bold=True, color=BLUE)
    paragraph.paragraph_format.space_after = Pt(5)
    return paragraph


def add_body_after(anchor, text: str):
    paragraph = insert_after(anchor, style="Normal")
    run = paragraph.add_run(text)
    set_run(run, size=10)
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.15
    return paragraph


def add_bullet_after(anchor, label: str, text: str):
    paragraph = insert_after(anchor, style="List Bullet")
    label_run = paragraph.add_run(label)
    set_run(label_run, size=10, bold=True, color=BLUE)
    body_run = paragraph.add_run("：" + text)
    set_run(body_run, size=10)
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.15
    return paragraph


def add_picture_after(anchor, image_path: Path, width: float = 6.45):
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


def reset_section(document: Document):
    start = None
    for index, paragraph in enumerate(document.paragraphs):
        if paragraph.style.name == "Heading 3" and paragraph.text.strip() == "客服中心":
            start = index
            break
    if start is None:
        raise RuntimeError("未找到“客服中心”章节。")

    end = len(document.paragraphs)
    for index in range(start + 1, len(document.paragraphs)):
        style_name = document.paragraphs[index].style.name
        if style_name in {"Heading 1", "Heading 2", "Heading 3"}:
            end = index
            break

    for paragraph in list(document.paragraphs[start + 1 : end]):
        delete_paragraph(paragraph)

    anchor = document.paragraphs[start]
    for run in anchor.runs:
        set_run(run, size=12.5, bold=True, color=BLUE)
    return anchor


def main() -> None:
    if not DOCX.exists():
        raise FileNotFoundError(DOCX)

    ASSET_DIR.mkdir(parents=True, exist_ok=True)

    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = BACKUP_DIR / f"{DOCX.stem}.customer-center-{stamp}.bak.docx"
    shutil.copy2(DOCX, backup)

    document = Document(DOCX)
    anchor = reset_section(document)
    last = add_body_after(
        anchor,
        "客服中心用于在线接待会员咨询和处理未应答会话。页面左侧为会话侧栏，可查看待接入队列数量、搜索会员或会话标签，并通过自动接待开关管理会话接入；右侧为当前会话工作区，展示会员编号、在线状态、工具按钮、语言切换和底部消息输入区。",
    )

    last = add_heading_after(last, "页面说明", 4)
    if USER_SCREENSHOT.exists():
        last = add_picture_after(last, USER_SCREENSHOT, 6.45)
        last = add_caption_after(last, "图：客服中心页面，用于查看会话队列、接入会员咨询并发送客服回复。")
    for label, text in [
        ("会话侧栏", "展示 Conversations、Queue 数量、搜索框、Auto 开关和会话列表。截图中 Queue 为 0，表示当前没有未应答排队会话；左侧已选中会员 1010010008，会话卡片显示在线状态和最近时间。"),
        ("聊天工作区", "右侧顶部显示当前会员 1010010008 和 Online 状态，右上角提供标签/标记按钮和 English 语言切换。中间区域为消息记录展示区，底部为回复工具栏、消息输入框和发送按钮。"),
        ("适用场景", "适用于处理充值未到账、提现审核、活动奖励、账号咨询等实时咨询。客服应先确认会员身份、咨询标签和关联订单，再结合财务、活动或用户管理等页面核对业务数据。"),
    ]:
        last = add_bullet_after(last, label, text)

    last = add_heading_after(last, "字段说明", 4)
    for label, text in [
        ("Queue", "未应答会话数量。截图中显示为 0，说明当前暂无等待接入的会员；当数量大于 0 时，客服需按优先级及时接入。"),
        ("Search name, ID, or tag", "按会员昵称、会员 ID、会话 ID 或标签搜索左侧会话列表，用于在多个在线会话中快速定位目标会员。"),
        ("Auto", "自动接待开关。截图中为关闭状态；开启前应确认当前客服有处理余量，避免自动接入后响应不及时。"),
        ("会话卡片", "展示会员头像、会员编号、在线状态和最近时间。截图中会员 1010010008 处于选中态，右侧工作区同步切换到该会员会话。"),
        ("会话顶部", "展示当前会员编号和 Online 状态，用于确认当前回复对象。右上角的标签按钮可用于标记会话，语言按钮用于切换当前会话的沟通语言。"),
        ("消息记录区", "位于会话顶部和底部输入区之间，用于展示双方聊天记录。截图中记录区为空，表示当前会话暂未显示历史消息或等待客服输入。"),
        ("底部工具栏", "包含附件、表情、快捷用语等入口。客服可按问题场景上传凭证、插入表情或调用标准话术。"),
        ("Type a message", "消息输入框。输入回复内容后点击右侧发送按钮或按回车发送；发送前应核对当前选中会话，避免回复到错误会员。"),
    ]:
        last = add_bullet_after(last, label, text)

    last = add_heading_after(last, "操作流程", 4)
    for label, text in [
        ("确认接待状态", "进入客服中心后先查看 Queue 数量和 Auto 开关。Queue 为 0 时说明暂无排队会话；若出现未应答会话，应结合客服处理能力手动接入或开启自动接待。"),
        ("定位会话", "在搜索框输入会员编号、会话 ID、昵称或标签，筛选左侧会话列表。点击目标会话卡片后，右侧顶部会显示对应会员编号和在线状态。"),
        ("查看消息", "点击左侧会话卡片后，先查看右侧消息记录区。若会员提供订单号、截图或问题描述，应根据问题类型到充值订单、提现订单、活动记录或用户资料等页面核对。"),
        ("标记与语言", "需要对会话做分类时，点击右上角标签按钮进行标记；需要切换沟通语言时，点击 English 语言按钮，确保回复语言与会员沟通场景一致。"),
        ("使用快捷入口", "底部工具栏可发送附件、选择表情或打开快捷用语。涉及凭证核验时可使用附件入口；需要标准回复时可通过快捷用语插入后再按实际情况调整。"),
        ("发送回复", "在 Type a message 输入框输入回复后，点击右侧发送按钮提交。发送前确认顶部会员编号与当前要回复的会员一致；若需要继续处理，应在同一会话内说明后续时效。"),
        ("结束或转交", "问题处理完成后可发送确认话术；若涉及专业审核、资金异常或风控判断，应说明已转交相关人员处理，并保留会话记录便于后续追踪。"),
    ]:
        last = add_bullet_after(last, label, text)

    last = add_heading_after(last, "注意事项", 4)
    for label, text in [
        ("回复对象", "发送前必须确认右侧当前会员昵称与要回复的会话一致，避免多会话处理时串线。"),
        ("敏感信息", "涉及充值、提现、账户安全和风控问题时，不要在聊天中直接暴露后台敏感字段、完整风控规则或其他会员信息。"),
        ("核查口径", "会员提供订单号或活动信息后，应以后台订单、账变、活动记录等页面数据为准，不仅依据聊天描述下结论。"),
        ("自动接待", "开启 Auto 前确认当前客服有处理余量；排队量较高时建议按优先级处理充值未到账、提现异常、账号安全等高风险问题。"),
        ("快捷用语", "快捷话术只作为模板，发送前要补充真实核查进度、预计处理时间和下一步动作，避免给会员造成机械回复或承诺不清。"),
        ("在线状态", "Online 仅表示会员当前在线或会话连接状态，不代表问题已经处理完成。客服仍需根据订单、账变、活动或用户资料等后台数据完成核查。"),
    ]:
        last = add_bullet_after(last, label, text)

    last = add_heading_after(last, "常见问题", 4)
    for label, text in [
        ("Queue 为 0 是否异常", "不异常。Queue 为 0 表示暂无未应答排队会话；如果左侧已有会员卡片，说明当前仍有已接入或历史会话可处理。"),
        ("搜索不到会员", "清空搜索框重新查看列表，并确认该会员会话是否已被当前客服接入。搜索主要用于当前客服会话列表，不等同于全平台会员搜索。"),
        ("消息区为空怎么办", "先确认左侧会话是否已选中、顶部会员编号是否正确。若消息区仍为空，可在输入框发送问候或刷新页面后重新选择会话。"),
        ("无法发送消息", "先确认已经选中会话且输入框不为空；若仍无法发送，刷新页面后重新选择会话，并检查当前客服账号是否具备客服中心操作权限。"),
        ("快捷用语不适合当前问题", "可先选择最接近的模板，再在输入框中改写；常见问题处理完成后可新增临时模板，便于后续同类咨询复用。"),
    ]:
        last = add_bullet_after(last, label, text)

    try:
        document.save(DOCX)
    except PermissionError:
        print(f"PERMISSION_ERROR backup={backup}")
        raise

    image_note = str(USER_SCREENSHOT) if USER_SCREENSHOT.exists() else "no screenshot inserted"
    print(f"updated customer center; backup={backup}; image={image_note}")


if __name__ == "__main__":
    main()
