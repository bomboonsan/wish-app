"use client"
import ScratchReveal from '@/components/ScratchReveal';

export default function ScratchRevealPage() {

  return (
    <main className=' bg-white mx-auto min-h-screen'>
      <div className='text-center mb-10 pt-20 flex items-center justify-center'>
        <h1 className='text-2xl font-extrabold text-[#33BDED]'>ลองนำยางลบไปลบกันดูเลย</h1>
        {/* <img src="/scratchreveal/eraser.gif" className='w-14 h-14' alt="" /> */}
      </div>
      <div id="canvasWrapper" className='' style={{ position: "relative" }}>
        <ScratchReveal />
      </div>
    </main>
  );
}