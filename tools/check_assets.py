"""Report missing/mismatched local assets. Never download or alter files."""
import argparse, hashlib, json
from pathlib import Path

def check(root, records):
    problems=[]
    for row in records:
        file=root / row['path']
        if not file.is_file(): problems.append(('MISSING',row['path']))
        elif hashlib.sha256(file.read_bytes()).hexdigest()!=row['sha256']:
            problems.append(('DIFFERENT',row['path']))
    return problems

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public-dir',type=Path,default=Path(__file__).resolve().parents[1]/'public')
    args=parser.parse_args()
    manifest=Path(__file__).resolve().parents[1]/'docs/runtime-file-checksums.json'
    problems=check(args.public_dir,json.loads(manifest.read_text()))
    for status,path in problems: print(status,path)
    print(f'{len(problems)} missing or different files. This checks the reference asset set, not gameplay correctness.')
    raise SystemExit(bool(problems))
