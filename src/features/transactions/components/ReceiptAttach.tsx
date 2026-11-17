import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { amountToField, parseReceiptText, type ReceiptDraft } from '@/domain/receipt';
import { ReceiptReadError, assertReceiptImage, readReceiptImage } from '@/lib/readReceiptImage';

interface ReceiptAttachProps {
  onApply: (draft: ReceiptDraft) => void;
}

function receiptSummary(draft: ReceiptDraft): string {
  const parts: string[] = [];
  if (draft.merchant) parts.push(draft.merchant);
  if (draft.amount !== null) parts.push(amountToField(draft.amount));
  if (draft.date) {
    const [year, month, day] = draft.date.split('-');
    parts.push(`${day}/${month}/${year}`);
  }
  const found = parts.length > 0 ? `Encontré ${parts.join(' · ')}. ` : '';
  return `${found}Revisá los datos antes de guardar. La foto no se guarda.`;
}

export function ReceiptAttach({ onApply }: ReceiptAttachProps) {
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onApplyRef = useRef(onApply);
  const activeRef = useRef(true);

  useEffect(() => {
    onApplyRef.current = onApply;
  }, [onApply]);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = async (file: File | undefined) => {
    if (!file || reading) return;
    setFailed(false);
    try {
      assertReceiptImage(file);
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof ReceiptReadError ? error.message : 'No pude leer el ticket. Completá los datos a mano.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setReading(true);
    setMessage('Leyendo el ticket… La primera vez se descarga el lector de texto y puede demorar.');
    setPreview(URL.createObjectURL(file));

    try {
      const text = await readReceiptImage(file);
      if (!activeRef.current) return;
      const draft = parseReceiptText(text);
      if (!draft.merchant && draft.amount === null && !draft.date) {
        setFailed(true);
        setMessage('No encontré monto, fecha ni comercio. Completá el formulario a mano. La foto no se guarda.');
        return;
      }
      onApplyRef.current(draft);
      setMessage(receiptSummary(draft));
    } catch (error) {
      if (!activeRef.current) return;
      setFailed(true);
      setMessage(error instanceof ReceiptReadError ? error.message : 'No pude leer el ticket. Completá los datos a mano.');
    } finally {
      if (activeRef.current) setReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-cream-50/70 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          className={buttonClasses({
            variant: 'secondary',
            size: 'sm',
            className: reading ? 'pointer-events-none opacity-50' : 'cursor-pointer',
          })}
        >
          <ImagePlus className="size-4" aria-hidden />
          {reading ? 'Leyendo…' : 'Adjuntar ticket'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={reading}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>
        <p className="text-xs text-ink-500">Leemos la foto en este dispositivo y completamos lo que falte. La imagen no se guarda.</p>
      </div>
      {preview && (
        <img src={preview} alt="Vista previa del ticket. No se guarda con el gasto." className="mt-3 max-h-40 w-full rounded-lg bg-white object-contain" />
      )}
      {message && (
        <p className={`mt-3 text-xs ${failed ? 'font-medium text-coral-600' : 'text-ink-600'}`} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
