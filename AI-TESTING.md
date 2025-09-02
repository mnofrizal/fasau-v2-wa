# 🤖 AI Functions Testing Guide

Panduan lengkap untuk menguji AI functions menggunakan OpenRouter API.

## 📋 Prerequisites

1. **OpenRouter API Key**: Dapatkan dari [OpenRouter.ai](https://openrouter.ai)
2. **Environment Setup**: Pastikan API key sudah dikonfigurasi di `.env`

## ⚙️ Setup

### 1. Konfigurasi API Key

Edit file `.env` dan tambahkan API key Anda:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. Konfigurasi Model (Opsional)

Anda bisa mengubah model AI yang digunakan di `.env`:

```env
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
# atau model lain seperti:
# OPENROUTER_MODEL=openai/gpt-4
# OPENROUTER_MODEL=google/gemini-pro
```

## 🚀 Cara Testing

### Method 1: Menggunakan NPM Scripts (Recommended)

#### Test Semua Functions:

```bash
npm run test-ai
```

#### Test Specific Functions:

```bash
# Test API Health
npm run test-ai-health

# Test Generate Response
npm run test-ai-response

# Test Generate JSON
npm run test-ai-json

# Test Analyze Text
npm run test-ai-analyze

# Test Generate Status Update
npm run test-ai-status

# Test Summarize Text
npm run test-ai-summarize

# Test Generate Structured Report
npm run test-ai-report
```

### Method 2: Direct Node Execution

#### Test Semua Functions:

```bash
node test-ai.js
```

#### Test Specific Functions:

```bash
node test-ai.js health
node test-ai.js response
node test-ai.js json
node test-ai.js analyze
node test-ai.js status
node test-ai.js summarize
node test-ai.js report
```

## 📊 Test Functions Overview

### 1. **API Health Check** (`health`)

- Mengecek koneksi ke OpenRouter API
- Memverifikasi API key valid
- **Command**: `npm run test-ai-health`

### 2. **Generate Response** (`response`)

- Test generate respons teks umum
- Contoh: Membuat ucapan selamat promosi
- **Command**: `npm run test-ai-response`

### 3. **Generate JSON** (`json`)

- Test generate data dalam format JSON
- Contoh: Membuat profil karyawan terstruktur
- **Command**: `npm run test-ai-json`

### 4. **Analyze Text** (`analyze`)

- Test analisis dan kategorisasi teks
- Contoh: Menganalisis laporan complaint/request
- **Command**: `npm run test-ai-analyze`

### 5. **Generate Status Update** (`status`)

- Test pembuatan status update dari laporan
- Contoh: Membuat update status kerusakan
- **Command**: `npm run test-ai-status`

### 6. **Summarize Text** (`summarize`)

- Test meringkas teks panjang
- Contoh: Meringkas laporan incident
- **Command**: `npm run test-ai-summarize`

### 7. **Generate Structured Report** (`report`)

- Test mengubah teks bebas menjadi laporan terstruktur
- Contoh: Strukturisasi laporan kebocoran
- **Command**: `npm run test-ai-report`

## 📝 Sample Output

### Successful Test Output:

```
🚀 Starting AI Functions Test Suite
============================================================
🔍 Testing API Health...
✅ API is healthy and accessible
============================================================
🤖 Testing Generate Response...
✅ Response generated successfully:
Selamat atas promosi Anda menjadi Manager! Pencapaian ini adalah...
============================================================
```

### Error Output:

```
⚠️  WARNING: OPENROUTER_API_KEY is not set in environment variables
   Please set your OpenRouter API key in .env file to run tests
   Example: OPENROUTER_API_KEY=your_api_key_here
```

## 🔧 Troubleshooting

### Problem: API Key Not Set

**Error**: `OPENROUTER_API_KEY is not set`
**Solution**:

1. Buka file `.env`
2. Tambahkan: `OPENROUTER_API_KEY=your_actual_api_key`
3. Restart test

### Problem: API Not Accessible

**Error**: `API is not accessible or not configured`
**Solutions**:

1. Periksa koneksi internet
2. Verifikasi API key valid di OpenRouter dashboard
3. Cek quota/limit API key
4. Periksa firewall/proxy settings

### Problem: Model Not Found

**Error**: `Model not found or not accessible`
**Solution**:

1. Periksa model name di `.env`
2. Gunakan model yang tersedia di OpenRouter
3. Cek akses model di dashboard OpenRouter

### Problem: Timeout Error

**Error**: `Request timeout`
**Solution**:

1. Tingkatkan timeout di `.env`: `OPENROUTER_TIMEOUT=60000`
2. Periksa koneksi internet
3. Coba model yang lebih cepat

## 🎯 Custom Testing

### Membuat Test Custom:

```javascript
import { generateResponse } from "./utils/ai.js";

const customTest = async () => {
  try {
    const result = await generateResponse("Your custom prompt here");
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

customTest();
```

### Testing dengan Parameter Custom:

```javascript
import { generateJSON } from "./utils/ai.js";

const customJSONTest = async () => {
  const options = {
    model: "openai/gpt-4",
    temperature: 0.5,
    maxTokens: 1000,
  };

  const result = await generateJSON(
    "Create a project plan",
    { title: "string", tasks: ["array"] },
    options
  );

  console.log(JSON.stringify(result, null, 2));
};
```

## 📈 Performance Tips

1. **Model Selection**: Claude-3.5-Sonnet untuk kualitas, GPT-3.5-Turbo untuk kecepatan
2. **Token Management**: Set `maxTokens` sesuai kebutuhan
3. **Temperature**: 0.1-0.3 untuk konsistensi, 0.7-0.9 untuk kreativitas
4. **Timeout**: Sesuaikan dengan kompleksitas task

## 🔐 Security Notes

- Jangan commit API key ke repository
- Gunakan `.env` file yang di-ignore git
- Rotasi API key secara berkala
- Monitor usage di OpenRouter dashboard

## 📞 Support

Jika mengalami masalah:

1. Periksa log error di console
2. Cek konfigurasi di `.env` dan `config/config.js`
3. Verifikasi API key di OpenRouter dashboard
4. Test dengan model/parameter yang berbeda
