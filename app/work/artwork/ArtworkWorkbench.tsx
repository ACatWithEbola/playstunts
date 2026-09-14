'use client';
/* oxlint-disable next/no-img-element -- This local preservation workbench must display original PNG files without image optimisation. */

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';

type ArtworkEntry = {
  file: string;
  width: number;
  height: number;
  source: string;
  resource: string;
  x?: number;
  y?: number;
  kind: string;
  palette?: string;
};

type ArtworkManifest = {
  images: ArtworkEntry[];
};

const ROOT = '/work/artwork/';
const RECONSTRUCTIONS: Record<string, {
  title: string;
  candidateUrl: string;
  downloadName: string;
  candidateLabel: string;
  candidateDescription: string;
  status: 'accepted' | 'review';
  statusLabel: string;
}> = {
  'Images/SDTITL/prod.png': {
    title: 'Mindscape intro logo',
    candidateUrl: `${ROOT}Candidates/SDTITL-prod-mindscape-v1.png`,
    downloadName: 'SDTITL-prod-mindscape-v1.png',
    candidateLabel: 'Antialiased reconstruction · accepted',
    candidateDescription: 'Approved high-resolution redraw',
    status: 'accepted',
    statusLabel: 'Accepted · awaiting later game integration',
  },
  'Images/SDTITL/titl.png': {
    title: '4-D Sports Driving title',
    candidateUrl: `${ROOT}Candidates/SDTITL-titl-title-v2.png`,
    downloadName: 'SDTITL-titl-title-v2.png',
    candidateLabel: 'Antialiased reconstruction · accepted',
    candidateDescription: 'Approved high-resolution redraw',
    status: 'accepted',
    statusLabel: 'Accepted · awaiting later game integration',
  },
  'Images/SDMSEL/scrn.png': {
    title: 'Stunts main menu',
    candidateUrl: `${ROOT}Candidates/SDMSEL-scrn-menu-v1.png`,
    downloadName: 'SDMSEL-scrn-menu-v1.png',
    candidateLabel: 'Antialiased reconstruction · accepted',
    candidateDescription: 'Approved high-resolution redraw',
    status: 'accepted',
    statusLabel: 'Accepted · awaiting later game integration',
  },
};

function artworkUrl(file: string) {
  return `${ROOT}${file.split('/').map(encodeURIComponent).join('/')}`;
}

function archiveName(entry: ArtworkEntry) {
  return entry.file.split('/')[1] ?? entry.source.replace(/\.[^.]+$/, '');
}

function searchableText(entry: ArtworkEntry) {
  return `${archiveName(entry)} ${entry.source} ${entry.resource} ${entry.file}`.toLowerCase();
}

