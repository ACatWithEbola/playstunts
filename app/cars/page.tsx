'use client';

import {useEffect} from 'react';

export default function CarsPage(){
 useEffect(()=>window.location.replace('/?view=cars'),[]);
 return <main className="showroom-loading"><p role="status">Opening the 3D car showroom…</p></main>;
}
