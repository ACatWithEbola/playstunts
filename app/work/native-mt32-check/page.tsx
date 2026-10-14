import {redirect} from 'next/navigation';

/** Retain old workbench links without shipping the removed test interface. */
export default function RetiredRolandCheck(){
 redirect('/#play');
}
