'use client';
import Image from 'next/image';
import {useId} from 'react';
/** Frame the original manual wordmark and key out its neutral paper background.
 * Only yellow ink contributes to alpha. Display color is the original
 * opening lettering, RGB252/244/32 (#FCF420). */
export default function StuntsBrand(){
 const filterId='stunts-ink-'+useId().replace(/:/g,'');
 return <span className="stunts-brand">
  <svg width="0" height="0" aria-hidden="true" focusable="false" className="stunts-ink-filter"><defs><filter id={filterId} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.9882352941  0 0 0 0 0.9568627451  0 0 0 0 0.1254901961  3 3 -6 0 -0.2"/></filter></defs></svg>
  <Image unoptimized width={1300} height={919} src="/site/manual-cover-spread.png" alt="Stunts" style={{filter:`url(#${filterId})`}}/>
 </span>;
}
