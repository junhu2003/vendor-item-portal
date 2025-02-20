import { Square3Stack3DIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Square3Stack3DIcon className="h-10 w-10 rotate-[-15deg] mr-2" />
      <div>
        <p className="text-[16px]">AM/PM Service</p>
        <p className="text-[22px] mt-1">Vendor Portal</p>
      </div>
      
    </div>
  );
}
