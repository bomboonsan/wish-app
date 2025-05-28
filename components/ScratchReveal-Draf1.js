'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Moveable from 'react-moveable'; // 1. เพิ่ม react-moveable

const ScratchRevealDrag = ({
  topImageSrc = '/scratchreveal/nac-long-before.png',
  bottomImageSrc = '/scratchreveal/nac-long-after.png',
  brushSize = 60,
  aspectRatio = 1,
  className = '',
  eraserImageSrc = '/scratchreveal/eraser.gif', // 2. Prop สำหรับรูปยางลบ
}) => {
  const bottomCanvasRef = useRef(null);
  const scratchCanvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const eraserVisualRef = useRef(null); // 3. Ref สำหรับ div ยางลบ

  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const imagesRef = useRef({
    top: null,
    bottom: null,
    loadedCount: 0,
    _currentTopSrc: null,
    _currentBottomSrc: null,
  });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isEraserVisible, setIsEraserVisible] = useState(false); // 4. State ควบคุมการแสดงยางลบ

  // ฟังก์ชันวาดรูปภาพ (memoized) - ไม่เปลี่ยนแปลงจากเดิมมากนัก
  const drawImages = useCallback(() => {
    console.log('[drawImages] Called. CanvasSize:', canvasSize);
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
      console.warn('[drawImages] Aborted: Missing canvas, images, or zero canvasSize.');
      return;
    }

    const bottomCtx = bottomCanvas.getContext('2d');
    const scratchCtx = scratchCanvas.getContext('2d');
    if (!bottomCtx || !scratchCtx) {
      console.warn('[drawImages] Aborted: Failed to get 2D context.');
      return;
    }

    bottomCanvas.width = canvasSize.width;
    bottomCanvas.height = canvasSize.height;
    scratchCanvas.width = canvasSize.width;
    scratchCanvas.height = canvasSize.height;
    console.log(`[drawImages] Canvas drawing surface set to: ${canvasSize.width}x${canvasSize.height}`);

    bottomCtx.drawImage(bottomImage, 0, 0, canvasSize.width, canvasSize.height);
    console.log('[drawImages] Bottom image drawn.');

    scratchCtx.globalCompositeOperation = 'source-over';
    scratchCtx.drawImage(topImage, 0, 0, canvasSize.width, canvasSize.height);
    console.log('[drawImages] Top image drawn on scratch canvas. GCO:', scratchCtx.globalCompositeOperation);

    setIsLoading(false);
    console.log('[drawImages] setIsLoading(false). isLoading is now false.');
  }, [canvasSize]);

  // Effect สำหรับโหลดรูปภาพ - ไม่เปลี่ยนแปลงจากเดิม
  useEffect(() => {
    console.log('[useEffect ImageLoad] Triggered. New srcs:', topImageSrc, bottomImageSrc);
    setIsLoading(true);
    console.log('[useEffect ImageLoad] setIsLoading(true).');
    imagesRef.current.loadedCount = 0;
    imagesRef.current.top = new Image();
    imagesRef.current.bottom = new Image();
    imagesRef.current._currentTopSrc = topImageSrc;
    imagesRef.current._currentBottomSrc = bottomImageSrc;

    let currentLoadedCount = 0;

    const checkAllLoaded = (imageType) => {
      if (imagesRef.current._currentTopSrc !== topImageSrc || imagesRef.current._currentBottomSrc !== bottomImageSrc) {
        console.log(`[checkAllLoaded ${imageType}] Stale load event, ignoring.`);
        return;
      }
      currentLoadedCount++;
      imagesRef.current.loadedCount = currentLoadedCount;
      console.log(`[checkAllLoaded ${imageType}] Loaded. Count: ${currentLoadedCount}`);
      if (currentLoadedCount === 2) {
        console.log('[checkAllLoaded] All images for current srcs loaded.');
        if (canvasWrapperRef.current && (canvasSize.width === 0 || canvasSize.height === 0)) {
          const wrapper = canvasWrapperRef.current;
          const newWidth = wrapper.clientWidth;
          if (newWidth > 0) {
            const newHeight = newWidth / aspectRatio;
            console.log(`[checkAllLoaded] Wrapper clientWidth: ${newWidth}. Calculated initial canvasSize: ${newWidth}x${newHeight}`);
            setCanvasSize({ width: newWidth, height: newHeight });
          } else {
             console.warn('[checkAllLoaded] Wrapper clientWidth is 0, cannot set initial canvas size yet.');
          }
        }
      }
    };

    imagesRef.current.top.onload = () => checkAllLoaded('Top');
    imagesRef.current.bottom.onload = () => checkAllLoaded('Bottom');
    imagesRef.current.top.onerror = () => {
      console.error('[useEffect ImageLoad] Failed to load top image:', topImageSrc);
      if (imagesRef.current._currentTopSrc === topImageSrc) {
        imagesRef.current.loadedCount = -1;
        setIsLoading(false);
      }
    };
    imagesRef.current.bottom.onerror = () => {
      console.error('[useEffect ImageLoad] Failed to load bottom image:', bottomImageSrc);
      if (imagesRef.current._currentBottomSrc === bottomImageSrc) {
        imagesRef.current.loadedCount = -1;
        setIsLoading(false);
      }
    };
    imagesRef.current.top.src = topImageSrc;
    imagesRef.current.bottom.src = bottomImageSrc;
    console.log('[useEffect ImageLoad] Image sources set.');
  }, [topImageSrc, bottomImageSrc, aspectRatio]);

  // Effect สำหรับ ResizeObserver - ไม่เปลี่ยนแปลงจากเดิม
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;
    console.log('[useEffect ResizeObserver] Setting up observer.');
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0) {
          const newHeight = newWidth / aspectRatio;
          setCanvasSize((prevSize) => {
            if (Math.abs(prevSize.width - newWidth) > 1 || Math.abs(prevSize.height - newHeight) > 1) {
              console.log(`[ResizeObserver] Size changed. New canvasSize: ${newWidth}x${newHeight}`);
              return { width: newWidth, height: newHeight };
            }
            return prevSize;
          });
        }
      }
    });
    resizeObserver.observe(wrapper);
    const initialWidth = wrapper.clientWidth;
    if (initialWidth > 0 && (canvasSize.width === 0 || canvasSize.height === 0)) {
        const initialHeight = initialWidth / aspectRatio;
        console.log(`[ResizeObserver] Setting initial canvasSize from wrapper: ${initialWidth}x${initialHeight}`);
        setCanvasSize({ width: initialWidth, height: initialHeight });
    }
    return () => {
      console.log('[useEffect ResizeObserver] Cleaning up observer.');
      if (wrapper) { // Check if wrapper still exists
        resizeObserver.unobserve(wrapper);
      }
      resizeObserver.disconnect();
    };
  }, [aspectRatio, canvasSize.width, canvasSize.height]); // Added canvasSize to dependencies for initial check

  // Effect to draw images when canvasSize is ready and images are loaded - ไม่เปลี่ยนแปลงจากเดิม
  useEffect(() => {
    console.log(`[useEffect DrawTrigger] Checking conditions. LoadedCount: ${imagesRef.current.loadedCount}, Canvas: ${canvasSize.width}x${canvasSize.height}`);
    if (imagesRef.current.loadedCount === 2 && canvasSize.width > 0 && canvasSize.height > 0) {
      console.log('[useEffect DrawTrigger] Conditions met, calling drawImages.');
      drawImages();
    } else if (imagesRef.current.loadedCount === -1 && isLoading) {
      console.log('[useEffect DrawTrigger] Images failed to load, ensuring isLoading is false.');
      setIsLoading(false);
    }
  }, [canvasSize, imagesRef.current.loadedCount, drawImages, isLoading]);


  // ฟังก์ชันแปลงพิกัดเมาส์/นิ้ว ไปเป็นพิกัดบน canvas (memoized)
  const getMousePos = useCallback((eventData) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const { clientX, clientY } = eventData;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []); // No dependencies needed as refs are stable

  // ฟังก์ชันขูดภาพภายใน (memoized)
  const doScratchInternal = useCallback((currentPos, isSinglePoint = false) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // console.log('[doScratchInternal] Pos:', currentPos, 'isSinglePoint:', isSinglePoint, 'Brush:', brushSize);
    // console.log('[doScratchInternal] Current GCO before setting:', ctx.globalCompositeOperation);
    ctx.globalCompositeOperation = 'destination-out';
    // console.log('[doScratchInternal] GCO after setting:', ctx.globalCompositeOperation);
    ctx.beginPath();
    if (isSinglePoint) {
      ctx.arc(currentPos.x, currentPos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      // console.log('[doScratchInternal] Arc filled.');
    } else {
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      // console.log('[doScratchInternal] Line stroked from', lastPosRef.current, 'to', currentPos);
    }
  }, [brushSize]); // Depends on brushSize

  // 5. Event handlers สำหรับ react-moveable
  const handleMoveableDragStart = useCallback(({ clientX, clientY, inputEvent }) => {
    if (imagesRef.current.loadedCount < 2 || isLoading) return;
    if (inputEvent) inputEvent.preventDefault(); // Check if inputEvent exists
    isDrawingRef.current = true;

    const pos = getMousePos({ clientX, clientY });
    if (!pos) return;

    console.log('[Moveable startScratch] Drawing started. Pos:', pos);
    lastPosRef.current = pos;
    doScratchInternal(pos, true);

    if (eraserVisualRef.current) {
      // Center eraser image on cursor
      eraserVisualRef.current.style.left = `${clientX - brushSize / 2}px`;
      eraserVisualRef.current.style.top = `${clientY - brushSize / 2}px`;
      setIsEraserVisible(true);
    }
  }, [isLoading, getMousePos, doScratchInternal, brushSize]);

  const handleMoveableDrag = useCallback(({ clientX, clientY, inputEvent }) => {
    if (!isDrawingRef.current || imagesRef.current.loadedCount < 2 || isLoading) return;
    if (inputEvent) inputEvent.preventDefault(); // Check if inputEvent exists

    const pos = getMousePos({ clientX, clientY });
    if (!pos) return;

    doScratchInternal(pos, false);
    lastPosRef.current = pos;

    if (eraserVisualRef.current) {
      eraserVisualRef.current.style.left = `${clientX - brushSize / 2}px`;
      eraserVisualRef.current.style.top = `${clientY - brushSize / 2}px`;
    }
  }, [isLoading, getMousePos, doScratchInternal, brushSize]);

  const handleMoveableDragEnd = useCallback(({ inputEvent }) => {
    if (!isDrawingRef.current) return;
    if (inputEvent) inputEvent.preventDefault(); // Check if inputEvent exists
    isDrawingRef.current = false;
    console.log('[Moveable endScratch] Drawing ended.');
    setIsEraserVisible(false);
  }, []);

  // 6. ลบ useEffect เดิมที่ใช้สำหรับ scratch interaction logic ออกไป

  return (
    <div
      ref={canvasWrapperRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: canvasSize.width > 0 ? `${canvasSize.height}px` : 'auto',
        minHeight: '100px',
        overflow: 'hidden',
        touchAction: 'none', // Important for touch interactions with Moveable
        // border: '1px solid #ccc',
        // backgroundColor: '#f0f0f0',
        cursor: isEraserVisible ? 'none' : 'crosshair', // Hide default cursor when eraser is visible
      }}
      onMouseEnter={() => {
        if (imagesRef.current.loadedCount === 2 && !isLoading && eraserVisualRef.current) {
            // setIsEraserVisible(true); // Consider enabling this for hover effect
        }
      }}
      onMouseLeave={() => {
        if (!isDrawingRef.current) {
            // setIsEraserVisible(false); // Consider enabling this for hover effect
        }
      }}
      onMouseMove={(e) => {
        if (!isDrawingRef.current && isEraserVisible && eraserVisualRef.current) {
            eraserVisualRef.current.style.left = `${e.clientX - brushSize / 2}px`;
            eraserVisualRef.current.style.top = `${e.clientY - brushSize / 2}px`;
        }
      }}
    >
      {isLoading && (
        <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', color: '#333',
            fontSize: '16px', zIndex: 11, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '5px'
        }}>
            กำลังโหลดรูปภาพ...
        </div>
      )}
      <canvas
        ref={bottomCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 }}
      />
      <canvas
        ref={scratchCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block', zIndex: 2 }}
      />

      {/* 7. Visual Eraser Element */}
      <div
        ref={eraserVisualRef}
        style={{
          display: isEraserVisible ? 'block' : 'none',
          position: 'fixed', // Fixed position to follow mouse across viewport
          width: `${brushSize}px`, // Eraser visual size
          height: `${brushSize}px`,
          backgroundImage: `url(${eraserImageSrc})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          borderRadius: '10%',
          pointerEvents: 'none', // VERY IMPORTANT: Allows events to pass through to Moveable target
          zIndex: 10, // Ensure it's on top of other elements
        }}
      />

      {/* 8. Moveable Component */}
      {imagesRef.current.loadedCount === 2 && !isLoading && canvasSize.width > 0 && canvasWrapperRef.current && (
        <Moveable
            origin={false}
            target={canvasWrapperRef.current} // Target the wrapper div
            draggable={true}
            throttleDrag={0}
            onDragStart={handleMoveableDragStart}
            onDrag={handleMoveableDrag}
            onDragEnd={handleMoveableDragEnd}
        />
      )}

      {/* <div style={{position: 'absolute', bottom: '5px', left: '5px', fontSize: '10px', color: '#777', zIndex:3}}>
        Debug: {canvasSize.width}x{canvasSize.height} LD:{imagesRef.current.loadedCount} LoadState:{isLoading?'Loading':'Ready'}
      </div> */}
    </div>
  );
};

export default ScratchRevealDrag;