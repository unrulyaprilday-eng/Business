from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def s(*codes):
    return "".join(chr(code) for code in codes)


OLD = s(0x7AD9, 0x70B9, 0x914D, 0x7F6E)
NEW = s(0x7AD9, 0x70B9, 0x5E94, 0x7528, 0x914D, 0x7F6E)


MOVES = [
    (ROOT / f"{OLD}.html", ROOT / f"{NEW}.html"),
    (ROOT / "files" / OLD, ROOT / "files" / NEW),
    (ROOT / "custom" / "css" / f"{OLD}.css", ROOT / "custom" / "css" / f"{NEW}.css"),
    (ROOT / "custom" / "js" / f"{OLD}.js", ROOT / "custom" / "js" / f"{NEW}.js"),
    (ROOT / OLD, ROOT / NEW),
]


def assert_inside_workspace(path):
    resolved = path.resolve()
    root = ROOT.resolve()
    if resolved != root and root not in resolved.parents:
        raise RuntimeError(f"Path outside workspace: {resolved}")


def move_path(src, dst):
    assert_inside_workspace(src)
    assert_inside_workspace(dst)
    if dst.exists():
        if src.exists():
            raise RuntimeError(f"Target already exists while source also exists: {dst}")
        return "already_moved"
    if not src.exists():
        return "missing_source"
    src.rename(dst)
    return "moved"


def replace_text(path, pairs):
    assert_inside_workspace(path)
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in pairs:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    results = []
    for src, dst in MOVES:
        results.append((str(src.relative_to(ROOT)), str(dst.relative_to(ROOT)), move_path(src, dst)))

    html = ROOT / f"{NEW}.html"
    data_js = ROOT / "files" / NEW / "data.js"
    document_js = ROOT / "data" / "document.js"
    component_map = ROOT / "custom" / "component-library" / "component-map.json"
    page_notes = ROOT / "scripts" / "refine_manual_page_notes.py"

    replacements = [
        (f"{OLD}.html", f"{NEW}.html"),
        (f"files/{OLD}/", f"files/{NEW}/"),
        (f"files\\\\{OLD}\\\\", f"files\\\\{NEW}\\\\"),
        (f"custom/css/{OLD}.css", f"custom/css/{NEW}.css"),
        (f"custom/js/{OLD}.js", f"custom/js/{NEW}.js"),
        (f'"name": "{OLD}"', f'"name": "{NEW}"'),
        (f'"pageName": "{OLD}"', f'"pageName": "{NEW}"'),
        (f"<title>{OLD}</title>", f"<title>{NEW}</title>"),
    ]

    changed = []
    for path in [html, data_js, document_js, component_map, page_notes]:
        if path.exists() and replace_text(path, replacements):
            changed.append(str(path.relative_to(ROOT)))

    print("rename_results:")
    for src, dst, status in results:
        print(f"  {status}: {src} -> {dst}")
    print("changed_files:")
    for item in changed:
        print(f"  {item}")


if __name__ == "__main__":
    main()
