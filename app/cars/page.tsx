'use client';
import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';

import {useEffect} from 'react';

export default function CarsPage(){
 useEffect(()=>window.location.replace('/?view=cars'),[]);
 return <main className="showroom-loading"><p role="status"><WebsiteText text={"Opening the 3D car showroom…"}/></p></main>;
}
