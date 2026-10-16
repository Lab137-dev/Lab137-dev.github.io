"""Build an offline release with all game scripts embedded in index.html."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re
import sys

root = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
html = (root / "index.html").read_text(encoding="utf-8")
def inline(match):
    name = match.group(1).split("?", 1)[0]
    source = (root / name).read_text(encoding="utf-8")
    # A literal HTML closing tag would prematurely close an inline script.
    source = re.sub(r"</script", r"<\\/script", source, flags=re.I)
    return '<script data-crumb-module="' + name + '">\n' + source + '\n</script>'
html = re.sub(r'<script src="([^"]+)"\s*></script>', inline, html)
assert not re.search(r'<script[^>]+src=', html)
out.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(out, "w", ZIP_DEFLATED) as archive:
    archive.writestr("index.html", html.encode("utf-8"))
    for name in ["assets/godmode-door.png", "assets/crumb-preview.png", "README.md", "AUDIO.md"]:
        archive.write(root / name, name)
with ZipFile(out) as archive:
    assert archive.testzip() is None
print(out)
