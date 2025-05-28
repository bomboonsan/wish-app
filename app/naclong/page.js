import ScratchReveal from '@/components/ScratchReveal';
import { Metadata } from 'next'

export const metadata = {
  title: 'NAC LONG มีอะไรใหม่',
  description: 'NAC LONG มีอะไรใหม่',
  openGraph: {
    title: 'NAC LONG มีอะไรใหม่',
    description: 'NAC LONG มีอะไรใหม่',
    images: [
      {
        url: 'https://wish-app-eosin.vercel.app/scratchreveal/question.png', // URL ของรูปภาพสำหรับ Open Graph
        width: 700,
        height: 700,
        alt: 'NAC LONG',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NAC LONG มีอะไรใหม่',
    description: 'NAC LONG มีอะไรใหม่',
    images: ['https://wish-app-eosin.vercel.app/scratchreveal/question.png'], // URL ของรูปภาพสำหรับ Twitter Card
  },
};

export default function ScratchRevealPage() {

  return (
    <main className=' bg-white mx-auto min-h-screen max-w-screen-2xl w-full'>
      <div className='text-center mb-10 pt-20 flex items-center justify-center'>
        <h1 className='font-extrabold text-[#33BDED] text-title'>ลองนำยางลบไปลบกันดูเลย</h1>
      </div>
      <div id="canvasWrapper" className='w-full' style={{ position: "relative" }}>

        <ScratchReveal />

        <div className='text-[#35BDF0] text-ref font-medium relative bottom-[20%] z-50 flex justify-between px-2'>
          <div>
            <p>มีตัวยา Acetylcysteine 600mg</p>
            <p>ใบอนุญาตโฆษณาเลขที่ ฆท xx/2568</p>
          </div>
          <div>
            <p>Reg. No. 1C 57/49</p>
          </div>
        </div>
          
      </div>
    </main>
  );
}