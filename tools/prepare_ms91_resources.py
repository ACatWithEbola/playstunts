"""Generate ignored MS1991 resource modules from your own original files. No downloads."""
import argparse
import base64
import hashlib
import json
import stat
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def digest(data):
    return hashlib.sha256(data).hexdigest()

def generate(source,recipes):
    if recipes.get('format')!='playstunts-ms91-resource-recipes-v1':
        raise ValueError('Unknown resource recipe format')
    outputs={}
    archive=zipfile.ZipFile(source) if source.is_file() else None
    try:
        entries={}
        for entry in (archive.infolist() if archive else source.iterdir()):
            if archive and entry.is_dir() or not archive and entry.is_dir():
                continue
            name=(Path(entry.filename).name if archive else entry.name).upper()
            if name in entries:
                raise ValueError('Duplicate case-insensitive source filename: '+name)
            entries[name]=entry
        used={}
        for row in recipes['outputs']:
            name=row['path']
            if Path(name).name!=name or not name.endswith('.json') or name in outputs:
                raise ValueError('Invalid/duplicate output filename')
            files={}
            for item in row['files']:
                original=item['source']
                entry=entries.get(original)
                if entry is None:
                    raise ValueError('Missing original MS1991 file: '+original)
                if archive:
                    if entry.file_size!=item['bytes'] or stat.S_ISLNK(entry.external_attr>>16):
                        raise ValueError('Unexpected source length/type: '+original)
                    data=archive.read(entry)
                else:
                    if entry.is_symlink() or not entry.is_file():
                        raise ValueError('Require a regular source file: '+original)
                    data=entry.read_bytes()
                if len(data)!=item['bytes'] or digest(data)!=item['sha256']:
                    raise ValueError('Unsupported original MS1991 checksum: '+original)
                used[original]=dict(bytes=len(data),sha256=digest(data))
                files[original]=dict(bytes=len(data),sha256=digest(data),base64=base64.b64encode(data).decode('ascii'))
            record=dict(row.get('metadata',{}))
            if row.get('layout')=='bank':
                record['files']=files
            elif len(files)==1:
                record.update(next(iter(files.values())))
            else:
                raise ValueError('Invalid single resource recipe')
            outputs[name]=record
        return outputs,used
    finally:
        if archive:
            archive.close()

def install_missing(outputs,target):
    """Validate every conflict before writes; never overwrite retained modules."""
    for name,record in outputs.items():
        path=target/name
        if path.is_symlink() or path.exists() and (not path.is_file() or json.loads(path.read_text())!=record):
            raise ValueError('Existing generated resource differs; nothing overwritten: '+name)
    target.mkdir(parents=True,exist_ok=True)
    installed=[]
    for name,record in outputs.items():
        path=target/name
        if not path.exists():
            with path.open('x') as handle:
                json.dump(record,handle,separators=(',',':'))
                handle.write('\n')
            installed.append(name)
    return installed

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original',required=True,type=Path,help='Own February1991 extracted directory or ZIP')
    parser.add_argument('--output',required=True,type=Path,help='NEW generated-resource directory, outside original inputs')
    parser.add_argument('--install',action='store_true',help='Also install missing lib/game modules; identical existing files retained')
    args=parser.parse_args()
    source=args.original.resolve(strict=True)
    output=args.output.resolve()
    if args.output.is_symlink() or output.exists() or output==source or source.is_dir() and source in output.parents:
        parser.error('Require a new output outside original inputs')
    recipes=json.loads((ROOT/'docs/ms91-resource-recipes.json').read_text())
    before=digest(source.read_bytes()) if source.is_file() else None
    generated,used=generate(source,recipes)
    # Re-read selected directory inputs or the archive to detect concurrent changes.
    if source.is_file():
        if digest(source.read_bytes())!=before:
            raise ValueError('Original archive changed during generation')
    elif generate(source,recipes)[0]!=generated:
        raise ValueError('Original files changed during generation')
    if args.install:
        # Preflight all retained files before creating any output/installed file.
        for name,record in generated.items():
            path=ROOT/'lib/game'/name
            if path.is_symlink() or path.exists() and json.loads(path.read_text())!=record:
                raise ValueError('Existing generated resource differs: '+name)
    output.mkdir(parents=True,exist_ok=False)
    install_missing(generated,output)
    manifest=dict(format='playstunts-ms91-generated-v1',files=used,
        generated={name:digest((output/name).read_bytes()) for name in generated},originalsUnchanged=True)
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    installed=install_missing(generated,ROOT/'lib/game') if args.install else []
    print(json.dumps(dict(output=str(output),generated=len(generated),originalFiles=len(used),installed=installed,originalsUnchanged=True)))

if __name__=='__main__':
    main()
