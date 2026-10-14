"""Read-only audit of the actual web car settings against original MS91 SIMD."""
import argparse
import json
import struct
from pathlib import Path
from extract import resources

p = argparse.ArgumentParser()
p.add_argument('original', type=Path)
p.add_argument('--assets', type=Path, default=Path(__file__).resolve().parents[1] / 'public/game/assets.json')
a = p.parse_args()
cars = json.loads(a.assets.read_text())['cars']
assert len(cars) == 11
audited = []
for car in cars:
    raw = resources((a.original / ('CAR' + car['id'] + '.RES')).read_bytes())['simd']
    assert bytes.fromhex(car['rawSimulation']) == raw, ('Raw simulation resource mismatch', car['id'])
    u = lambda offset: struct.unpack_from('<H', raw, offset)[0]
    expected = {
        'gears': raw[0], 'mass': u(2), 'braking': u(4), 'idleRPM': u(6),
        'downshiftRPM': u(8), 'upshiftRPM': u(10), 'maxRPM': u(12),
        'gearRatios': list(struct.unpack_from('<7H', raw, 14)),
        'gearKnobPoints': [list(struct.unpack_from('<hh', raw, 28 + i * 4)) for i in range(7)],
        'aeroResistance': u(56), 'idleTorque': raw[58],
        'torqueCurve': list(raw[59:163]), 'grip': u(164),
        'surfaceGrip': list(struct.unpack_from('<6H', raw, 180)),
    }
    for field, value in expected.items():
        assert car[field] == value, (car['id'], field, car[field], value)
    audited.append({'car': car['id'], 'rawBytes': len(raw), 'fieldsMatched': len(expected)})
print(json.dumps({'originalVersion': 'MS91', 'webAssetsUnchanged': True, 'cars': audited}, indent=2))
