import os
import math

os.makedirs("assets/stickers", exist_ok=True)

def iso_cube(cx, cy, r, top_col, left_col, right_col, stroke="#38bdf8", stroke_w=1.2, opacity=1.0, shadow_col="#0284c7"):
    cos30 = math.cos(math.radians(30))
    sin30 = math.sin(math.radians(30))
    
    top_v = (cx, cy - r)
    right_v = (cx + r * cos30, cy - r * sin30)
    left_v = (cx - r * cos30, cy - r * sin30)
    center_v = (cx, cy)
    bottom_v = (cx, cy + r)
    bot_left_v = (cx - r * cos30, cy + r * sin30)
    bot_right_v = (cx + r * cos30, cy + r * sin30)
    
    shadow_svg = f'<ellipse cx="{cx}" cy="{cy + r*1.25}" rx="{r*1.15}" ry="{r*0.35}" fill="{shadow_col}" opacity="0.3" filter="url(#glow-blur)"/>'
    top_path = f"M {top_v[0]:.1f},{top_v[1]:.1f} L {right_v[0]:.1f},{right_v[1]:.1f} L {center_v[0]:.1f},{center_v[1]:.1f} L {left_v[0]:.1f},{left_v[1]:.1f} Z"
    left_path = f"M {center_v[0]:.1f},{center_v[1]:.1f} L {left_v[0]:.1f},{left_v[1]:.1f} L {bot_left_v[0]:.1f},{bot_left_v[1]:.1f} L {bottom_v[0]:.1f},{bottom_v[1]:.1f} Z"
    right_path = f"M {center_v[0]:.1f},{center_v[1]:.1f} L {bottom_v[0]:.1f},{bottom_v[1]:.1f} L {bot_right_v[0]:.1f},{bot_right_v[1]:.1f} L {right_v[0]:.1f},{right_v[1]:.1f} Z"
    
    return f'''
    <g opacity="{opacity}">
        {shadow_svg}
        <path d="{top_path}" fill="{top_col}" stroke="{stroke}" stroke-width="{stroke_w}" stroke-linejoin="round"/>
        <path d="{left_path}" fill="{left_col}" stroke="{stroke}" stroke-width="{stroke_w}" stroke-linejoin="round"/>
        <path d="{right_path}" fill="{right_col}" stroke="{stroke}" stroke-width="{stroke_w}" stroke-linejoin="round"/>
    </g>'''

