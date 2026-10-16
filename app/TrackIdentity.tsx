import {WebsiteText} from './WebsiteLanguage';
/** Content identity stays the same when a safe DOS filename is assigned. */
export default function TrackIdentity({hash}:{hash:string}){
 return <small className="track-content-id"><WebsiteText text="Track ID"/>: <code title={hash}>{hash.slice(0,8).toUpperCase()}</code></small>;
}
