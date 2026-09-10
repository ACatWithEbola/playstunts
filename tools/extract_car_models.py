import sys,json,hashlib
from pathlib import Path
from extract import unpack,resources
source_dir,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
manifest={}
for source in sorted(source_dir.glob('ST*.P3S')):
 packed=source.read_bytes();blob=unpack(packed);entries=resources(blob)
 if not all(name in entries for name in ['car0','car1','car2','exp0','exp1','exp2','exp3']):continue
 car=source.stem[2:];(out/f'{car.lower()}.bin').write_bytes(blob)
 manifest[car]={'source':source.name,'packedSha256':hashlib.sha256(packed).hexdigest(),'sha256':hashlib.sha256(blob).hexdigest(),'bytes':len(blob),'shapes':list(entries)}
assert len(manifest)==11
(out/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
print('Preserved complete original 3D banks for',len(manifest),'cars,',sum(m['bytes'] for m in manifest.values()),'bytes')