# 1. HERO 3D STUDIO BANNER (1200x520)
def generate_hero():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" width="100%" height="100%">
    <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#050814"/>
            <stop offset="50%" stop-color="#0a1024"/>
            <stop offset="100%" stop-color="#060917"/>
        </linearGradient>
        <linearGradient id="glow-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#818cf8"/>
            <stop offset="100%" stop-color="#c084fc"/>
        </linearGradient>
        <linearGradient id="cube-top-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="cube-left-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0369a1"/><stop offset="100%" stop-color="#082f49"/>
        </linearGradient>
        <linearGradient id="cube-right-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#0c4a6e"/>
        </linearGradient>
        
        <linearGradient id="cube-top-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#7e22ce"/>
        </linearGradient>
        <linearGradient id="cube-left-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#6b21a8"/><stop offset="100%" stop-color="#3b0764"/>
        </linearGradient>
        <linearGradient id="cube-right-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#7e22ce"/><stop offset="100%" stop-color="#581c87"/>
        </linearGradient>
        
        <linearGradient id="cube-top-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <linearGradient id="cube-left-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#047857"/><stop offset="100%" stop-color="#064e3b"/>
        </linearGradient>
        <linearGradient id="cube-right-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#065f46"/>
        </linearGradient>

        <linearGradient id="cube-top-4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fb923c"/><stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
        <linearGradient id="cube-left-4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#c2410c"/><stop offset="100%" stop-color="#7c2d12"/>
        </linearGradient>
        <linearGradient id="cube-right-4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ea580c"/><stop offset="100%" stop-color="#9a3412"/>
        </linearGradient>
        
        <linearGradient id="laser-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#818cf8" stop-opacity="1"/>
            <stop offset="100%" stop-color="#c084fc" stop-opacity="0.8"/>
        </linearGradient>
        
        <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
        </filter>
        <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
        </filter>
        <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
        
        <style>
            @keyframes floatSlow {{
                0%, 100% {{ transform: translateY(0px) rotate(0deg); }}
                50% {{ transform: translateY(-14px) rotate(1.5deg); }}
            }}
            @keyframes floatAlt {{
                0%, 100% {{ transform: translateY(0px) rotate(0deg); }}
                50% {{ transform: translateY(-18px) rotate(-2deg); }}
            }}
            @keyframes floatRev {{
                0%, 100% {{ transform: translateY(0px); }}
                50% {{ transform: translateY(12px); }}
            }}
            @keyframes rotateCore {{
                from {{ transform: rotate(0deg); }}
                to {{ transform: rotate(360deg); }}
            }}
            @keyframes rotateCoreRev {{
                from {{ transform: rotate(360deg); }}
                to {{ transform: rotate(0deg); }}
            }}
            @keyframes pulseGlow {{
                0%, 100% {{ opacity: 0.55; transform: scale(1); }}
                50% {{ opacity: 0.95; transform: scale(1.08); }}
            }}
            @keyframes laserDash {{
                to {{ stroke-dashoffset: -80; }}
            }}
            @keyframes beamPulse {{
                0%, 100% {{ opacity: 0.4; }}
                50% {{ opacity: 1; }}
            }}
            .floating-1 {{ animation: floatSlow 6s ease-in-out infinite; transform-origin: center; }}
            .floating-2 {{ animation: floatAlt 7s ease-in-out infinite; transform-origin: center; }}
            .floating-3 {{ animation: floatRev 5.5s ease-in-out infinite; transform-origin: center; }}
            .rotating-ring-1 {{ animation: rotateCore 20s linear infinite; transform-origin: 600px 330px; }}
            .rotating-ring-2 {{ animation: rotateCoreRev 14s linear infinite; transform-origin: 600px 330px; }}
            .pulsing-core {{ animation: pulseGlow 4s ease-in-out infinite; transform-origin: 600px 330px; }}
            .laser-stream {{ stroke-dasharray: 8 12; animation: laserDash 1.8s linear infinite; }}
            .laser-beam {{ animation: beamPulse 3s ease-in-out infinite; }}
            .title-text {{ font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; letter-spacing: -0.02em; }}
            .badge-text {{ font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 600; letter-spacing: 0.04em; }}
        </style>
    </defs>

    <!-- Background Base -->
    <rect width="1200" height="520" fill="url(#bg-grad)" rx="16"/>

    <!-- Subtle Isometric Grid Base Floor -->
    <g opacity="0.18">
        <path d="M 100,480 L 600,260 L 1100,480" stroke="#38bdf8" stroke-width="1.2" fill="none"/>
        <path d="M 200,490 L 600,280 L 1000,490" stroke="#818cf8" stroke-width="1" fill="none"/>
        <path d="M 300,500 L 600,300 L 900,500" stroke="#38bdf8" stroke-width="1" fill="none"/>
        <path d="M 600,260 L 600,510" stroke="#a855f7" stroke-width="1.2" fill="none"/>
        <path d="M 350,370 L 850,370" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="4 6"/>
        <path d="M 250,420 L 950,420" stroke="#818cf8" stroke-width="0.8" stroke-dasharray="4 6"/>
    </g>

    <!-- Ambient Core Glow -->
    <circle cx="600" cy="330" r="140" fill="#38bdf8" opacity="0.15" filter="url(#glow-blur)"/>
    <circle cx="600" cy="330" r="80" fill="#a855f7" opacity="0.25" filter="url(#glow-blur)"/>

    <!-- Laser Stream Conduits to Core -->
    <g filter="url(#laser-glow)">
        <!-- Node 1 (Media Cube) to Center -->
        <path d="M 240,320 Q 420,340 550,330" fill="none" stroke="#38bdf8" stroke-width="2.5" class="laser-stream"/>
        <!-- Node 2 (Doc Cube) to Center -->
        <path d="M 380,210 Q 480,260 560,310" fill="none" stroke="#34d399" stroke-width="2.5" class="laser-stream"/>
        <!-- Node 3 (PDF Cube) to Center -->
        <path d="M 960,320 Q 780,340 650,330" fill="none" stroke="#fb923c" stroke-width="2.5" class="laser-stream"/>
        <!-- Node 4 (Code/Archive) to Center -->
        <path d="M 820,210 Q 720,260 640,310" fill="none" stroke="#c084fc" stroke-width="2.5" class="laser-stream"/>
    </g>

    <!-- CENTRAL ISOMETRIC PEDESTAL & ROTATING HOLOGRAPHIC CORE -->
    <g id="center-reactor">
        <!-- Isometric Base Pedestal -->
        <path d="M 600,370 L 690,320 L 600,270 L 510,320 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" opacity="0.9"/>
        <path d="M 510,320 L 600,370 L 600,395 L 510,345 Z" fill="#090d16" stroke="#0284c7" stroke-width="1.5"/>
        <path d="M 600,370 L 690,320 L 690,345 L 600,395 Z" fill="#040711" stroke="#0369a1" stroke-width="1.5"/>
        
        <!-- Rotating Hologram Ring 1 -->
        <g class="rotating-ring-1">
            <ellipse cx="600" cy="330" rx="90" ry="32" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="14 8 30 10" opacity="0.85"/>
            <circle cx="690" cy="330" r="3" fill="#38bdf8"/>
            <circle cx="510" cy="330" r="3" fill="#38bdf8"/>
        </g>
        
        <!-- Rotating Hologram Ring 2 -->
        <g class="rotating-ring-2">
            <ellipse cx="600" cy="330" rx="120" ry="42" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="25 15 8 12" opacity="0.75"/>
            <circle cx="720" cy="330" r="3.5" fill="#c084fc"/>
            <circle cx="480" cy="330" r="3.5" fill="#c084fc"/>
        </g>
        
        <!-- Glowing Reactor Sphere -->
        <circle cx="600" cy="325" r="28" fill="url(#glow-core)" class="pulsing-core" filter="url(#soft-glow)"/>
        <circle cx="600" cy="325" r="16" fill="#ffffff" opacity="0.9"/>
        
        <!-- Vertical Energy Beam Column -->
        <line x1="600" y1="210" x2="600" y2="410" stroke="#38bdf8" stroke-width="2" opacity="0.7" stroke-dasharray="6 4" class="laser-beam"/>
        <line x1="600" y1="260" x2="600" y2="390" stroke="#ffffff" stroke-width="1" opacity="0.9"/>
    </g>

    <!-- FLOATING 3D ISOMETRIC CUBES -->
    <!-- 1. Media Cube (Left) -->
    <g class="floating-1">
        {iso_cube(240, 310, 48, "url(#cube-top-1)", "url(#cube-left-1)", "url(#cube-right-1)", stroke="#38bdf8", shadow_col="#0284c7")}
        <!-- Media Glyph on Top Face -->
        <polygon points="234,295 248,303 234,311" fill="#ffffff" opacity="0.95"/>
        <text x="240" y="380" fill="#38bdf8" font-size="12" text-anchor="middle" class="badge-text">VIDEO • AUDIO</text>
        <text x="240" y="396" fill="#94a3b8" font-size="10" text-anchor="middle" class="badge-text">FFmpeg Engine</text>
    </g>

    <!-- 2. Documents & Markdown Cube (Upper Left) -->
    <g class="floating-2">
        {iso_cube(380, 200, 40, "url(#cube-top-3)", "url(#cube-left-3)", "url(#cube-right-3)", stroke="#34d399", shadow_col="#059669")}
        <!-- Doc Lines Glyph -->
        <path d="M 374,192 L 386,192 M 374,197 L 386,197 M 374,202 L 382,202" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <text x="380" y="260" fill="#34d399" font-size="12" text-anchor="middle" class="badge-text">DOCUMENTS</text>
        <text x="380" y="275" fill="#94a3b8" font-size="10" text-anchor="middle" class="badge-text">Pandoc • LibreOffice</text>
    </g>

    <!-- 3. PDF Core Cube (Right) -->
    <g class="floating-3">
        {iso_cube(960, 310, 48, "url(#cube-top-4)", "url(#cube-left-4)", "url(#cube-right-4)", stroke="#fb923c", shadow_col="#ea580c")}
        <!-- PDF Glyph -->
        <text x="960" y="306" fill="#ffffff" font-size="15" font-weight="bold" text-anchor="middle" font-family="monospace">PDF</text>
        <text x="960" y="380" fill="#fb923c" font-size="12" text-anchor="middle" class="badge-text">PDF STUDIO</text>
        <text x="960" y="396" fill="#94a3b8" font-size="10" text-anchor="middle" class="badge-text">Poppler • QPDF • GS</text>
    </g>

    <!-- 4. Pipeline & Archive Cube (Upper Right) -->
    <g class="floating-1">
        {iso_cube(820, 200, 40, "url(#cube-top-2)", "url(#cube-left-2)", "url(#cube-right-2)", stroke="#c084fc", shadow_col="#7e22ce")}
        <!-- Code / Archive Glyph -->
        <path d="M 813,197 L 808,201 L 813,205 M 827,197 L 832,201 L 827,205" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <text x="820" y="260" fill="#c084fc" font-size="12" text-anchor="middle" class="badge-text">PIPELINES</text>
        <text x="820" y="275" fill="#94a3b8" font-size="10" text-anchor="middle" class="badge-text">7-Zip • Multi-Step</text>
    </g>

    <!-- 5. Floating 3D Security Shield Badge (Hovering at top center) -->
    <g class="floating-2">
        <polygon points="600,105 628,118 628,142 600,158 572,142 572,118" fill="#1e1b4b" stroke="#818cf8" stroke-width="2.2" filter="url(#soft-glow)"/>
        <!-- Shield inner emblem -->
        <path d="M 593,132 L 600,125 L 607,132 M 600,126 L 600,143" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="600" cy="132" r="2.5" fill="#ffffff"/>
        <!-- Pulse ring -->
        <circle cx="600" cy="132" r="28" fill="none" stroke="#818cf8" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>
    </g>

    <!-- HEADER TITLE & BRANDING -->
    <g>
        <!-- Top Pill Badge -->
        <rect x="440" y="28" width="320" height="28" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" opacity="0.95"/>
        <circle cx="456" cy="42" r="4.5" fill="#10b981"/>
        <circle cx="456" cy="42" r="8" fill="none" stroke="#10b981" opacity="0.4" stroke-width="1.5"/>
        <text x="472" y="46" fill="#38bdf8" font-size="11" class="badge-text">100% LOCAL-FIRST • ZERO EXTERNAL APIS</text>

        <!-- Main Title -->
        <text x="600" y="92" text-anchor="middle" font-size="38" fill="#ffffff" class="title-text">
            UNIVERSAL FILE STUDIO
        </text>
        <text x="600" y="92" text-anchor="middle" font-size="38" fill="url(#glow-core)" opacity="0.3" filter="url(#soft-glow)" class="title-text">
            UNIVERSAL FILE STUDIO
        </text>

        <!-- Subtitle -->
        <text x="600" y="116" text-anchor="middle" font-size="14" fill="#94a3b8" class="badge-text">
            High-Performance Conversion, Multi-Step Pipelines, Privacy Sandboxing &amp; CLI Matrix
        </text>
    </g>

    <!-- BOTTOM STATS PILLS -->
    <g transform="translate(160, 460)">
        <!-- Pill 1: 9 Production Engines -->
        <g transform="translate(0, 0)">
            <rect width="195" height="34" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1" opacity="0.9"/>
            <text x="18" y="22" fill="#38bdf8" font-size="13">⚡</text>
            <text x="38" y="21" fill="#f1f5f9" font-size="11.5" class="badge-text">9 Local CLI Engines</text>
        </g>
        <!-- Pill 2: Realtime WebSockets -->
        <g transform="translate(225, 0)">
            <rect width="205" height="34" rx="8" fill="#0f172a" stroke="#a855f7" stroke-width="1" opacity="0.9"/>
            <text x="18" y="22" fill="#c084fc" font-size="13">📡</text>
            <text x="38" y="21" fill="#f1f5f9" font-size="11.5" class="badge-text">WebSocket Realtime Hub</text>
        </g>
        <!-- Pill 3: Autonomous Pipelines -->
        <g transform="translate(460, 0)">
            <rect width="205" height="34" rx="8" fill="#0f172a" stroke="#34d399" stroke-width="1" opacity="0.9"/>
            <text x="18" y="22" fill="#34d399" font-size="13">🧬</text>
            <text x="38" y="21" fill="#f1f5f9" font-size="11.5" class="badge-text">Multi-Step Pipelines</text>
        </g>
        <!-- Pill 4: Standalone CLI -->
        <g transform="translate(695, 0)">
            <rect width="185" height="34" rx="8" fill="#0f172a" stroke="#fb923c" stroke-width="1" opacity="0.9"/>
            <text x="18" y="22" fill="#fb923c" font-size="13">💻</text>
            <text x="38" y="21" fill="#f1f5f9" font-size="11.5" class="badge-text">Standalone CLI ('ufs')</text>
        </g>
    </g>
