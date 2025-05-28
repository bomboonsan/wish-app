"use client"
import ScratchReveal from '@/components/ScratchReveal';

export default function ScratchRevealPage() {

  return (
    <main className=' bg-white mx-auto min-h-screen max-w-screen-2xl w-full'>
      <div className='text-center mb-10 pt-20 flex items-center justify-center'>
        <h1 className='text-4xl font-extrabold text-[#33BDED]'>ลองนำยางลบไปลบกันดูเลย</h1>
      </div>
      <div id="canvasWrapper" className='w-full' style={{ position: "relative" }}>

        <ScratchReveal />

        <div className='text-[#35BDF0] text-2xl font-medium relative bottom-[10%] z-50 flex justify-between'>
          <div>
            <p>มีตัวยา Acetylcysteine 600mg</p>
            <p>ใบอนูยาตโฆษณาเลขที่ ฆท xx/2568</p>
          </div>
          <div>
            <p>Reg. No. 1C 57/49</p>
          </div>
        </div>
          
      </div>
    </main>
  );
}