import os
import re
import html
from pathlib import Path
from typing import Optional
from app.engines.wrappers.base import BaseEngine, ProcessResult

class PandocEngine(BaseEngine):
    name = "pandoc"

    def _markdown_to_html_fallback(self, md_text: str) -> str:
        """Lightweight zero-dependency Markdown to HTML converter."""
        lines = md_text.splitlines()
        html_lines = []
        in_code_block = False
        in_list = False

        for line in lines:
            stripped = line.strip()

            if stripped.startswith("```"):
                if in_code_block:
                    html_lines.append("</code></pre>")
                    in_code_block = False
                else:
                    html_lines.append("<pre><code>")
                    in_code_block = True
                continue

            if in_code_block:
                html_lines.append(html.escape(line))
                continue

            # Headers
            if stripped.startswith("###### "):
                html_lines.append(f"<h6>{html.escape(stripped[7:])}</h6>")
            elif stripped.startswith("##### "):
                html_lines.append(f"<h5>{html.escape(stripped[6:])}</h5>")
            elif stripped.startswith("#### "):
                html_lines.append(f"<h4>{html.escape(stripped[5:])}</h4>")
            elif stripped.startswith("### "):
                html_lines.append(f"<h3>{html.escape(stripped[4:])}</h3>")
            elif stripped.startswith("## "):
                html_lines.append(f"<h2>{html.escape(stripped[3:])}</h2>")
            elif stripped.startswith("# "):
                html_lines.append(f"<h1>{html.escape(stripped[2:])}</h1>")
            # Unordered lists
            elif stripped.startswith("- ") or stripped.startswith("* "):
                if not in_list:
                    html_lines.append("<ul>")
                    in_list = True
                html_lines.append(f"<li>{html.escape(stripped[2:])}</li>")
            elif stripped == "":
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append("<br />")
            else:
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                escaped = html.escape(stripped)
                # Bold
                escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
                # Italic
                escaped = re.sub(r"\*(.+?)\*", r"<em>\1</em>", escaped)
                html_lines.append(f"<p>{escaped}</p>")

        if in_list:
            html_lines.append("</ul>")
        if in_code_block:
            html_lines.append("</code></pre>")

        return f"<!DOCTYPE html>\n<html>\n<head><meta charset='utf-8'><title>Document</title></head>\n<body style='font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1rem;'>\n" + "\n".join(html_lines) + "\n</body>\n</html>"

    def _html_to_txt_fallback(self, html_text: str) -> str:
        """Strip HTML tags for pure text conversion."""
        clean = re.sub(r"<[^>]+>", "", html_text)
        return html.unescape(clean).strip()

    async def convert(
        self,
        input_path: str,
        output_path: str,
        format_from: Optional[str] = None,
        format_to: Optional[str] = None
    ) -> ProcessResult:
        if self.is_installed():
            cmd = ["pandoc", input_path, "-o", output_path]
            if format_from:
                cmd.extend(["-f", format_from])
            if format_to:
                cmd.extend(["-t", format_to])
            return await self.execute(cmd)

        # Fallback for systems where pandoc CLI is not installed
        in_p = Path(input_path)
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        in_ext = in_p.suffix.lower()
        out_ext = out_p.suffix.lower()

        try:
            with open(in_p, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            if out_ext in [".html", ".htm"] and in_ext in [".md", ".markdown", ".txt"]:
                converted = self._markdown_to_html_fallback(content)
                with open(out_p, "w", encoding="utf-8") as f:
                    f.write(converted)
                return ProcessResult(
                    returncode=0,
                    stdout="Converted via internal markup processor.",
                    stderr="",
                    success=True,
                    command=["ufs_internal_markup", input_path, output_path]
                )
            elif out_ext in [".txt", ".text"]:
                if in_ext in [".html", ".htm"]:
                    converted = self._html_to_txt_fallback(content)
                else:
                    converted = content
                with open(out_p, "w", encoding="utf-8") as f:
                    f.write(converted)
                return ProcessResult(
                    returncode=0,
                    stdout="Converted via internal text processor.",
                    stderr="",
                    success=True,
                    command=["ufs_internal_text", input_path, output_path]
                )
            else:
                return ProcessResult(
                    returncode=127,
                    stdout="",
                    stderr=f"Pandoc is not installed to convert {in_ext} to {out_ext}.",
                    success=False,
                    command=["pandoc"]
                )
        except Exception as e:
            return ProcessResult(
                returncode=1,
                stdout="",
                stderr=f"Pandoc fallback failed: {str(e)}",
                success=False,
                command=["pandoc_fallback"]
            )

pandoc_engine = PandocEngine()