export default function ArtworkWorkbench() {
  const [entries, setEntries] = useState<ArtworkEntry[]>([]);
  const [selected, setSelected] = useState<ArtworkEntry | null>(null);
  const [query, setQuery] = useState('');
  const [archive, setArchive] = useState('ALL');
  const [smooth, setSmooth] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${ROOT}Manifest.json`, {signal: controller.signal})
      .then((response) => {
        if (!response.ok) throw new Error('The imported artwork manifest could not be loaded.');
        return response.json() as Promise<ArtworkManifest>;
      })
      .then((manifest) => {
        const imported = manifest.images
          .filter((entry) => entry.file.startsWith('Images/'))
          .sort((left, right) => left.file.localeCompare(right.file, undefined, {numeric: true}));
        setEntries(imported);
        setSelected(imported[0] ?? null);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => controller.abort();
  }, []);

  const archives = useMemo(
    () => [...new Set(entries.map(archiveName))].sort((left, right) => left.localeCompare(right)),
    [entries],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (archive !== 'ALL' && archiveName(entry) !== archive) return false;
      return !needle || searchableText(entry).includes(needle);
    });
  }, [archive, entries, query]);
  const reconstruction = selected ? RECONSTRUCTIONS[selected.file] : undefined;

  return (
    <main className="artwork-workbench">
      <header className="artwork-header">
        <div>
          <Link className="artwork-back" href="/">← Front page</Link>
          <p className="artwork-kicker">LOCAL RECONSTRUCTION WORKSPACE</p>
          <h1>Stunts artwork archive</h1>
          <p className="artwork-intro">
            The original decoded artwork is presented untouched. Select any item to inspect its exact pixels and source metadata before making a reconstruction.
          </p>
        </div>
        <dl className="artwork-totals" aria-label="Imported collection totals">
          <div><dt>Artwork</dt><dd>{entries.length || '—'}</dd></div>
          <div><dt>Archives</dt><dd>{archives.length || '—'}</dd></div>
          <div><dt>Format</dt><dd>PNG</dd></div>
        </dl>
      </header>

      <section className="artwork-toolbar" aria-label="Artwork filters">
        <label>
          <span>Find artwork</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Resource, filename or archive"
          />
        </label>
        <label>
          <span>Source archive</span>
          <select value={archive} onChange={(event) => setArchive(event.target.value)}>
            <option value="ALL">All 48 archives</option>
            {archives.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <button className={smooth ? 'is-active' : ''} type="button" onClick={() => setSmooth((current) => !current)}>
          {smooth ? 'Smooth preview' : 'Exact pixels'}
        </button>
        <output>{visible.length.toLocaleString()} shown</output>
      </section>

      {error ? <p className="artwork-error" role="alert">{error}</p> : null}

      {selected && reconstruction ? (
        <section className="artwork-comparison" aria-labelledby="artwork-comparison-heading">
          <div className="artwork-comparison-heading">
            <div>
              <p>ACTIVE RECONSTRUCTION</p>
              <h2 id="artwork-comparison-heading">{reconstruction.title}</h2>
            </div>
            <div className="artwork-comparison-state">
              <strong data-status={reconstruction.status}>{reconstruction.statusLabel}</strong>
              <span>Original {selected.width} × {selected.height} · candidate 1280 × 800</span>
            </div>
          </div>
          <div className="artwork-comparison-grid">
            <figure>
              <figcaption><strong>Untouched original</strong><span>Exact decoded pixels</span></figcaption>
              <div className="artwork-comparison-stage original"><img src={artworkUrl(selected.file)} alt={`Original pixel artwork for ${reconstruction.title}`} /></div>
              <a href={artworkUrl(selected.file)} download>Download original PNG</a>
            </figure>
            <figure>
              <figcaption><strong>{reconstruction.candidateLabel}</strong><span>{reconstruction.candidateDescription}</span></figcaption>
              <div className="artwork-comparison-stage"><img src={reconstruction.candidateUrl} alt={`Antialiased reconstruction candidate for ${reconstruction.title}`} /></div>
              <a href={reconstruction.candidateUrl} download={reconstruction.downloadName}>Download 4× candidate PNG</a>
            </figure>
          </div>
          <p className="artwork-comparison-note">The original remains untouched. Each reconstruction is stored separately until it is accepted and later connected to the game.</p>
        </section>
      ) : null}

      <div className="artwork-layout">
        <aside className="artwork-inspector" aria-label="Selected artwork">
          {selected ? (
            <>
              <div className={`artwork-inspector-stage ${smooth ? 'smooth' : ''}`}>
                <img src={artworkUrl(selected.file)} alt={`${selected.resource} from ${selected.source}`} />
              </div>
              <div className="artwork-inspector-heading">
                <p>{archiveName(selected)}</p>
                <h2>{selected.resource}</h2>
              </div>
              <dl className="artwork-metadata">
                <div><dt>Original size</dt><dd>{selected.width} × {selected.height} px</dd></div>
                <div><dt>Source</dt><dd>{selected.source}</dd></div>
                <div><dt>Resource</dt><dd>{selected.resource}</dd></div>
                {selected.x !== undefined && selected.y !== undefined
                  ? <div><dt>Screen origin</dt><dd>{selected.x}, {selected.y}</dd></div>
                  : null}
                <div><dt>Palette</dt><dd>{selected.palette ?? 'Embedded source palette'}</dd></div>
              </dl>
              <a className="artwork-download" href={artworkUrl(selected.file)} download>
                Download untouched PNG
              </a>
            </>
          ) : <p>Select an artwork item to inspect it.</p>}
        </aside>

        <section className={`artwork-browser ${smooth ? 'smooth' : ''}`} aria-label="Imported artwork">
          {visible.map((entry) => {
            const active = selected?.file === entry.file;
            return (
              <button
                className={active ? 'artwork-card is-selected' : 'artwork-card'}
                type="button"
                key={entry.file}
                onClick={() => setSelected(entry)}
                aria-pressed={active}
                aria-label={`${entry.resource}, ${archiveName(entry)}, ${entry.width} by ${entry.height} pixels`}
              >
                <span className="artwork-card-stage">
                  <img loading="lazy" src={artworkUrl(entry.file)} alt="" />
                </span>
                <span className="artwork-card-copy">
                  <strong>{entry.resource}</strong>
                  <small>{archiveName(entry)} · {entry.width} × {entry.height}</small>
                </span>
              </button>
            );
          })}
          {!error && entries.length > 0 && visible.length === 0
            ? <p className="artwork-empty">No artwork matches those filters.</p>
            : null}
          {!error && entries.length === 0 ? <p className="artwork-empty">Loading the imported artwork…</p> : null}
        </section>
      </div>
    </main>
  );
}
