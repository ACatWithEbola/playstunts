import type {Metadata} from 'next';
import ArtworkWorkbench from './ArtworkWorkbench';
import './artwork.css';

export const metadata: Metadata = {
  title: 'Stunts artwork reconstruction workbench',
  description: 'Local review workspace for the original Stunts artwork collection.',
};

export default function ArtworkWorkbenchPage() {
  return <ArtworkWorkbench />;
}
