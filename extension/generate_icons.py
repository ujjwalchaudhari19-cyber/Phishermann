import sys
import subprocess
try:
    from PIL import Image, ImageDraw
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw
import os

os.makedirs("icons", exist_ok=True)

def create_shield(size, filename):
    img = Image.new("RGBA", (size, size), "#1a1a2e")
    d = ImageDraw.Draw(img)
    
    margin = size * 0.15
    d.polygon([
        (margin, margin),
        (size - margin, margin),
        (size - margin, size * 0.5),
        (size * 0.5, size - margin),
        (margin, size * 0.5)
    ], fill="#00ff88")
    
    img.save(filename)

create_shield(16, "icons/shield-16.png")
create_shield(48, "icons/shield-48.png")
create_shield(128, "icons/shield-128.png")
print("Icons generated!")
