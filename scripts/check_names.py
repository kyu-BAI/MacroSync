import json
import re

with open('Frontend/src/data/cebu_boundaries.json', encoding='utf-8') as f:
    geo_data = json.load(f)
geo_names = set(feat['properties']['name'] for feat in geo_data['features'])

with open('Frontend/src/screens/main/DietRecipesScreen.jsx', encoding='utf-8') as f:
    code = f.read()

match = re.search(r'const locations = \[(.*?)\];', code, re.DOTALL)
if match:
    raw_locs = match.group(1)
    locs = [line.strip().strip("',\"") for line in raw_locs.split('\n') if line.strip() and not line.strip().startswith('//')]
    loc_set = set(locs)
    print('DietRecipesScreen locations count:', len(loc_set))
    in_geo_not_loc = geo_names - loc_set
    in_loc_not_geo = loc_set - geo_names
    print('In GeoJSON but not in locations:', in_geo_not_loc)
    print('In locations but not in GeoJSON:', in_loc_not_geo)