</svg>'''
    with open("assets/hero-3d-studio.svg", "w", encoding="utf-8") as f:
        f.write(svg.strip())
    print("Created assets/hero-3d-studio.svg")

# 2. 3D PIPELINE FLOW VISUALIZER (1000x340)
def generate_pipeline_flow():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 340" width="100%" height="100%">
    <defs>
        <linearGradient id="pipe-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#080c1d"/>
            <stop offset="100%" stop-color="#0a122c"/>
        </linearGradient>
        <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#818cf8"/>
            <stop offset="100%" stop-color="#34d399"/>
        </linearGradient>
        <filter id="p-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5"/>
        </filter>
        <filter id="node-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8"/>
        </filter>
        <style>
            @keyframes packetTravel {{
                0% {{ stroke-dashoffset: 120; }}
                100% {{ stroke-dashoffset: 0; }}
            }}
            @keyframes pulseStep {{
                0%, 100% {{ transform: scale(1); filter: drop-shadow(0 0 4px #38bdf8); }}
                50% {{ transform: scale(1.04); filter: drop-shadow(0 0 12px #818cf8); }}
            }}
            @keyframes scanSweep {{
                0% {{ transform: translateY(-20px); opacity: 0.2; }}
                50% {{ opacity: 0.9; }}
                100% {{ transform: translateY(20px); opacity: 0.2; }}
            }}
            .data-cable {{ stroke: #1e293b; stroke-width: 6; stroke-linecap: round; }}
            .data-pulse {{ stroke: url(#beam-grad); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 18 36; animation: packetTravel 2s linear infinite; }}
            .step-node {{ transform-origin: center; animation: pulseStep 4s ease-in-out infinite; }}
            .scan-line {{ animation: scanSweep 2.5s ease-in-out infinite; }}
            .mono-text {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; }}
            .heading {{ font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-weight: 700; }}
        </style>
    </defs>

    <rect width="1000" height="340" rx="14" fill="url(#pipe-bg)" stroke="#1e293b" stroke-width="1.5"/>

    <!-- Title Bar -->
    <text x="40" y="42" fill="#f8fafc" font-size="18" class="heading">Multi-Step Execution Pipeline</text>
    <text x="40" y="60" fill="#64748b" font-size="12" class="mono-text">Isolated Temporary Workspace • Zero-Telemetry Intermediate Streaming</text>
    <g transform="translate(780, 32)">
        <rect width="180" height="26" rx="13" fill="#0f172a" stroke="#10b981" stroke-width="1"/>
        <circle cx="796" cy="45" r="4" fill="#10b981"/>
        <text x="810" y="49" fill="#10b981" font-size="11" class="heading">WORKFLOW RUNNER: IDLE</text>
    </g>

    <!-- Main Connecting Energy Conduits -->
    <g>
        <!-- Segment 1 -> 2 -->
        <path d="M 180,180 L 370,180" class="data-cable"/>
        <path d="M 180,180 L 370,180" class="data-pulse"/>
        <!-- Segment 2 -> 3 -->
        <path d="M 470,180 L 630,180" class="data-cable"/>
        <path d="M 470,180 L 630,180" class="data-pulse"/>
        <!-- Segment 3 -> 4 -->
        <path d="M 730,180 L 870,180" class="data-cable"/>
        <path d="M 730,180 L 870,180" class="data-pulse"/>
    </g>

    <!-- STAGE 1: INGESTION -->
    <g transform="translate(130, 180)">
        <ellipse cx="0" cy="40" rx="45" ry="14" fill="#0284c7" opacity="0.3" filter="url(#node-shadow)"/>
        {iso_cube(0, 0, 32, "#38bdf8", "#0369a1", "#0284c7", stroke="#7dd3fc", stroke_w=1.2)}
        <!-- Document tag -->
        <rect x="-35" y="48" width="70" height="20" rx="10" fill="#0369a1" stroke="#38bdf8" stroke-width="1"/>
        <text x="0" y="62" fill="#ffffff" font-size="10" text-anchor="middle" class="mono-text">RAW INPUT</text>
        <text x="0" y="-45" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle" class="heading">01. INGEST</text>
        <text x="0" y="-32" fill="#94a3b8" font-size="10" text-anchor="middle" class="mono-text">MIME Auto-Detect</text>
    </g>

    <!-- STAGE 2: PROCESSING ENGINE CORE -->
    <g transform="translate(420, 180)">
        <ellipse cx="0" cy="48" rx="55" ry="16" fill="#818cf8" opacity="0.35" filter="url(#node-shadow)"/>
        {iso_cube(0, 0, 42, "#a855f7", "#6b21a8", "#7e22ce", stroke="#c084fc", stroke_w=1.5)}
        <!-- Engine gear rotating -->
        <circle cx="0" cy="0" r="14" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4" opacity="0.8"/>
        <circle cx="0" cy="0" r="5" fill="#ffffff"/>
        
        <rect x="-48" y="58" width="96" height="20" rx="10" fill="#4c1d95" stroke="#a855f7" stroke-width="1"/>
        <text x="0" y="72" fill="#ffffff" font-size="10" text-anchor="middle" class="mono-text">TRANSFORM</text>
        <text x="0" y="-55" fill="#c084fc" font-size="12" font-weight="bold" text-anchor="middle" class="heading">02. ENGINE CORE</text>
        <text x="0" y="-42" fill="#94a3b8" font-size="10" text-anchor="middle" class="mono-text">FFmpeg • Pandoc • LO</text>
    </g>

    <!-- STAGE 3: PRIVACY & OCR SCANNER -->
    <g transform="translate(680, 180)">
        <ellipse cx="0" cy="40" rx="45" ry="14" fill="#059669" opacity="0.3" filter="url(#node-shadow)"/>
        {iso_cube(0, 0, 34, "#34d399", "#047857", "#059669", stroke="#6ee7b7", stroke_w=1.2)}
        <!-- Laser Scanner Bar inside -->
        <line x1="-18" y1="0" x2="18" y2="0" stroke="#ffffff" stroke-width="2" class="scan-line" filter="url(#p-glow)"/>
        
        <rect x="-42" y="50" width="84" height="20" rx="10" fill="#065f46" stroke="#34d399" stroke-width="1"/>
        <text x="0" y="64" fill="#ffffff" font-size="10" text-anchor="middle" class="mono-text">EXIF SANITIZE</text>
        <text x="0" y="-47" fill="#34d399" font-size="12" font-weight="bold" text-anchor="middle" class="heading">03. INSPECT</text>
        <text x="0" y="-34" fill="#94a3b8" font-size="10" text-anchor="middle" class="mono-text">SHA-256 • OCR Text</text>
    </g>

    <!-- STAGE 4: ARTIFACT DISPATCH & ARCHIVE -->
    <g transform="translate(900, 180)">
        <ellipse cx="0" cy="45" rx="48" ry="15" fill="#ea580c" opacity="0.3" filter="url(#node-shadow)"/>
        {iso_cube(0, 0, 36, "#fb923c", "#c2410c", "#ea580c", stroke="#fdba74", stroke_w=1.2)}
        <!-- Checkmark Glyph -->
        <polyline points="-10,2 -2,10 12,-6" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        
        <rect x="-45" y="52" width="90" height="20" rx="10" fill="#9a3412" stroke="#fb923c" stroke-width="1"/>
        <text x="0" y="66" fill="#ffffff" font-size="10" text-anchor="middle" class="mono-text">ZIP ARCHIVE</text>
        <text x="0" y="-49" fill="#fb923c" font-size="12" font-weight="bold" text-anchor="middle" class="heading">04. DISPATCH</text>
        <text x="0" y="-36" fill="#94a3b8" font-size="10" text-anchor="middle" class="mono-text">Outputs Ready</text>
    </g>

    <!-- Progress Flow Footer -->
    <g transform="translate(40, 300)">
        <text x="0" y="16" fill="#64748b" font-size="11" class="mono-text">STEP EXECUTION: ISOLATED SUBPROCESS &gt;&gt; REAL-TIME WEBSOCKET PROGRESS (0-100%) &gt;&gt; CLEANUP TMPDIR</text>
    </g>
</svg>'''
    with open("assets/pipeline-flow-3d.svg", "w", encoding="utf-8") as f:
        f.write(svg.strip())
    print("Created assets/pipeline-flow-3d.svg")

