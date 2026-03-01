// mobile/src/services/ocr.ts
// Uses @react-native-ml-kit/text-recognition — FREE, Google ML Kit, runs on device
import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OCRResult {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  confidence: 'high' | 'low';
  rawText: string;
}

export async function scanReceipt(imageUri: string): Promise<OCRResult> {
  const result = await TextRecognition.recognize(imageUri);
  const text = result.text || '';
  return parseReceiptText(text);
}

function parseReceiptText(text: string): OCRResult {
  const lower = text.toLowerCase();

  // Extract amount — find total/grand total line
  let amount = 0;
  const amtPatterns = [
    /total[:\s]*(?:rs\.?|lkr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /grand\s*total[:\s]*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:rs|lkr)\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]{2,}\.?\d{0,2})/,
  ];
  for (const pat of amtPatterns) {
    const m = text.match(pat);
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (v > 0 && v < 5_000_000) { amount = v; break; }
    }
  }

  // Extract date
  let date = new Date().toISOString().slice(0, 10);
  const dateM = text.match(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})/);
  if (dateM) {
    try {
      const d = new Date(dateM[0].replace(/\./g, '/'));
      if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
    } catch {}
  }

  // Extract merchant (first non-empty, non-numeric line)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !/^\d+$/.test(l));
  const merchant = lines[0] || 'Receipt';

  // Guess category
  const cat =
    lower.match(/supermark|grocery|cargill|keells|food city|arpico/)      ? 'food'      :
    lower.match(/pharma|hospital|medical|clinic|channelling/)              ? 'health'    :
    lower.match(/petrol|fuel|uber|taxi|pickme|cpc/)                        ? 'transport' :
    lower.match(/leco|electric|water|dialog|slt|mobitel|hutch/)            ? 'utilities' :
    lower.match(/restaur|hotel|cafe|pizza|burger|kfc|mcdonalds|dominos/)   ? 'dining'    :
    lower.match(/clothing|fashion|odel|h&m|zara|shoe/)                     ? 'shopping'  : 'other';

  return { merchant, amount, date, category: cat, confidence: amount > 0 ? 'high' : 'low', rawText: text.slice(0, 500) };
}
