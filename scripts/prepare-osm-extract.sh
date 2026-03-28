#!/usr/bin/env bash
# Prépare un extrait OSM pour la bounding box Grenoble + couronne.
# Prérequis : osmium-tool   (apt install osmium-tool  /  brew install osmium-tool)
#
# Usage : bash scripts/prepare-osm-extract.sh
# Résultat : docker/osm/grenoble.osm.pbf  (~20 MB)
set -euo pipefail

SOURCE_URL="https://download.geofabrik.de/europe/france/rhone-alpes-latest.osm.pbf"
# Format osmium : ouest,sud,est,nord
BBOX="5.60,45.05,5.85,45.30"
TMP_FILE="/tmp/rhone-alpes.osm.pbf"
OUT_DIR="$(dirname "$0")/../docker/osm"
OUT_FILE="$OUT_DIR/grenoble.osm.pbf"

if ! command -v osmium &> /dev/null; then
  echo "osmium-tool non trouvé. Installez-le :"
  echo "  Ubuntu/Debian : sudo apt install osmium-tool"
  echo "  macOS         : brew install osmium-tool"
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Téléchargement de Rhône-Alpes (~500 MB)…"
curl -L --progress-bar -o "$TMP_FILE" "$SOURCE_URL"

echo "Découpe bbox $BBOX…"
osmium extract --bbox "$BBOX" "$TMP_FILE" -o "$OUT_FILE" --overwrite

rm "$TMP_FILE"
echo "Extrait prêt : $OUT_FILE ($(du -sh "$OUT_FILE" | cut -f1))"
