"""
Bulk-ingest a folder of mixed OneNote (.one/.onepkg) / PowerPoint (.pptx) /
Markdown (.md) files into qa-brain/Notes as NOTE-YYYYMMDD-NNN.md records.

Cloud-hosted OneNote notebooks are NOT handled here -- use Obsidian's built-in
"Importer" core plugin (Settings > Core plugins > Importer > OneNote) for
those; it authenticates via Microsoft OAuth and only reaches notebooks on
OneDrive. This script covers local .one files plus any format Obsidian's
Importer doesn't touch (PowerPoint) and plain Markdown already on disk.

Local .one/.onepkg conversion shells out to onenote-md-exporter, a one-time
install:
    dotnet tool install --global onenote-md-exporter

Usage:
    python ingest_notes.py <source_folder> [--tag TAG ...]
"""
import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

VAULT_NOTES = Path(__file__).resolve().parent.parent / "Notes"


def next_note_id() -> str:
    today = date.today().strftime("%Y%m%d")
    existing = [p.stem for p in VAULT_NOTES.glob(f"NOTE-{today}-*.md")]
    seqs = [int(m.group(1)) for s in existing if (m := re.search(r"-(\d+)$", s))]
    return f"NOTE-{today}-{(max(seqs) + 1 if seqs else 1):03d}"


def write_note(title: str, body: str, source_folder: str, tags: list[str]) -> Path:
    note_id = next_note_id()
    frontmatter = (
        "---\n"
        f"title: {title}\n"
        f"folder: {source_folder}\n"
        f"id: {note_id}\n"
        f"tags: {tags}\n"
        "related_documents: []\n"
        "---\n\n"
    )
    out_path = VAULT_NOTES / f"{note_id}.md"
    out_path.write_text(frontmatter + body, encoding="utf-8")
    return out_path


def pptx_to_markdown(path: Path) -> str:
    from pptx import Presentation  # python-pptx

    prs = Presentation(path)
    lines = []
    for i, slide in enumerate(prs.slides, start=1):
        lines.append(f"## Slide {i}\n")
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    text = "".join(run.text for run in para.runs).strip()
                    if text:
                        lines.append(f"- {text}")
            if shape.has_text_frame is False and getattr(shape, "notes_text_frame", None):
                pass
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                lines.append(f"\n> {notes}")
        lines.append("")
    return "\n".join(lines)


def onenote_to_markdown_dir(path: Path, workdir: Path) -> list[Path]:
    if shutil.which("onenote-md-exporter") is None:
        print(
            f"SKIP {path.name}: onenote-md-exporter not installed. "
            "Run: dotnet tool install --global onenote-md-exporter",
            file=sys.stderr,
        )
        return []
    out_dir = workdir / path.stem
    out_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["onenote-md-exporter", "--source", str(path), "--output", str(out_dir)],
        check=True,
    )
    return list(out_dir.rglob("*.md"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_folder", type=Path)
    parser.add_argument("--tag", action="append", default=[], dest="tags")
    args = parser.parse_args()

    src = args.source_folder
    if not src.is_dir():
        sys.exit(f"Not a folder: {src}")

    VAULT_NOTES.mkdir(exist_ok=True)
    created, skipped = [], []

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for f in sorted(src.rglob("*")):
            if not f.is_file():
                continue
            ext = f.suffix.lower()
            if ext == ".md":
                body = f.read_text(encoding="utf-8", errors="ignore")
                created.append(write_note(f.stem, body, src.name, args.tags))
            elif ext == ".pptx":
                body = pptx_to_markdown(f)
                created.append(write_note(f.stem, body, src.name, args.tags + ["powerpoint"]))
            elif ext in (".one", ".onepkg"):
                for md in onenote_to_markdown_dir(f, tmp):
                    body = md.read_text(encoding="utf-8", errors="ignore")
                    created.append(write_note(md.stem, body, src.name, args.tags + ["onenote"]))
            else:
                skipped.append(f)

    print(f"Created {len(created)} notes in {VAULT_NOTES}:")
    for p in created:
        print(f"  {p.name}")
    if skipped:
        print(f"\nSkipped {len(skipped)} unsupported file(s):")
        for p in skipped:
            print(f"  {p}")


if __name__ == "__main__":
    main()
