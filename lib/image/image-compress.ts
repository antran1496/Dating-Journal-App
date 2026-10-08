/**
 * Nén ảnh hiệu năng cao cho Web & Mobile:
 * 1. Dùng createImageBitmap hoặc ObjectURL thay vì FileReader.readAsDataURL (tránh convert base64 gây đơ UI/CPU).
 * 2. Xuất định dạng WebP (với fallback JPEG nếu trình duyệt cũ không hỗ trợ WebP canvas export).
 * 3. Kích thước mặc định 1280x1280, quality 0.8 -> Giảm dung lượng từ 5-10MB xuống còn ~100-200KB (giảm 90-95%), tải cực nhanh.
 */
export async function compressImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<File> {
  // Không nén file không phải ảnh hoặc ảnh động GIF
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  // Nếu file đã rất nhỏ (<= 150KB) và là định dạng nén sẵn, không cần nén lại
  if (file.size <= 150 * 1024 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return file;
  }

  try {
    let sourceWidth = 0;
    let sourceHeight = 0;
    let imageSource: ImageBitmap | HTMLImageElement | null = null;
    let cleanup: (() => void) | null = null;

    // Ưu tiên createImageBitmap (giải mã ảnh không khóa main-thread)
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      try {
        const bitmap = await createImageBitmap(file);
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        imageSource = bitmap;
        cleanup = () => bitmap.close?.();
      } catch {
        // Fallback sang Image element nếu createImageBitmap không đọc được file đặc biệt
        imageSource = null;
      }
    }

    // Fallback: dùng URL.createObjectURL (nhanh hơn FileReader hàng chục lần vì không tạo base64)
    if (!imageSource) {
      const objectUrl = URL.createObjectURL(file);
      cleanup = () => URL.revokeObjectURL(objectUrl);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Không thể tải ảnh để nén'));
        img.src = objectUrl;
      });
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
      imageSource = img;
    }

    // Tính toán kích thước thu nhỏ giữ nguyên tỷ lệ
    let targetWidth = sourceWidth;
    let targetHeight = sourceHeight;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
        targetWidth = maxWidth;
      } else {
        targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
        targetHeight = maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cleanup?.();
      return file;
    }

    ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);
    cleanup?.();

    // Xuất ra WebP với fallback JPEG
    return await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Trường hợp trình duyệt cũ không hỗ trợ WebP canvas export (sẽ trả về PNG không nén)
          if (blob.type === 'image/png') {
            canvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob || jpegBlob.size >= file.size) {
                  resolve(file);
                  return;
                }
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                resolve(
                  new File([jpegBlob], `${nameWithoutExt}.jpg`, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  })
                );
              },
              'image/jpeg',
              quality
            );
            return;
          }

          // Nếu file sau khi nén không nhỏ hơn file gốc thì giữ nguyên file gốc
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${nameWithoutExt}.${ext}`, {
            type: blob.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/webp',
        quality
      );
    });
  } catch (err) {
    console.warn('[compressImage] Lỗi nén ảnh, sử dụng file gốc:', err);
    return file;
  }
}

/**
 * Tạo ảnh thumbnail kích thước nhỏ (mặc định 480px, chất lượng 0.75) cho preview và proxy nhanh.
 */
export async function makeThumbnail(file: File, maxDim = 480, quality = 0.75): Promise<File> {
  return compressImage(file, maxDim, maxDim, quality);
}

/**
 * Trích xuất ảnh poster và thời lượng từ video (HTML5 Video Element)
 */
export async function extractVideoPoster(
  file: File,
  timeSec = 0.5
): Promise<{ posterFile: File; duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Chỉ hỗ trợ trong môi trường trình duyệt'));
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      video.currentTime = Math.min(timeSec, Math.max(0, duration / 2));
    };

    video.onseeked = () => {
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 720);
        canvas.height = Math.round((height * canvas.width) / width);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error('Không thể tạo canvas'));
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              return reject(new Error('Không thể tạo ảnh poster từ video'));
            }
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const posterFile = new File([blob], `${nameWithoutExt}_poster.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve({
              posterFile,
              duration: video.duration || 0,
              width,
              height,
            });
          },
          'image/webp',
          0.8
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Không thể đọc file video'));
    };
  });
}
