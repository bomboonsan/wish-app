'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const ScratchRevealDrag = ({
  topImageSrc = '/scratchreveal/nac-long-before.png',
  bottomImageSrc = '/scratchreveal/nac-long-after.png',
  brushSize = 60,
  aspectRatio = 1,
  className = '',
}) => {
  const bottomCanvasRef = useRef(null);
  const scratchCanvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const imagesRef = useRef({
    top: null,
    bottom: null,
    loadedCount: 0,
    topSrc: topImageSrc,
    bottomSrc: bottomImageSrc,
  });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // สร้าง cursor เป็นรูปยางลบ
  const createEraserCursor = useCallback(() => {
    const cursorSize = Math.max(20, Math.min(brushSize, 60)); // จำกัดขนาด cursor
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = cursorSize;
    canvas.height = cursorSize;
    
    // วาดรูปยางลบ
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(0, 0, cursorSize, cursorSize * 0.7);
    
    // วาดส่วนบนของยางลบ (metallic band)
    ctx.fillStyle = '#FFD93D';
    ctx.fillRect(0, 0, cursorSize, cursorSize * 0.2);
    
    // เพิ่มเงา
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cursorSize * 0.8, cursorSize * 0.2, cursorSize * 0.2, cursorSize * 0.5);
    
    // วาดขอบ
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, cursorSize, cursorSize * 0.7);
    ctx.strokeRect(0, 0, cursorSize, cursorSize * 0.2);
    
    const dataURL = canvas.toDataURL();
    return `url(${dataURL}) ${cursorSize/2} ${cursorSize/2}, auto`;
  }, [brushSize]);

  // Alternative: สร้าง cursor แบบวงกลม
  const createCircleCursor = useCallback(() => {
    const cursorSize = Math.max(20, Math.min(brushSize, 60));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = cursorSize;
    canvas.height = cursorSize;
    
    // วาดวงกลมใส
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cursorSize/2, cursorSize/2, (cursorSize-4)/2, 0, Math.PI * 2);
    ctx.stroke();
    
    // เพิ่มจุดตรงกลาง
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(cursorSize/2, cursorSize/2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    const dataURL = canvas.toDataURL();
    return `url(${dataURL}) ${cursorSize/2} ${cursorSize/2}, auto`;
  }, [brushSize]);

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

    bottomCanvas.width = canvasSize.width;
    bottomCanvas.height = canvasSize.height;
    scratchCanvas.width = canvasSize.width;
    scratchCanvas.height = canvasSize.height;

    bottomCtx.drawImage(bottomImage, 0, 0, canvasSize.width, canvasSize.height);

    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(topImage, 0, 0, canvasSize.width, canvasSize.height);

    console.log(`Canvas redrawn to: ${canvasSize.width}x${canvasSize.height}`);
    setIsLoading(false);
  }, [canvasSize]);

  useEffect(() => {
    if (imagesRef.current.topSrc === topImageSrc && imagesRef.current.bottomSrc === bottomImageSrc && imagesRef.current.loadedCount === 2) {
      return;
    }

    setIsLoading(true);
    imagesRef.current.loadedCount = 0;

    const topImg = new Image();
    const bottomImg = new Image();
    imagesRef.current.top = topImg;
    imagesRef.current.bottom = bottomImg;
    imagesRef.current.topSrc = topImageSrc;
    imagesRef.current.bottomSrc = bottomImageSrc;

    let currentLoadedCount = 0;
    const checkAllLoaded = () => {
      currentLoadedCount++;
      imagesRef.current.loadedCount = currentLoadedCount;
      if (currentLoadedCount === 2) {
        console.log('All images loaded');
        if (canvasWrapperRef.current && (canvasSize.width === 0 || canvasSize.height === 0)) {
          const wrapper = canvasWrapperRef.current;
          const newWidth = wrapper.clientWidth;
          const newHeight = newWidth / aspectRatio;
          if (newWidth > 0) {
            setCanvasSize({ width: newWidth, height: newHeight });
          }
        } else if (canvasSize.width > 0 && canvasSize.height > 0) {
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

  }, [topImageSrc, bottomImageSrc, aspectRatio, drawImages, canvasSize.width, canvasSize.height]);

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

    const initialWidth = wrapper.clientWidth;
    if (initialWidth > 0) {
        const initialHeight = initialWidth / aspectRatio;
        setCanvasSize({ width: initialWidth, height: initialHeight });
    }

    return () => {
      resizeObserver.unobserve(wrapper);
      resizeObserver.disconnect();
    };
  }, [aspectRatio]);

  useEffect(() => {
    if (imagesRef.current.loadedCount === 2 && canvasSize.width > 0 && canvasSize.height > 0) {
      drawImages();
    }
  }, [canvasSize, drawImages]);

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
      e.preventDefault();
      isDrawingRef.current = true;
      const pos = getMousePos(e);
      lastPosRef.current = pos;
      doScratchInternal(pos, true);
    };

    const endScratch = (e) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      isDrawingRef.current = false;
    };

    const handleMove = (e) => {
      if (!isDrawingRef.current || imagesRef.current.loadedCount < 2 || isLoading) return;
      e.preventDefault();
      const pos = getMousePos(e);
      doScratchInternal(pos);
    };
    
    scratchCanvas.addEventListener('mousedown', startScratch);
    scratchCanvas.addEventListener('mouseup', endScratch);
    scratchCanvas.addEventListener('mousemove', handleMove);
    scratchCanvas.addEventListener('mouseleave', endScratch);

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
  }, [brushSize, canvasSize, isLoading]);

  return (
    <div
      ref={canvasWrapperRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: canvasSize.width > 0 ? `${canvasSize.height}px` : 'auto',
        overflow: 'hidden',
        touchAction: 'none',
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
          width: '100%',
          height: '100%',
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
          width: '100%',
          height: '100%',
          cursor: createEraserCursor(), // ใช้ custom eraser cursor
          display: 'block',
          zIndex: 2,
        }}
      />
      
      {/* Control Panel สำหรับทดสอบ */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255,255,255,0.9)',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 4
      }}>
        <div>Brush Size: {brushSize}px</div>
        <button
          onClick={() => {
            const canvas = scratchCanvasRef.current;
            if (canvas) {
              const style = canvas.style;
              style.cursor = style.cursor.includes('eraser') ? createCircleCursor() : createEraserCursor();
            }
          }}
          style={{
            marginTop: '5px',
            padding: '5px 10px',
            fontSize: '10px',
            backgroundColor: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Toggle Cursor
        </button>
      </div>
    </div>
  );
};

export default ScratchRevealDrag;