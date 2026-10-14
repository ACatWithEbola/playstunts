"""Read-only comparison of original in-game Options resources, not SETUP."""
import argparse
import json
import re
from pathlib import Path
from extract import resources, unpack

p = argparse.ArgumentParser()
p.add_argument('legacy', type=Path)
p.add_argument('target', type=Path)
p.add_argument('--web-dialogs',type=Path)
a = p.parse_args()
result = []
for directory in [a.legacy, a.target]:
    main = resources((directory / 'MAIN.RES').read_bytes())
    misc = resources(unpack((directory / 'MISC.PRE').read_bytes()))
    result.append({
        'package': directory.name,
        'graphicsOptions': main['emrl'].rstrip(b'\0').decode('cp437'),
        'optionsMenu': misc['emop'].rstrip(b'\0').decode('cp437'),
        'simulationNotice': main.get('emrs', b'').rstrip(b'\0').decode('cp437'),
    })
print(json.dumps({'releases': result, 'scope': 'Exact resource text; dispatcher effects/defaults need code confirmation'}, indent=2))
assert 'Slow video mgmt.' not in result[0]['graphicsOptions']
assert 'Slow video mgmt.' in result[1]['graphicsOptions']
assert 'Slow Simulation Speed' in result[1]['graphicsOptions']
assert 'Fast Simulation Speed' in result[1]['graphicsOptions']
assert result[1]['simulationNotice']
if a.web_dialogs:
    literals=dict(re.findall(r" (\w+):'([^']*)'",a.web_dialogs.read_text()))
    assert len(literals)==6,'Expected exactly six original dialog overrides'
    main=resources((a.target/'MAIN.RES').read_bytes())
    misc=resources(unpack((a.target/'MISC.PRE').read_bytes()))
    game=resources(unpack((a.target/'GAME.PRE').read_bytes()))
    for key,text in literals.items():
        bank=main if key in ['emrl','emrs'] else misc if key=='emop' else game
        assert text.encode('cp437')==bank[key].split(b'\0')[0],f'Web MS91 dialog differs: {key}'
    print('All six web MS91 dialog overrides match original resource bytes through NUL')
