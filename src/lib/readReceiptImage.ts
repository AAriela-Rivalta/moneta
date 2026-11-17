import workerPath from 'tesseract.js/dist/worker.min.js?url';

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

export class ReceiptReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReceiptReadError';
  }
}

export function isReceiptImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

export function assertReceiptImage(file: File): void {
  if (!isReceiptImage(file)) {
    throw new ReceiptReadError('Elegí una foto del ticket (JPG, PNG o WEBP).');
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new ReceiptReadError('La foto es demasiado grande. Probá con una de menos de 8 MB.');
  }
}

/**
 * Reconoce el texto de una foto en este dispositivo.
 * La primera vez descarga el lector en español; no envía la imagen a un servicio externo.
 */
export async function readReceiptImage(file: File): Promise<string> {
  assertReceiptImage(file);

  const { createWorker } = await import('tesseract.js');
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    worker = await createWorker('spa', undefined, {
      workerPath,
      workerBlobURL: false,
    });
    const result = await worker.recognize(file);
    return result.data.text ?? '';
  } catch (error) {
    if (error instanceof ReceiptReadError) throw error;
    throw new ReceiptReadError('No pude leer el ticket. Completá los datos a mano.');
  } finally {
    await worker?.terminate();
  }
}
