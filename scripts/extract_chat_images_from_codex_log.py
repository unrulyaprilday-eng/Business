from __future__ import annotations

import argparse
import base64
import json
import os
import re
from pathlib import Path
from typing import Any


IMAGE_RE = re.compile(r"^data:image/([A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract chat images for a manual page. "
            "Primary path: parse a thread/read payload and read the target userMessage. "
            "Fallback path: search local Codex logs for a thread/read response."
        )
    )
    parser.add_argument(
        "--thread-read-file",
        help=(
            "Path to a saved thread/read payload or a raw log response line that contains "
            "a thread/read response."
        ),
    )
    parser.add_argument("--thread-id", help="Target thread id. Required for log fallback.")
    parser.add_argument(
        "--message-text",
        help="Substring match against the target userMessage text. Recommended when multiple user messages exist.",
    )
    parser.add_argument("--message-id", help="Exact userMessage item id, if known.")
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Output directory, for example custom/assets/manual-member-complaint-list-original",
    )
    parser.add_argument(
        "--date",
        help="Optional log date in YYYY/MM/DD when using log fallback.",
    )
    parser.add_argument(
        "--expected-count",
        type=int,
        help="Expected image count. Raise an error when the extracted count does not match.",
    )
    parser.add_argument(
        "--prefix",
        default="chat",
        help="Output file prefix. Default writes files such as chat-1.png.",
    )
    return parser.parse_args()


def iter_log_files(date: str | None) -> list[Path]:
    root = Path(os.environ["LOCALAPPDATA"]) / "Codex" / "Logs"
    if date:
        target = root / Path(date)
        if not target.exists():
            raise RuntimeError(f"log directory not found: {target}")
        return sorted(target.rglob("*.log"))
    return sorted(root.rglob("*.log"))


def parse_json_object(text: str) -> Any:
    return json.loads(text)


def unwrap_thread_read_payload(raw_text: str) -> dict[str, Any]:
    candidates = [raw_text.strip()]
    if "response=" in raw_text:
        candidates.append(raw_text.split("response=", 1)[1].strip())

    last_error: Exception | None = None
    for candidate in candidates:
        if not candidate:
            continue
        try:
            obj = parse_json_object(candidate)
            payload = normalize_thread_read_object(obj)
            if payload is not None:
                return payload
        except Exception as exc:  # noqa: BLE001
            last_error = exc

        token = extract_input_text_token(candidate)
        if token is not None:
            try:
                nested = json.loads(f'"{token}"')
                payload = unwrap_thread_read_payload(nested)
                if payload is not None:
                    return payload
            except Exception as exc:  # noqa: BLE001
                last_error = exc

    raise RuntimeError(f"unable to parse thread/read payload: {last_error}")


def extract_input_text_token(text: str) -> str | None:
    start_marker = '"type":"inputText","text":"'
    end_marker = '"}],"success":true}'
    start = text.find(start_marker)
    if start != -1:
        start += len(start_marker)
        end = text.rfind(end_marker)
        if end != -1 and end > start:
            return text[start:end]

    pattern = re.compile(r'"type":"inputText","text":"((?:\\.|[^"\\])*)"')
    match = pattern.search(text)
    if match:
        return match.group(1)
    return None


def normalize_thread_read_object(obj: Any) -> dict[str, Any] | None:
    if isinstance(obj, dict):
        if "thread" in obj and "turns" in obj:
            return obj
        if "contentItems" in obj:
            for item in obj["contentItems"]:
                if isinstance(item, dict) and item.get("type") == "inputText" and "text" in item:
                    nested = item["text"]
                    if isinstance(nested, str):
                        return unwrap_thread_read_payload(nested)
    return None


def message_text_from_item(item: dict[str, Any]) -> str:
    parts: list[str] = []
    for entry in item.get("content", []):
        if isinstance(entry, dict) and entry.get("type") == "text":
            parts.append(str(entry.get("text", "")))
    return "".join(parts)


def extract_images_from_user_message(item: dict[str, Any]) -> list[tuple[str, bytes]]:
    images: list[tuple[str, bytes]] = []
    for entry in item.get("content", []):
        if not isinstance(entry, dict):
            continue
        if entry.get("type") != "image":
            continue
        url = entry.get("url")
        if not isinstance(url, str):
            continue
        match = IMAGE_RE.match(url)
        if not match:
            continue
        image_type = match.group(1).lower()
        image_b64 = match.group(2)
        ext = "jpg" if image_type == "jpeg" else image_type
        images.append((ext, base64.b64decode(image_b64)))
    return images


