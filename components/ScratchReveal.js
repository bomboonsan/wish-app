'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Moveable from 'react-moveable';

import Lottie from "lottie-react";
// import congratulationAnimation from "../public/scratchreveal/congratulation.json";
import congratulationAnimation from "../public/scratchreveal/bubble.json";

const ScratchRevealDrag = ({
  topImageSrc = '/scratchreveal/nac-long-before.png',
  bottomImageSrc = '/scratchreveal/nac-long-after.png',
  brushSize = 100,
  aspectRatio = 1,
  className = '',
  // eraserImageSrc = '/scratchreveal/eraser-2.webp', // User updated to .gif
  eraserImageSrc = '/scratchreveal/eraser-4.gif', // User updated to .gif
}) => {
  const bottomCanvasRef = useRef(null);
  const scratchCanvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const eraserVisualRef = useRef(null);

  const alreadyTriggeredRef = useRef(false);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [isAnimationFirsttime, setIsAnimationFirsttime] = useState(true);

  useEffect(() => {
    setIsAnimationPlaying(false);
    setIsAnimationFirsttime(true);
  }, []);

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
  const [isEraserVisible, setIsEraserVisible] = useState(false);
  const [isUsedEraser, setIsUsedEraser] = useState(false);

  // Effect to make eraser visible when ready
  useEffect(() => {
    if (!isLoading && imagesRef.current.loadedCount === 2) {
      setIsEraserVisible(true);
      if (eraserVisualRef.current) {
        // Ensure initial transform is set if Moveable doesn't set it before first drag
        eraserVisualRef.current.style.transform = 'translate(0px, 0px)';
      }
    }
  }, [isLoading, imagesRef.current.loadedCount]);


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

  useEffect(() => {
    console.log('[useEffect ImageLoad] Triggered. New srcs:', topImageSrc, bottomImageSrc);
    setIsLoading(true);
    setIsEraserVisible(false); // Hide eraser while loading new images
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
      if (wrapper) {
        resizeObserver.unobserve(wrapper);
      }
      resizeObserver.disconnect();
    };
  }, [aspectRatio, canvasSize.width, canvasSize.height]);

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
  }, []);

  const doScratchInternal = useCallback((currentPos, isSinglePoint = false) => {

    checkScratchPercentage();

    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
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
  }, [brushSize]);

  const handleMoveableDragStart = useCallback(({ clientX, clientY, inputEvent, target }) => {

    setIsUsedEraser(true);

    if (imagesRef.current.loadedCount < 2 || isLoading) return;
    if (inputEvent) inputEvent.preventDefault();
    isDrawingRef.current = true;

    const pos = getMousePos({ clientX, clientY });
    if (!pos) return;

    console.log('[Moveable startScratch] Drawing started. Pos:', pos);
    lastPosRef.current = pos;
    doScratchInternal(pos, true);
    // No need to setIsEraserVisible(true) as it's controlled by isLoading and loadedCount
  }, [isLoading, getMousePos, doScratchInternal]);

  const handleMoveableDrag = useCallback(({ target, transform, clientX, clientY, inputEvent }) => {
    if (!isDrawingRef.current || imagesRef.current.loadedCount < 2 || isLoading) return;
    if (inputEvent) inputEvent.preventDefault();

    target.style.transform = transform; // Apply transform to the eraser div

    const pos = getMousePos({ clientX, clientY });
    if (!pos) return;

    doScratchInternal(pos, false);
    lastPosRef.current = pos;
  }, [isLoading, getMousePos, doScratchInternal]);

  const handleMoveableDragEnd = useCallback(({ inputEvent }) => {
    if (!isDrawingRef.current) return;
    if (inputEvent) inputEvent.preventDefault();
    isDrawingRef.current = false;
    console.log('[Moveable endScratch] Drawing ended.');
    // Do not hide eraser: setIsEraserVisible(false);
  }, []);

  const checkScratchPercentage = () => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
  
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const totalPixels = pixels.length / 4;
  
    let transparentPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3]; // ค่าความโปร่งใส
      if (alpha === 0) {
        transparentPixels++;
      }
    }
  
    const percent = (transparentPixels / totalPixels) * 100;
    if (percent >= 50 && !isAnimationPlaying && isAnimationFirsttime) {
      console.log('ขูดใกล้เสร็จแล้ว');
      console.log('Is frist time: ', isAnimationFirsttime);
      console.log('Is animation playing: ', isAnimationPlaying);
      setIsAnimationFirsttime(false);
      setIsAnimationPlaying(true);
      // setTimeout(() => { 
      //   setIsAnimationPlaying(false);  
      // }, 3000);
    }
    if (percent >= 50 && !alreadyTriggeredRef.current) {
      alreadyTriggeredRef.current = true;
    }
  };

  useEffect(() => {
    const interval = setInterval(checkScratchPercentage, 500); // ตรวจสอบทุก 100 มิลิวินาที
    return () => clearInterval(interval);
  }, []);

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
        touchAction: 'none',
        // border: '1px solid #ccc', // Kept commented as per user's code
        // backgroundColor: '#f0f0f0', // Kept commented
        cursor: isEraserVisible ? 'grab' : 'default', // Change cursor when eraser is active
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

      <div
        ref={eraserVisualRef}
        className={!isUsedEraser ? 'animation-blink' : ''}
        style={{
          display: isEraserVisible ? 'block' : 'none',
          position: 'absolute', // Relative to canvasWrapperRef
          left: '0px', // Initial position X
          top: '0px',  // Initial position Y
          width: `${brushSize}px`,
          height: `${brushSize}px`,
          backgroundImage: `url(${eraserImageSrc})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          borderRadius: '10%', // Kept from user's code
          // pointerEvents: 'none', // REMOVED to allow dragging the eraser itself
          zIndex: 10,
          // transform will be applied by Moveable
          cursor: 'grab', // Indicate it's draggable
        }}
      />

      {isEraserVisible && eraserVisualRef.current && ( // Render Moveable only when eraser is visible and ref is set
        <Moveable
            target={eraserVisualRef.current} // Target the eraser div itself
            draggable={true}
            edge={false}
            container={null}
            origin={false} // Kept from user's code
            throttleDrag={0}
            onDragStart={handleMoveableDragStart}
            onDrag={handleMoveableDrag}
            onDragEnd={handleMoveableDragEnd}
            // Optional: Keep eraser within its parent bounds
            // bounds={{ left:0, top:0, right: canvasSize.width - brushSize, bottom: canvasSize.height - brushSize }}
            // snappable={true}
            // snapCenter={true}
            hideDefaultLines={true}
        />
      )}

      {/* <div style={{position: 'absolute', bottom: '5px', left: '5px', fontSize: '10px', color: '#777', zIndex:3}}>
        Debug: {canvasSize.width}x{canvasSize.height} LD:{imagesRef.current.loadedCount} LoadState:{isLoading?'Loading':'Ready'}
      </div> */}
      {isAnimationPlaying && 
      <>
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full h-full'>
        <Lottie animationData={ congratulationAnimation } loop={false} />
      </div>

      <div className='absolute top-[26%] left-[39%] transform -translate-x-1/2 -translate-y-1/2 z-50 '>
        <span className="bg-[#16AFE6] text-white font-bold px-4 py-2 rounded-xl shadow-md text-newlook inline-block">
          New look
        </span>
      </div>
      </>
      }
      
    </div>
  );
};

export default ScratchRevealDrag;
