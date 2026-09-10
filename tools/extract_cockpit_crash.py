"""Extract supplied GAME.PRE windshield lines and original animation counts.
Usage: python extract_cockpit_crash.py ORIGINAL_FOLDER OUTPUT_JSON
"""
from pathlib import Path
import sys,json,struct,hashlib
from extract import resources,unpack
source=Path(sys.argv[1])/'GAME.PRE';raw=source.read_bytes();data=resources(unpack(raw))
info=list(struct.unpack('<'+'h'*(len(data['cinf'])//2),data['cinf']))
assert info[0]==len(info)-1
lines=[list(line) for line in struct.iter_unpack('<4h',data['crak'])]
assert all(0<=count<=len(lines) for count in info[1:])
output=Path(sys.argv[2]);output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(dict(source='GAME.PRE',sha256=hashlib.sha256(raw).hexdigest(),lines=lines,frames=info[1:]),separators=(',',':')))
print('Extracted',len(lines),'original windshield segments and',info[0],'animation stages')
