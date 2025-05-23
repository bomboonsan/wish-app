"use client"
import ScratchReveal from '@/components/ScratchReveal';

export default function ScratchRevealPage() {

  return (
    <main className='max-w-[800px] bg-white mx-auto shadow-md min-h-screen'>
      <div className='text-center mb-10 pt-20'>
        <h1 className='text-2xl font-extrabold text-[#33BDED]'>Scratch To Reveal</h1>
      </div>
      <div id="canvasWrapper" className='' style={{ position: "relative" }}>
        <ScratchReveal />
      </div>
    </main>
  );
}