# 3. 3D ENGINES MATRIX (1050x260)
def generate_engines_matrix():
    engines = [
        ("FFmpeg", "v6 / v7", "Video & Audio", "#38bdf8", "#0369a1", "#0284c7"),
        ("ImageMagick", "v7.1", "Raster / Vector", "#34d399", "#047857", "#059669"),
        ("7-Zip", "v24+", "Archive Engine", "#818cf8", "#4338ca", "#4f46e5"),
        ("Poppler", "v24+", "PDF Renderer", "#fb7185", "#be123c", "#e11d48"),
        ("Ghostscript", "v10+", "Postscript & PDF", "#f43f5e", "#9f1239", "#be123c"),
        ("LibreOffice", "v24+", "Office Documents", "#a855f7", "#6b21a8", "#7e22ce"),
        ("Pandoc", "v3.12+", "Universal Markup", "#06b6d4", "#0e7490", "#0891b2"),
        ("QPDF", "v12.4+", "PDF Encryption", "#ec4899", "#9d174d", "#be185d"),
        ("Tesseract", "v5.5+", "Neural OCR", "#f59e0b", "#b45309", "#d97706"),
    ]
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 260" width="100%" height="100%">
    <defs>
        <linearGradient id="eng-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#070a18"/>
            <stop offset="100%" stop-color="#0b1126"/>
        </linearGradient>
        <filter id="eng-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6"/>
        </filter>
        <style>
            @keyframes bob {{
                0%, 100% {{ transform: translateY(0); }}
                50% {{ transform: translateY(-6px); }}
            }}
            .cube-group {{ transform-origin: center; animation: bob 4s ease-in-out infinite; }}
            .cube-group:nth-child(2) {{ animation-delay: 0.4s; }}
            .cube-group:nth-child(3) {{ animation-delay: 0.8s; }}
            .cube-group:nth-child(4) {{ animation-delay: 1.2s; }}
            .cube-group:nth-child(5) {{ animation-delay: 1.6s; }}
            .cube-group:nth-child(6) {{ animation-delay: 2.0s; }}
            .cube-group:nth-child(7) {{ animation-delay: 2.4s; }}
            .cube-group:nth-child(8) {{ animation-delay: 2.8s; }}
            .cube-group:nth-child(9) {{ animation-delay: 3.2s; }}
            .eng-title {{ font-family: system-ui, -apple-system, sans-serif; font-weight: 700; font-size: 12px; }}
            .eng-sub {{ font-family: ui-monospace, monospace; font-size: 9.5px; fill: #94a3b8; }}
        </style>
    </defs>

    <rect width="1050" height="260" rx="14" fill="url(#eng-bg)" stroke="#1e293b" stroke-width="1.5"/>

    <!-- Section Header -->
    <text x="35" y="36" fill="#f8fafc" font-size="16" font-family="system-ui, sans-serif" font-weight="700">9 Production Engine Powerhouse</text>
    <text x="35" y="52" fill="#64748b" font-size="11" font-family="ui-monospace, monospace">ALL ENGINES NATIVELY DETECTED &amp; EXECUTED LOCALLY</text>

    <!-- Status Active Badge -->
    <g transform="translate(860, 24)">
        <rect width="150" height="26" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1"/>
        <circle cx="876" cy="37" r="4" fill="#10b981"/>
        <text x="890" y="41" fill="#10b981" font-size="11" font-family="system-ui, sans-serif" font-weight="600">9 / 9 ACTIVE</text>
    </g>

    <!-- 9 3D Isometric Engine Cubes -->
    <g transform="translate(60, 140)">'''
    
    spacing = 105
    for i, (name, ver, cat, top_c, left_c, right_c) in enumerate(engines):
        cx = i * spacing
        cube_code = iso_cube(cx, 0, 26, top_c, left_c, right_c, stroke="#ffffff", stroke_w=0.8, shadow_col=left_c)
        svg += f'''
        <g class="cube-group">
            {cube_code}
            <!-- Status Dot -->
            <circle cx="{cx}" cy="-34" r="3.5" fill="#10b981"/>
            <!-- Engine Label -->
            <text x="{cx}" y="42" fill="#ffffff" text-anchor="middle" class="eng-title">{name}</text>
            <text x="{cx}" y="56" text-anchor="middle" class="eng-sub">{cat}</text>
            <text x="{cx}" y="70" text-anchor="middle" fill="{top_c}" font-size="9px" font-family="monospace">{ver}</text>
        </g>'''

    svg += '''
    </g>
</svg>'''
    with open("assets/engines-matrix-3d.svg", "w", encoding="utf-8") as f:
        f.write(svg.strip())
    print("Created assets/engines-matrix-3d.svg")

# 4. 3D STICKERS
def generate_stickers():
    # Sticker 1: 100% Local Privacy Shield
    s1 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">
    <defs>
        <linearGradient id="stk-sh-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <filter id="stk-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6"/>
        </filter>
        <style>
            @keyframes tilt3d {
                0%, 100% { transform: rotate(-2deg) scale(1); }
                50% { transform: rotate(2deg) scale(1.03); }
            }
            .stk-wrap { transform-origin: center; animation: tilt3d 5s ease-in-out infinite; }
        </style>
    </defs>
    <!-- Sticker White Border / Peel Effect -->
    <g class="stk-wrap">
        <!-- White Die-Cut Base -->
        <polygon points="120,8 206,42 206,128 120,172 34,128 34,42" fill="#ffffff" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))"/>
        <!-- Inner Dark Shield -->
        <polygon points="120,14 198,46 198,124 120,164 42,124 42,46" fill="url(#stk-sh-grad)"/>
        <!-- Shield Highlight Reflection -->
        <polygon points="120,18 194,48 120,85 46,48" fill="#ffffff" opacity="0.18"/>
        <!-- Icon Glyph: Lock & Keyhole -->
        <rect x="105" y="70" width="30" height="24" rx="4" fill="#ffffff"/>
        <path d="M 110,70 L 110,58 A 10,10 0 0,1 130,58 L 130,70" fill="none" stroke="#ffffff" stroke-width="4"/>
        <circle cx="120" cy="80" r="3" fill="#0284c7"/>
        <line x1="120" y1="83" x2="120" y2="88" stroke="#0284c7" stroke-width="2"/>
        <!-- Sticker Typography -->
        <text x="120" y="118" fill="#ffffff" font-size="12" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" letter-spacing="1">100% LOCAL</text>
        <text x="120" y="134" fill="#38bdf8" font-size="9" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle" letter-spacing="0.5">ZERO TELEMETRY</text>
        <text x="120" y="148" fill="#94a3b8" font-size="8" font-family="monospace" text-anchor="middle">AIR-GAPPED READY</text>
    </g>
</svg>'''
    with open("assets/stickers/sticker-local-shield.svg", "w", encoding="utf-8") as f:
        f.write(s1.strip())
    print("Created sticker-local-shield.svg")

    # Sticker 2: 9 Engines Turbo Badge
    s2 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">
    <defs>
        <linearGradient id="stk-eng-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#a855f7"/>
            <stop offset="100%" stop-color="#3b0764"/>
        </linearGradient>
        <style>
            @keyframes pulseEng {
                0%, 100% { transform: scale(1) rotate(1deg); }
                50% { transform: scale(1.04) rotate(-1deg); }
            }
            .stk-eng { transform-origin: center; animation: pulseEng 4s ease-in-out infinite; }
        </style>
    </defs>
    <g class="stk-eng">
        <polygon points="120,6 210,38 210,140 120,174 30,140 30,38" fill="#ffffff" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))"/>
        <polygon points="120,12 202,42 202,134 120,166 38,134 38,42" fill="url(#stk-eng-grad)"/>
        <!-- Specular shine -->
        <polygon points="120,16 198,44 120,90 42,44" fill="#ffffff" opacity="0.2"/>
        <!-- Lightning bolt -->
        <polygon points="124,48 102,82 118,82 114,106 138,72 122,72" fill="#fbbf24"/>
        <text x="120" y="124" fill="#ffffff" font-size="12" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">9 HYPER-ENGINES</text>
        <text x="120" y="140" fill="#e9d5ff" font-size="9" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">FFMPEG • PANDOC • GS</text>
        <text x="120" y="152" fill="#c084fc" font-size="8" font-family="monospace" text-anchor="middle">NATIVE EXECUTION</text>
    </g>
