import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import iconv from 'iconv-lite';
import { spawn } from 'child_process';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cors());
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const PRINTER_NAME = process.env.PRINTER_NAME || 'POS Printer 203DPI Series';

function toBuffer(hexArray) {
  return Buffer.from(hexArray);
}

function escposInit() {
  const cmds = [];
  // Initialize
  cmds.push(0x1b, 0x40);
  // Character code table: PC437 (USA: Standard Europe)
  cmds.push(0x1b, 0x74, 0);
  return Buffer.from(cmds);
}

function textLine(str = '') {
  const data = iconv.encode(str + '\r\n', 'cp437');
  return Buffer.from(data);
}

function cutPartial() {
  return Buffer.from([0x1d, 0x56, 0x01]);
}

function hr() {
  return textLine('--------------------------------');
}

function sendToPrinter(buf) {
  return new Promise((resolve, reject) => {
    const base64 = buf.toString('base64');
    const scriptPath = fileURLToPath(new URL('../scripts/rawprint.ps1', import.meta.url));
    const ps = spawn('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-Printer', PRINTER_NAME,
      '-Base64', base64,
    ], { windowsHide: true });
    let stderr = '';
    ps.stderr.on('data', d => stderr += d.toString());
    ps.on('close', code => {
      if (code === 0) return resolve('ok');
      reject(new Error(`rawprint.ps1 exited ${code}: ${stderr}`));
    });
  });
}

app.get('/printers', (_req, res) => {
  res.json([PRINTER_NAME]);
});

app.post('/print/test', async (_req, res) => {
  try {
    const chunks = [];
    chunks.push(escposInit());
    chunks.push(textLine('TEST RECEIPT'));
    chunks.push(hr());
    chunks.push(textLine('Left aligned'));
    // Align right
    chunks.push(toBuffer([0x1b, 0x61, 0x02]));
    chunks.push(textLine('123456'));
    // Back to left
    chunks.push(toBuffer([0x1b, 0x61, 0x00]));
    chunks.push(hr());
    chunks.push(textLine('Thank you!'));
    chunks.push(textLine(''));
    chunks.push(textLine(''));
    chunks.push(textLine(''));
    chunks.push(textLine(''));
    chunks.push(textLine(''));
    chunks.push(textLine(''));
    chunks.push(cutPartial());
    const data = Buffer.concat(chunks);
    const job = await sendToPrinter(data);
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Print plain text lines; accepts { text } or { lines: [] }
app.post('/print/text', async (req, res) => {
  try {
    const { text = '', lines = null } = req.body || {};
    const chunks = [];
    chunks.push(escposInit());
    if (Array.isArray(lines) && lines.length) {
      for (const ln of lines) chunks.push(textLine(String(ln)));
    } else {
      const txt = String(text);
      for (const ln of txt.split(/\r?\n/)) chunks.push(textLine(ln));
    }
    chunks.push(textLine(''));
    chunks.push(cutPartial());
    const data = Buffer.concat(chunks);
    console.log(`print/text bytes=${data.length}`);
    const job = await sendToPrinter(data);
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Simple GET trigger for quick browser tests: /print/text?msg=Hello
app.get('/print/text', async (req, res) => {
  try {
    const msg = String(req.query.msg ?? 'Hello from service');
    const chunks = [];
    chunks.push(escposInit());
    chunks.push(textLine(msg));
    chunks.push(textLine(''));
    chunks.push(cutPartial());
    const data = Buffer.concat(chunks);
    console.log(`print/text(GET) bytes=${data.length}`);
    const job = await sendToPrinter(data);
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, printer: PRINTER_NAME });
});

// Plain raw text (no ESC/POS). Some GDI drivers will only print this mode.
app.post('/print/raw', async (req, res) => {
  try {
    const { text = '' } = req.body || {};
    const buf = Buffer.from(String(text) + '\r\n\r\n', 'ascii');
    console.log(`print/raw bytes=${buf.length}`);
    const job = await sendToPrinter(buf);
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/print/raw', async (req, res) => {
  try {
    const msg = String(req.query.msg ?? 'Hello RAW');
    const buf = Buffer.from(msg + '\r\n\r\n', 'ascii');
    console.log(`print/raw(GET) bytes=${buf.length}`);
    const job = await sendToPrinter(buf);
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});
// Expect { header, items: [{name, qty, price}], total }
app.post('/print/receipt', async (req, res) => {
  try {
    const { header = 'Receipt', items = [], total = 0 } = req.body || {};
    const chunks = [];
    chunks.push(escposInit());
    // Center
    chunks.push(toBuffer([0x1b, 0x61, 0x01]));
    chunks.push(textLine(header));
    chunks.push(toBuffer([0x1b, 0x61, 0x00]));
    chunks.push(hr());
    for (const it of items) {
      const qty = it.qty ?? 1;
      const price = Number(it.price ?? 0).toFixed(2);
      // Format as two columns within ~32 chars
      const left = `${qty} x ${it.name}`.slice(0, 24);
      const right = price.toString().padStart(8, ' ');
      chunks.push(textLine(left + right));
    }
    chunks.push(hr());
    const totalStr = Number(total).toFixed(2);
    const left = 'TOTAL'.padEnd(24, ' ');
    const right = totalStr.padStart(8, ' ');
    chunks.push(textLine(left + right));
    chunks.push(textLine(''));
    chunks.push(textLine('Thank you!'));
    chunks.push(textLine(''));
    chunks.push(cutPartial());
    const data = Buffer.concat(chunks);
    const job = await sendToPrinter(data);
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Printer service listening on http://${HOST}:${PORT} using "${PRINTER_NAME}"`);
});
