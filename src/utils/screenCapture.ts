export async function captureCurrentWindow(): Promise<string> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });
    
    await video.play();
    
    // Create canvas and capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Stop all tracks
    stream.getTracks().forEach(track => track.stop());
    
    // Return base64 JPEG (compressed for faster upload)
    return canvas.toDataURL('image/jpeg', 0.7);
    
  } catch (error) {
    console.error('Screen capture error:', error);
    throw new Error('Failed to capture screen. Please allow screen sharing.');
  }
}
