"""Compare original SETUP programs after EXEPACK decoding; no source writes."""
import argparse
import hashlib
import json
import struct
from pathlib import Path
from unpack_executables import unpack_exe
from extract_setup import extract

p = argparse.ArgumentParser()
p.add_argument('legacy', type=Path)
p.add_argument('target', type=Path)
a = p.parse_args()
programs = []
for directory in [a.legacy, a.target]:
    raw = (directory / 'SETUP.EXE').read_bytes()
    header = struct.unpack_from('<14H', raw)
    packed_offset = (header[4] + header[11]) * 16
    entry = struct.unpack_from('<9H', raw, packed_offset)
    image = unpack_exe(raw, 0x1000)
    decoded = image[0x10000:0x10000 + entry[6] * 16]
    programs.append({'raw': raw, 'header': header, 'entry': entry,
                     'decoded': decoded, 'text': extract(raw),
                     'configuration': (directory / 'SETUP.DAT').read_bytes()})
legacy, target = programs
text_fields = ['soundOptions', 'videoOptions', 'mainOptions', 'soundHelp', 'videoHelp']
result = {
    'packedBytes': [len(x['raw']) for x in programs],
    'packedSha256': [hashlib.sha256(x['raw']).hexdigest() for x in programs],
    'decodedBytes': [len(x['decoded']) for x in programs],
    'decodedSha256': [hashlib.sha256(x['decoded']).hexdigest() for x in programs],
    'decodedProgramsIdentical': legacy['decoded'] == target['decoded'],
    'exepackEntryMetadataIdentical': legacy['entry'] == target['entry'],
    'mzHeadersIdenticalExceptLastPageByteCount': legacy['header'][:1] + legacy['header'][2:] == target['header'][:1] + target['header'][2:],
    'menuDataIdentical': {field: legacy['text'][field] == target['text'][field] for field in text_fields},
    'bundledConfigurationIdentical': legacy['configuration'] == target['configuration'],
    'scope': 'Decoded initialized program and metadata, not every DOS environment-dependent behavior',
}
print(json.dumps(result, indent=2))
assert result['decodedProgramsIdentical']
assert result['exepackEntryMetadataIdentical']
assert result['mzHeadersIdenticalExceptLastPageByteCount']
assert all(result['menuDataIdentical'].values())
