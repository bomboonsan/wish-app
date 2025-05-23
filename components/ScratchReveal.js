'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const ScratchReveal = ({
  topImageSrc = '/image001-1.png', // รูปภาพด้านบน (ที่จะถูกขูด)
  bottomImageSrc = '/image002-1.png', // รูปภาพพื้นหลัง
  brushSize = 60,
  aspectRatio = 3 / 2, // สัดส่วนภาพ (กว้าง / สูง), เช่น 600/400
  className = '', // สำหรับ custom styling ของ div ครอบ
}) => {
  const bottomCanvasRef = useRef(null);
  const scratchCanvasRef = useRef(null);
  const canvasWrapperRef = useRef(null); // Ref สำหรับ div ที่ครอบ canvas

  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 }); // เก็บตำแหน่งล่าสุด {x, y}
  const imagesRef = useRef({
    top: null,
    bottom: null,
    loadedCount: 0,
    topSrc: topImageSrc, // เก็บ src ปัจจุบัน
    bottomSrc: bottomImageSrc, // เก็บ src ปัจจุบัน
  });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // ฟังก์ชันวาดรูปภาพ (memoized)
  const drawImages = useCallback(() => {
    const bottomCanvas = bottomCanvasRef.current;
    const scratchCanvas = scratchCanvasRef.current;
    const { top: topImage, bottom: bottomImage } = imagesRef.current;

    if (
      !bottomCanvas ||
      !scratchCanvas ||
      !topImage ||
      !bottomImage ||
      canvasSize.width === 0 ||
      canvasSize.height === 0
    ) {
      return;
    }

    const bottomCtx = bottomCanvas.getContext('2d');
    const ctx = scratchCanvas.getContext('2d');
    if (!bottomCtx || !ctx) return;

    // ตั้งค่าขนาด drawing surface ของ canvas
    bottomCanvas.width = canvasSize.width;
    bottomCanvas.height = canvasSize.height;
    scratchCanvas.width = canvasSize.width;
    scratchCanvas.height = canvasSize.height;

    // วาดรูปภาพพื้นหลัง
    bottomCtx.drawImage(bottomImage, 0, 0, canvasSize.width, canvasSize.height);

    // วาดรูปภาพด้านบน (จะรีเซ็ตการขูดเมื่อปรับขนาด)
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(topImage, 0, 0, canvasSize.width, canvasSize.height);

    console.log(`Canvas redrawn to: ${canvasSize.width}x${canvasSize.height}`);
    setIsLoading(false); // ซ่อน loading indicator หลังจากวาดครั้งแรก
  }, [canvasSize]); // ขึ้นอยู่กับ canvasSize เท่านั้น

  // Effect สำหรับโหลดรูปภาพเริ่มต้น หรือเมื่อ src เปลี่ยน
  useEffect(() => {
    // ตรวจสอบว่า src เปลี่ยนไปจริงหรือไม่
    if (imagesRef.current.topSrc === topImageSrc && imagesRef.current.bottomSrc === bottomImageSrc && imagesRef.current.loadedCount === 2) {
      return; // ไม่ต้องโหลดใหม่ถ้า src ไม่เปลี่ยนและโหลดเสร็จแล้ว
    }

    setIsLoading(true);
    imagesRef.current.loadedCount = 0; // รีเซ็ตจำนวนรูปที่โหลด

    const topImg = new Image();
    const bottomImg = new Image();
    imagesRef.current.top = topImg;
    imagesRef.current.bottom = bottomImg;
    imagesRef.current.topSrc = topImageSrc; // อัปเดต src ที่เก็บไว้
    imagesRef.current.bottomSrc = bottomImageSrc;

    let currentLoadedCount = 0;
    const checkAllLoaded = () => {
      currentLoadedCount++;
      imagesRef.current.loadedCount = currentLoadedCount;
      if (currentLoadedCount === 2) {
        console.log('All images loaded');
        // การวาดจะถูก trigger โดย useEffect ที่ขึ้นกับ canvasSize และ imagesRef.current.loadedCount
        // ถ้า canvasSize มีค่าแล้ว (จาก ResizeObserver) การวาดจะเกิดขึ้น
        // ถ้ายังไม่มี ResizeObserver จะคำนวณขนาดเริ่มต้น
        if (canvasWrapperRef.current && (canvasSize.width === 0 || canvasSize.height === 0)) {
          const wrapper = canvasWrapperRef.current;
          const newWidth = wrapper.clientWidth;
          const newHeight = newWidth / aspectRatio;
          if (newWidth > 0) {
            setCanvasSize({ width: newWidth, height: newHeight });
          }
        } else if (canvasSize.width > 0 && canvasSize.height > 0) {
            // ถ้า canvasSize มีค่าแล้ว ให้เรียก drawImages โดยตรง
            drawImages();
        }
      }
    };

    topImg.onload = checkAllLoaded;
    bottomImg.onload = checkAllLoaded;
    topImg.onerror = () => {
        console.error('Failed to load top image:', topImageSrc);
        setIsLoading(false);
    }
    bottomImg.onerror = () => {
        console.error('Failed to load bottom image:', bottomImageSrc);
        setIsLoading(false);
    }

    topImg.src = topImageSrc;
    bottomImg.src = bottomImageSrc;

  }, [topImageSrc, bottomImageSrc, aspectRatio, drawImages, canvasSize.width, canvasSize.height]); // เพิ่ม drawImages และ canvasSize dimensions ใน dependency

  // Effect สำหรับ ResizeObserver
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0) {
          const newHeight = newWidth / aspectRatio;
          setCanvasSize((prevSize) => {
            if (
              Math.abs(prevSize.width - newWidth) > 1 ||
              Math.abs(prevSize.height - newHeight) > 1
            ) {
              return { width: newWidth, height: newHeight };
            }
            return prevSize;
          });
        }
      }
    });

    resizeObserver.observe(wrapper);

    // คำนวณขนาดเริ่มต้นเมื่อ mount
    const initialWidth = wrapper.clientWidth;
    if (initialWidth > 0) {
        const initialHeight = initialWidth / aspectRatio;
        setCanvasSize({ width: initialWidth, height: initialHeight });
    }


    return () => {
      resizeObserver.unobserve(wrapper);
      resizeObserver.disconnect();
    };
  }, [aspectRatio]); // Re-run if aspectRatio changes

  // Effect สำหรับวาดรูปภาพเมื่อ canvasSize เปลี่ยน หรือรูปภาพโหลดเสร็จ
  useEffect(() => {
    if (imagesRef.current.loadedCount === 2 && canvasSize.width > 0 && canvasSize.height > 0) {
      drawImages();
    }
  }, [canvasSize, drawImages]); // ขึ้นอยู่กับ canvasSize และ drawImages (ซึ่ง memoized)

  // Effect สำหรับตรรกะการขูด (scratching logic)
  useEffect(() => {
    const scratchCanvas = scratchCanvasRef.current;
    if (!scratchCanvas || canvasSize.width === 0 || canvasSize.height === 0) return;

    const ctx = scratchCanvas.getContext('2d');
    if (!ctx) return;

    const getMousePos = (eventOrTouch) => {
      const rect = scratchCanvas.getBoundingClientRect();
      const scaleX = scratchCanvas.width / rect.width;
      const scaleY = scratchCanvas.height / rect.height;
      let clientX, clientY;

      if (eventOrTouch.touches && eventOrTouch.touches.length > 0) {
        clientX = eventOrTouch.touches[0].clientX;
        clientY = eventOrTouch.touches[0].clientY;
      } else {
        clientX = eventOrTouch.clientX;
        clientY = eventOrTouch.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const doScratchInternal = (currentPos, isSinglePoint = false) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      if (isSinglePoint) {
        ctx.arc(currentPos.x, currentPos.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      lastPosRef.current = currentPos;
    };

    const startScratch = (e) => {
      if (imagesRef.current.loadedCount < 2 || isLoading) return;
      e.preventDefault(); // ป้องกันพฤติกรรมเริ่มต้นเมื่อเริ่มสัมผัส/คลิก
      isDrawingRef.current = true;
      const pos = getMousePos(e);
      lastPosRef.current = pos;
      doScratchInternal(pos, true); // สำหรับการคลิก/แตะครั้งเดียว
    };

    const endScratch = (e) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      isDrawingRef.current = false;
    };

    const handleMove = (e) => {
      if (!isDrawingRef.current || imagesRef.current.loadedCount < 2 || isLoading) return;
      e.preventDefault(); // ป้องกันการ scroll ขณะลากนิ้ว/เมาส์บน canvas
      const pos = getMousePos(e);
      doScratchInternal(pos);
    };
    
    // Mouse events
    scratchCanvas.addEventListener('mousedown', startScratch);
    scratchCanvas.addEventListener('mouseup', endScratch);
    scratchCanvas.addEventListener('mousemove', handleMove);
    scratchCanvas.addEventListener('mouseleave', endScratch); // สิ้นสุดการวาดถ้าเมาส์ออกจาก canvas

    // Touch events
    scratchCanvas.addEventListener('touchstart', startScratch, { passive: false });
    scratchCanvas.addEventListener('touchend', endScratch, { passive: false });
    scratchCanvas.addEventListener('touchmove', handleMove, { passive: false });

    return () => {
      scratchCanvas.removeEventListener('mousedown', startScratch);
      scratchCanvas.removeEventListener('mouseup', endScratch);
      scratchCanvas.removeEventListener('mousemove', handleMove);
      scratchCanvas.removeEventListener('mouseleave', endScratch);
      scratchCanvas.removeEventListener('touchstart', startScratch);
      scratchCanvas.removeEventListener('touchend', endScratch);
      scratchCanvas.removeEventListener('touchmove', handleMove);
    };
  }, [brushSize, canvasSize, isLoading]); // Re-attach if brushSize, canvasSize, or isLoading changes

  return (
    <div
      ref={canvasWrapperRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%', // ให้ div ครอบกว้างเต็มพื้นที่ parent
        // height จะถูกกำหนดโดย aspectRatio และความกว้างที่คำนวณได้
        height: canvasSize.width > 0 ? `${canvasSize.height}px` : 'auto', // หรือ fallback height เช่น '200px'
        overflow: 'hidden', // ป้องกัน canvas ล้นออกนอกกรอบ
        touchAction: 'none', // ช่วยป้องกันการ scroll บน mobile ขณะ interact กับ canvas โดยตรง
      }}
    >
      {isLoading && (
        <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', color: '#555',
            fontSize: '16px', zIndex: 3
        }}>
            กำลังโหลดรูปภาพ...
        </div>
      )}
      <canvas
        ref={bottomCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', // ให้ canvas ขยายเต็ม div ครอบ
          height: '100%',// ให้ canvas ขยายเต็ม div ครอบ
          // border: '1px solid #ccc', // สามารถเปิดเพื่อ debug
          display: 'block',
          zIndex: 1,
        }}
      />
      <canvas
        ref={scratchCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', // ให้ canvas ขยายเต็ม div ครอบ
          height: '100%',// ให้ canvas ขยายเต็ม div ครอบ
          cursor: 'crosshair',
          display: 'block',
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default ScratchReveal;