</svg>'''
    with open("assets/stickers/sticker-9-engines.svg", "w", encoding="utf-8") as f:
        f.write(s2.strip())
    print("Created sticker-9-engines.svg")

    # Sticker 3: Lightning Speed / WebSocket Streaming
    s3 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">
    <defs>
        <linearGradient id="stk-ws-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#064e3b"/>
        </linearGradient>
        <style>
            @keyframes pulseWs {
                0%, 100% { transform: rotate(-2deg); }
                50% { transform: rotate(1deg) scale(1.03); }
            }
            .stk-ws { transform-origin: center; animation: pulseWs 4.5s ease-in-out infinite; }
        </style>
    </defs>
    <g class="stk-ws">
        <circle cx="120" cy="90" r="82" fill="#ffffff" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))"/>
        <circle cx="120" cy="90" r="76" fill="url(#stk-ws-grad)"/>
        <!-- Shine reflection -->
        <path d="M 46,80 A 74,74 0 0,1 194,80 Z" fill="#ffffff" opacity="0.18"/>
        <!-- Radar wave icon -->
        <circle cx="120" cy="74" r="8" fill="#ffffff"/>
        <path d="M 102,74 A 18,18 0 0,1 138,74" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <path d="M 92,74 A 28,28 0 0,1 148,74" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        <text x="120" y="116" fill="#ffffff" font-size="11" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">LIVE WEBSOCKETS</text>
        <text x="120" y="132" fill="#a7f3d0" font-size="9" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">ZERO-POLLING EVENT BUS</text>
        <text x="120" y="146" fill="#6ee7b7" font-size="8" font-family="monospace" text-anchor="middle">100% REACTIVE PUSH</text>
    </g>
</svg>'''
    with open("assets/stickers/sticker-lightning-speed.svg", "w", encoding="utf-8") as f:
        f.write(s3.strip())
    print("Created sticker-lightning-speed.svg")

    # Sticker 4: Standalone CLI Powerhouse
    s4 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">
    <defs>
        <linearGradient id="stk-cli-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#7c2d12"/>
        </linearGradient>
        <style>
            @keyframes tiltCli {
                0%, 100% { transform: rotate(2deg); }
                50% { transform: rotate(-2deg) scale(1.02); }
            }
            .stk-cli { transform-origin: center; animation: tiltCli 6s ease-in-out infinite; }
        </style>
    </defs>
    <g class="stk-cli">
        <rect x="25" y="15" width="190" height="150" rx="18" fill="#ffffff" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))"/>
        <rect x="31" y="21" width="178" height="138" rx="12" fill="url(#stk-cli-grad)"/>
        <!-- Terminal Header dots -->
        <circle cx="50" cy="38" r="4" fill="#fca5a5"/>
        <circle cx="62" cy="38" r="4" fill="#fef08a"/>
        <circle cx="74" cy="38" r="4" fill="#86efac"/>
        <!-- Terminal Prompt Code -->
        <text x="50" y="74" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">$ ./ufs run</text>
        <text x="50" y="94" fill="#fed7aa" font-family="monospace" font-size="11">✓ pipeline finished</text>
        <!-- Sticker Typography -->
        <text x="120" y="126" fill="#ffffff" font-size="11.5" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">STANDALONE CLI</text>
        <text x="120" y="142" fill="#ffedd5" font-size="8.5" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">SCRIPTING &amp; AUTOMATION</text>
    </g>
