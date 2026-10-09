import sys
import re
from typing import List
from app.engines.base import EngineDetector, EngineInfo, EngineCapability

class FFmpegDetector(EngineDetector):
    name = "ffmpeg"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, stderr = await self._run_command(["ffmpeg", "-version"])
        if code != 0:
            return info
            
        info.installed = True
        info.path = "ffmpeg"
        
        match = re.search(r"ffmpeg version ([\w\.-]+)", stdout)
        if match:
            info.version = match.group(1)
            
        caps = EngineCapability()
        
        # Check encoders
        code, stdout, _ = await self._run_command(["ffmpeg", "-encoders"])
        if code == 0:
            for line in stdout.splitlines():
                m = re.match(r"^\s*[VSA][\w\.]*\s+([\w-]+)\s+", line)
                if m:
                    caps.encoders.append(m.group(1))
                    
        # Check decoders
        code, stdout, _ = await self._run_command(["ffmpeg", "-decoders"])
        if code == 0:
            for line in stdout.splitlines():
                m = re.match(r"^\s*[VSA][\w\.]*\s+([\w-]+)\s+", line)
                if m:
                    caps.decoders.append(m.group(1))
                    
        # Check formats
        code, stdout, _ = await self._run_command(["ffmpeg", "-formats"])
        if code == 0:
            for line in stdout.splitlines():
                m = re.match(r"^\s*([D ])([E ])\s+([\w,]+)\s+", line)
                if m:
                    caps.formats.extend(m.group(3).split(','))
                    
        # Check ffprobe
        pcode, pout, _ = await self._run_command(["ffprobe", "-version"])
        caps.extras["ffprobe_installed"] = (pcode == 0)
        
        info.capabilities = caps
        return info


class ImageMagickDetector(EngineDetector):
    name = "imagemagick"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        # Check magick or convert
        bin_cmd = "magick"
        code, stdout, stderr = await self._run_command(["magick", "-version"])
        if code != 0:
            code, stdout, stderr = await self._run_command(["convert", "-version"])
            bin_cmd = "convert"
            
        if code != 0:
            return info
            
        info.installed = True
        info.path = bin_cmd
        
        match = re.search(r"Version:\s+ImageMagick\s+([\d\.\-]+)", stdout)
        if match:
            info.version = match.group(1)
            
        caps = EngineCapability()
        code, stdout, _ = await self._run_command([bin_cmd, "-list", "format"])
        if code == 0:
            for line in stdout.splitlines()[:200]:
                m = re.match(r"^\s*([A-Za-z0-9_-]+)[*]?\s+[A-Za-z0-9_-]+\s+[r-][w-][+-]", line)
                if m:
                    caps.formats.append(m.group(1).lower())
                    
        info.capabilities = caps
        return info


class SevenZipDetector(EngineDetector):
    name = "7z"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        bin_name = None
        stdout_found = ""
        
        for exe in ["7z", "7za", "7zz"]:
            code, stdout, _ = await self._run_command([exe])
            if code == 0 or "7-Zip" in stdout or "7-Zip" in _:
                bin_name = exe
                stdout_found = stdout or _
                break
                
        if not bin_name:
            return info
            
        info.installed = True
        info.path = bin_name
        
        match = re.search(r"7-Zip\s*(?:\([A-Z]\)\s*)?([\d\.]+)", stdout_found)
        if match:
            info.version = match.group(1)
            
        info.capabilities = EngineCapability(
            formats=["7z", "zip", "tar", "gz", "bz2", "xz", "rar"]
        )
        return info


class QpdfDetector(EngineDetector):
    name = "qpdf"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, _ = await self._run_command(["qpdf", "--version"])
        if code == 0:
            info.installed = True
            info.path = "qpdf"
            match = re.search(r"qpdf version ([\d\.]+)", stdout)
            if match:
                info.version = match.group(1)
            info.capabilities = EngineCapability(formats=["pdf"])
        return info


class PopplerDetector(EngineDetector):
    name = "poppler"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, stderr = await self._run_command(["pdfinfo", "-v"])
        out = stdout or stderr
        if code == 0 or "pdfinfo version" in out:
            info.installed = True
            info.path = "poppler-utils"
            match = re.search(r"pdfinfo version ([\d\.]+)", out)
            if match:
                info.version = match.group(1)
                
            code_ppm, _, _ = await self._run_command(["pdftoppm", "-v"])
            code_txt, _, _ = await self._run_command(["pdftotext", "-v"])
            info.capabilities = EngineCapability(
                formats=["pdf"],
                extras={
                    "pdftoppm": code_ppm == 0,
                    "pdftotext": code_txt == 0
                }
            )
        return info


class GhostscriptDetector(EngineDetector):
    name = "ghostscript"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        exe = "gs" if sys.platform != "win32" else "gswin64c"
        code, stdout, _ = await self._run_command([exe, "--version"])
        if code == 0:
            info.installed = True
            info.path = exe
            info.version = stdout.strip()
            info.capabilities = EngineCapability(formats=["pdf", "ps"])
        return info


class LibreOfficeDetector(EngineDetector):
    name = "libreoffice"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        for exe in ["libreoffice", "soffice"]:
            code, stdout, _ = await self._run_command([exe, "--version"])
            if code == 0:
                info.installed = True
                info.path = exe
                match = re.search(r"LibreOffice\s+([\d\.]+)", stdout)
                if match:
                    info.version = match.group(1)
                info.capabilities = EngineCapability(
                    formats=["doc", "docx", "odt", "rtf", "xls", "xlsx", "ods", "ppt", "pptx", "odp", "pdf"]
                )
                break
        return info


class PandocDetector(EngineDetector):
    name = "pandoc"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, _ = await self._run_command(["pandoc", "--version"])
        if code == 0:
            info.installed = True
            info.path = "pandoc"
            match = re.search(r"pandoc\s+([\d\.]+)", stdout)
            if match:
                info.version = match.group(1)
            info.capabilities = EngineCapability(
                formats=["md", "markdown", "html", "docx", "epub", "tex", "rst"]
            )
        return info


class TesseractDetector(EngineDetector):
    name = "tesseract"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, _ = await self._run_command(["tesseract", "--version"])
        if code == 0:
            info.installed = True
            info.path = "tesseract"
            match = re.search(r"tesseract\s+([\d\.]+)", stdout)
            if match:
                info.version = match.group(1)
                
            code_l, stdout_l, _ = await self._run_command(["tesseract", "--list-langs"])
            langs = []
            if code_l == 0:
                langs = [l.strip() for l in stdout_l.splitlines()[1:] if l.strip()]
            info.capabilities = EngineCapability(
                formats=["png", "jpg", "jpeg", "tiff", "pdf"],
                languages=langs
            )
        return info


ALL_DETECTORS = [
    FFmpegDetector(),
    ImageMagickDetector(),
    SevenZipDetector(),
    QpdfDetector(),
    PopplerDetector(),
    GhostscriptDetector(),
    LibreOfficeDetector(),
    PandocDetector(),
    TesseractDetector(),
]

