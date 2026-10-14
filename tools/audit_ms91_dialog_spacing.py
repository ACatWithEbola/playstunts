"""Read-only original MS91 dialog delimiter instruction checkpoint."""
import argparse,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);a=p.parse_args();image=a.image.read_bytes()
checks={0x19b48:'26803f7d',0x19b7e:'83863afe04',0x19d20:'26803f7d',0x19e8a:'26803f7d',0x19eae:'83863afe03'}
for offset,hex_bytes in checks.items():
    expected=bytes.fromhex(hex_bytes)
    assert image[offset:offset+len(expected)]==expected,f'Instruction mismatch at {offset:#x}'
print(json.dumps({'delimiter':'}','measurementGapPixels':4,'choiceParsingGapPixels':3,'scope':'Original instruction checkpoint; complete rendering/input geometry still needs tests'},indent=2))
