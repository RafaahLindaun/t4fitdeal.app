#!/usr/bin/env bash
set -euo pipefail

icon_dir="ios/App/App/Assets.xcassets/AppIcon.appiconset"
source_icon="public/logo/accqua-ios-icon.png"

test -f "$source_icon"
rm -rf "$icon_dir"
mkdir -p "$icon_dir"

make_icon() {
  local pixels="$1"
  local filename="$2"
  sips -z "$pixels" "$pixels" "$source_icon" --out "$icon_dir/$filename" >/dev/null
}

make_icon 40 icon-20@2x.png
make_icon 60 icon-20@3x.png
make_icon 58 icon-29@2x.png
make_icon 87 icon-29@3x.png
make_icon 80 icon-40@2x.png
make_icon 120 icon-40@3x.png
make_icon 120 icon-60@2x.png
make_icon 180 icon-60@3x.png
make_icon 76 icon-76@1x.png
make_icon 152 icon-76@2x.png
make_icon 167 icon-83.5@2x.png
make_icon 1024 icon-1024.png

cat > "$icon_dir/Contents.json" <<'JSON'
{
  "images": [
    { "filename": "icon-20@2x.png", "idiom": "iphone", "scale": "2x", "size": "20x20" },
    { "filename": "icon-20@3x.png", "idiom": "iphone", "scale": "3x", "size": "20x20" },
    { "filename": "icon-29@2x.png", "idiom": "iphone", "scale": "2x", "size": "29x29" },
    { "filename": "icon-29@3x.png", "idiom": "iphone", "scale": "3x", "size": "29x29" },
    { "filename": "icon-40@2x.png", "idiom": "iphone", "scale": "2x", "size": "40x40" },
    { "filename": "icon-40@3x.png", "idiom": "iphone", "scale": "3x", "size": "40x40" },
    { "filename": "icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },
    { "filename": "icon-60@3x.png", "idiom": "iphone", "scale": "3x", "size": "60x60" },
    { "filename": "icon-76@1x.png", "idiom": "ipad", "scale": "1x", "size": "76x76" },
    { "filename": "icon-76@2x.png", "idiom": "ipad", "scale": "2x", "size": "76x76" },
    { "filename": "icon-83.5@2x.png", "idiom": "ipad", "scale": "2x", "size": "83.5x83.5" },
    { "filename": "icon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
JSON
