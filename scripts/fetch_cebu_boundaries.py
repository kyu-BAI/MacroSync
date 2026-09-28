import urllib.request
import json
import os

url = 'https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2011/geojson/municties/hires/municities-province-25-cebu.0.1.json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req)
data = json.loads(res.read().decode('utf-8'))

name_map = {
    'Cordoba': 'Cordova',
    'Pinamungahan': 'Pinamungajan',
    'Carcar': 'Carcar City',
    'Bogo City': 'Bogo City',
    'Naga City': 'Naga City',
    'Danao City': 'Danao City',
    'Talisay City': 'Talisay City',
    'Toledo City': 'Toledo City',
    'Lapu-Lapu City': 'Lapu-Lapu City',
    'Mandaue City': 'Mandaue City',
    'Cebu City': 'Cebu City',
    'San Francisco': 'San Francisco (Camotes)',
    'Poro': 'Poro (Camotes)',
    'Pilar': 'Pilar (Camotes)',
    'Tudela': 'Tudela (Camotes)',
}

for f in data['features']:
    orig = f['properties'].get('NAME_2', '')
    std_name = name_map.get(orig, orig)
    f['properties']['name'] = std_name
    f['properties']['original_name'] = orig
    
    # Calculate bounding box for the feature
    coords = []
    def extract_coords(c):
        if not c:
            return
        if isinstance(c, (list, tuple)):
            if len(c) >= 2 and isinstance(c[0], (int, float)) and isinstance(c[1], (int, float)):
                coords.append(c)
            else:
                for sub in c:
                    extract_coords(sub)
    geom = f.get('geometry') or {}
    extract_coords(geom.get('coordinates', []))
    if coords:
        lngs = [pt[0] for pt in coords]
        lats = [pt[1] for pt in coords]
        bbox = [min(lngs), min(lats), max(lngs), max(lats)]
    else:
        bbox = [123.0, 9.0, 124.5, 11.5]
    f['properties']['bbox'] = bbox

os.makedirs('Frontend/src/data', exist_ok=True)
out_path = 'Frontend/src/data/cebu_boundaries.json'
with open(out_path, 'w', encoding='utf-8') as out:
    json.dump(data, out, separators=(',', ':'))

print('Successfully wrote', out_path, 'with', len(data['features']), 'features.')