</svg>'''
    with open("assets/stickers/sticker-cli-terminal.svg", "w", encoding="utf-8") as f:
        f.write(s4.strip())
    print("Created sticker-cli-terminal.svg")

# 5. 3D HUD STATS BANNER (1000x160)
def generate_hud_stats():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 160" width="100%" height="100%">
    <defs>
        <linearGradient id="hud-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#050814"/>
            <stop offset="100%" stop-color="#0a1026"/>
        </linearGradient>
        <style>
            .hud-card {{ fill: #0f172a; stroke: #1e293b; stroke-width: 1.2; rx: 10px; }}
            .hud-num {{ font-family: ui-monospace, monospace; font-size: 28px; font-weight: 800; }}
            .hud-lbl {{ font-family: system-ui, -apple-system, sans-serif; font-size: 11px; font-weight: 600; fill: #94a3b8; letter-spacing: 0.05em; }}
        </style>
    </defs>
    <rect width="1000" height="160" rx="14" fill="url(#hud-bg)" stroke="#1e293b" stroke-width="1.5"/>

    <g transform="translate(30, 24)">
        <!-- Card 1: Cloud Ping -->
        <g transform="translate(0, 0)">
            <rect width="215" height="112" rx="10" fill="#0c1328" stroke="#38bdf8" stroke-width="1" opacity="0.9"/>
            <text x="24" y="52" fill="#38bdf8" class="hud-num">0 ms</text>
            <text x="24" y="78" class="hud-lbl">CLOUD LATENCY</text>
            <text x="24" y="96" fill="#64748b" font-size="10" font-family="system-ui, sans-serif">100% On-Device Processing</text>
        </g>
        <!-- Card 2: Engines Online -->
        <g transform="translate(242, 0)">
            <rect width="215" height="112" rx="10" fill="#0c1328" stroke="#10b981" stroke-width="1" opacity="0.9"/>
            <text x="24" y="52" fill="#10b981" class="hud-num">9 / 9</text>
            <text x="24" y="78" class="hud-lbl">CLI ENGINES ACTIVE</text>
            <text x="24" y="96" fill="#64748b" font-size="10" font-family="system-ui, sans-serif">FFmpeg, Pandoc, OCR &amp; LO</text>
        </g>
        <!-- Card 3: Formats Supported -->
        <g transform="translate(484, 0)">
            <rect width="215" height="112" rx="10" fill="#0c1328" stroke="#a855f7" stroke-width="1" opacity="0.9"/>
            <text x="24" y="52" fill="#c084fc" class="hud-num">40+</text>
            <text x="24" y="78" class="hud-lbl">FORMAT COMPATIBILITY</text>
            <text x="24" y="96" fill="#64748b" font-size="10" font-family="system-ui, sans-serif">Video, Audio, Docs, Vector, Zip</text>
        </g>
        <!-- Card 4: Data Leak Risk -->
        <g transform="translate(726, 0)">
            <rect width="215" height="112" rx="10" fill="#0c1328" stroke="#f59e0b" stroke-width="1" opacity="0.9"/>
            <text x="24" y="52" fill="#fbbf24" class="hud-num">0.00%</text>
            <text x="24" y="78" class="hud-lbl">EXTERNAL DATA LEAK</text>
            <text x="24" y="96" fill="#64748b" font-size="10" font-family="system-ui, sans-serif">Strict Path Traversal Guards</text>
        </g>
    </g>
</svg>'''
    with open("assets/hud-stats-3d.svg", "w", encoding="utf-8") as f:
        f.write(svg.strip())
    print("Created assets/hud-stats-3d.svg")

# 6. GLOWING DIVIDER
def generate_divider():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 24" width="100%" height="24">
    <defs>
        <linearGradient id="div-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
            <stop offset="30%" stop-color="#38bdf8" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#a855f7" stop-opacity="1"/>
            <stop offset="70%" stop-color="#38bdf8" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
        </linearGradient>
    </defs>
    <line x1="50" y1="12" x2="950" y2="12" stroke="url(#div-grad)" stroke-width="1.8"/>
    <circle cx="500" cy="12" r="4" fill="#c084fc"/>
    <circle cx="500" cy="12" r="7" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.7"/>
</svg>'''
    with open("assets/divider-3d.svg", "w", encoding="utf-8") as f:
        f.write(svg.strip())
    print("Created assets/divider-3d.svg")

if __name__ == "__main__":
    generate_hero()
    generate_pipeline_flow()
    generate_engines_matrix()
    generate_stickers()
    generate_hud_stats()
    generate_divider()
    print("All 3D and dynamic visual assets successfully generated!")
