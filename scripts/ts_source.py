"""Comment handling for the regex-level reading of TypeScript sources by repo scripts and their tests."""

from __future__ import annotations


def _comment_spans(text: str) -> list[tuple[int, int]]:
    """Spans of // and /* */ comments outside string literals ('...', "...", `...`), so that a "/*" inside a string
    (a glob, a path) does not swallow the code that follows it. Regex literals and `${}` nesting in templates are not
    parsed: the sources read this way have no comment marker inside them."""
    spans: list[tuple[int, int]] = []
    i, n = 0, len(text)
    while i < n:
        char = text[i]
        if char in "'\"`":
            j = i + 1
            while j < n and text[j] != char:
                j += 2 if text[j] == "\\" else 1
            i = j + 1
        elif text.startswith("//", i):
            j = text.find("\n", i)
            end = n if j < 0 else j
            spans.append((i, end))
            i = end
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            end = n if j < 0 else j + 2
            spans.append((i, end))
            i = end
        else:
            i += 1
    return spans


def strip_comments(text: str) -> str:
    """The text without its comments."""
    out: list[str] = []
    last = 0
    for start, end in _comment_spans(text):
        out.append(text[last:start])
        last = end
    out.append(text[last:])
    return "".join(out)


def mask_comments(text: str) -> str:
    """The text with each comment character replaced by a space (newlines kept), so offsets and line numbers match
    the original: a match found in the masked text is never inside a comment."""
    chars = list(text)
    for start, end in _comment_spans(text):
        for k in range(start, end):
            if chars[k] != "\n":
                chars[k] = " "
    return "".join(chars)
