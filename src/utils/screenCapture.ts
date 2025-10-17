// Request screen capture permission once and return the stream
export async function requestScreenCaptureStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor', // Request full screen/monitor instead of window/tab
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    
    console.log('📸 Screen capture stream obtained');
    return stream;
  } catch (error) {
    console.error('Screen capture error:', error);
    throw new Error('Failed to get screen sharing permission. Please allow screen sharing.');
  }
}

// Capture screenshot from an existing stream
export async function captureFromStream(stream: MediaStream): Promise<string> {
  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    
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
    
    // Clean up video element
    video.pause();
    video.srcObject = null;
    
    // Return base64 JPEG (compressed for faster upload)
    return canvas.toDataURL('image/jpeg', 0.7);
    
  } catch (error) {
    console.error('Screenshot capture error:', error);
    throw new Error('Failed to capture screenshot from stream.');
  }
}

// Stop the screen capture stream
export function stopScreenCaptureStream(stream: MediaStream) {
  stream.getTracks().forEach(track => track.stop());
  console.log('📸 Screen capture stream stopped');
}