def iter_user_messages(payload: dict[str, Any]) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = []
    for turn in payload.get("turns", []):
        for item in turn.get("items", []):
            if isinstance(item, dict) and item.get("type") == "userMessage":
                messages.append(item)
    return messages


def select_user_message(payload: dict[str, Any], message_text: str | None, message_id: str | None) -> dict[str, Any]:
    messages = iter_user_messages(payload)
    if not messages:
        raise RuntimeError("no userMessage items found in payload")

    if message_id:
        for item in messages:
            if item.get("id") == message_id:
                return item
        raise RuntimeError(f"userMessage id not found: {message_id}")

    if message_text:
        for item in messages:
            if message_text in message_text_from_item(item):
                return item
        raise RuntimeError(f"userMessage text not found: {message_text}")

    for item in messages:
        if extract_images_from_user_message(item):
            return item
    raise RuntimeError("no userMessage with images found")


def write_images(images: list[tuple[str, bytes]], output_dir: Path, prefix: str) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for idx, (ext, data) in enumerate(images, start=1):
        target = output_dir / f"{prefix}-{idx}.{ext}"
        target.write_bytes(data)
        written.append(target)
    return written


def extract_from_payload_text(
    payload_text: str,
    message_text: str | None,
    message_id: str | None,
) -> tuple[dict[str, Any], dict[str, Any], list[tuple[str, bytes]]]:
    payload = unwrap_thread_read_payload(payload_text)
    message = select_user_message(payload, message_text=message_text, message_id=message_id)
    images = extract_images_from_user_message(message)
    if not images:
        raise RuntimeError("target userMessage does not contain any data:image content")
    return payload, message, images


def extract_from_thread_read_file(
    path: Path,
    message_text: str | None,
    message_id: str | None,
) -> tuple[dict[str, Any], dict[str, Any], list[tuple[str, bytes]]]:
    payload_text = path.read_text(encoding="utf-8", errors="ignore")
    return extract_from_payload_text(payload_text, message_text=message_text, message_id=message_id)


def locate_from_logs(
    thread_id: str,
    message_text: str | None,
    message_id: str | None,
    date: str | None,
) -> tuple[Path, dict[str, Any], dict[str, Any], list[tuple[str, bytes]]]:
    log_files = iter_log_files(date)
    candidates: list[Path] = [path for path in log_files if path.is_file()]
    candidates.sort(reverse=True)

    for log_path in candidates:
        text = log_path.read_text(encoding="utf-8", errors="ignore")
        if thread_id not in text or "data:image/" not in text or "Sending server response" not in text:
            continue

        lines = text.splitlines()
        for line in reversed(lines):
            if thread_id not in line or "data:image/" not in line or "Sending server response" not in line:
                continue
            try:
                payload, message, images = extract_from_payload_text(
                    line,
                    message_text=message_text,
                    message_id=message_id,
                )
                return log_path, payload, message, images
            except Exception:  # noqa: BLE001
                continue

    raise RuntimeError("unable to locate a usable thread/read response in local Codex logs")


def validate_count(actual: int, expected: int | None) -> None:
    if expected is not None and actual != expected:
        raise RuntimeError(f"expected {expected} images, extracted {actual}")


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)

    source = ""
    message: dict[str, Any]
    images: list[tuple[str, bytes]]

    if args.thread_read_file:
        _, message, images = extract_from_thread_read_file(
            Path(args.thread_read_file),
            message_text=args.message_text,
            message_id=args.message_id,
        )
        source = f"thread_read_file={Path(args.thread_read_file).resolve()}"
    else:
        if not args.thread_id:
            raise RuntimeError("--thread-id is required when --thread-read-file is not provided")
        log_path, _, message, images = locate_from_logs(
            thread_id=args.thread_id,
            message_text=args.message_text,
            message_id=args.message_id,
            date=args.date,
        )
        source = f"log={log_path}"

    validate_count(len(images), args.expected_count)
    written = write_images(images, output_dir=output_dir, prefix=args.prefix)

    print(source)
    print(f"message_id={message.get('id', '')}")
    print(f"count={len(written)}")
    for path in written:
        print(path)


if __name__ == "__main__":
    main()
