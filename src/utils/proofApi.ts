// Client helper for host corrections to a proof document.

export interface ProofChangeItem {
  page: string;
  current: string;
  suggested: string;
}

export interface ProofChangeSubmission {
  name: string;
  propertyName: string;
  email: string;
  document: string;
  comment: string;
  changes: ProofChangeItem[];
  photoData?: string; // base64 data URL
  photoMime?: string;
}

export async function submitProofChange(submission: ProofChangeSubmission): Promise<void> {
  const res = await fetch('/.netlify/functions/submit-proof-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Submission failed');
  }
}

// Downscale a chosen photo to keep the JSON upload small (mirrors the
// registration form's photo handling).
export function resizePhoto(file: File, maxDim = 1600, quality = 0.8): Promise<{ data: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not process image'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve({ data: canvas.toDataURL('image/jpeg', quality), mime: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
