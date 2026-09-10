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

def required_problems(root):
    paths=json.loads((Path(__file__).resolve().parents[1]/'docs/required-runtime-files.json').read_text())
    return [('MISSING',path) for path in paths if not (root/path).is_file()]

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public-dir',type=Path,default=Path(__file__).resolve().parents[1]/'public')
    parser.add_argument('--reference',action='store_true',help='Compare historical reference bytes instead of the generated installation')
    args=parser.parse_args()
    manifest=(Path(__file__).resolve().parents[1]/'docs/runtime-file-checksums.json') if args.reference else args.public_dir/'asset-inventory.json'
    problems=required_problems(args.public_dir) if not args.reference else []
    if manifest.is_file():problems+=check(args.public_dir,json.loads(manifest.read_text()))
    else:problems.append(('MISSING',str(manifest)))
    for status,path in problems:print(status,path)
    print(f'{len(problems)} asset problems. This checks installation files, not whole-game equivalence.')
    raise SystemExit(bool(problems))
