'use client';
import type {PublicSubmission} from '../usePublicSubmissions';
import {WebsiteText,WebsiteElement} from '../WebsiteLanguage';
import EngineBadge from './EngineBadge';
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${String(Math.floor(ticks/20)%60).padStart(2,'0')}.${String(ticks%20*5).padStart(2,'0')}`;
export default function PendingScoreRows({runs}:{runs:PublicSubmission[]}){
 return <>{runs.map(run=><tr key={'pending-'+run.id} className="scores-verifying-row"><td><WebsiteElement as="span" aria-label="Unranked">—</WebsiteElement></td><td><strong>{run.driver}</strong>{' '}<EngineBadge engine={run.physicsEngine}/><span className="scores-car">{run.car}</span></td><td className="scores-time"><strong>{time(run.ticks)}</strong></td><td><span className={'verification-badge '+(run.state==='rejected'?'verification-failed':'')}><WebsiteText text={run.state==='rejected'?'Verification failed':'Verifying...'}/></span></td></tr>)}</>;
}
