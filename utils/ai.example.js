// Contoh penggunaan AI utility functions
// File ini hanya untuk dokumentasi dan contoh penggunaan

import {
  generateResponse,
  generateJSON,
  analyzeText,
  generateStatusUpdate,
  summarizeText,
  generateStructuredReport,
  checkAPIHealth,
} from "./ai.js";

// Contoh 1: Generate response sederhana
const exampleGenerateResponse = async () => {
  try {
    const response = await generateResponse(
      "Buatkan ucapan selamat untuk karyawan yang baru dipromosi"
    );
    console.log("Generated Response:", response);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Contoh 2: Generate JSON dengan schema
const exampleGenerateJSON = async () => {
  try {
    const schema = {
      name: "string",
      age: "number",
      skills: ["array of strings"],
      active: "boolean",
    };

    const jsonResponse = await generateJSON(
      "Buatkan profil karyawan IT dengan nama John, umur 28, skill JavaScript dan Python, status aktif",
      schema
    );
    console.log("Generated JSON:", jsonResponse);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Contoh 3: Analisis teks
const exampleAnalyzeText = async () => {
  try {
    const categories = ["complaint", "request", "information", "emergency"];
    const analysis = await analyzeText(
      "Tolong perbaiki AC di ruang meeting, sudah rusak sejak kemarin dan sangat panas",
      categories
    );
    console.log("Text Analysis:", analysis);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Contoh 4: Generate status update
const exampleGenerateStatusUpdate = async () => {
  try {
    const statusUpdate = await generateStatusUpdate(
      "laporan kerusakan plafond di lantai 2, ada bocoran air dari atap",
      "https://example.com/image.jpg"
    );
    console.log("Status Update:", statusUpdate);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Contoh 5: Summarize text
const exampleSummarizeText = async () => {
  try {
    const longText = `
      Pada hari Senin tanggal 15 Januari 2024, terjadi kerusakan sistem AC di gedung kantor pusat.
      Kerusakan dimulai dari lantai 3 ruang meeting A, kemudian menyebar ke ruang-ruang lainnya.
      Tim maintenance telah dihubungi dan akan melakukan perbaikan pada hari Selasa.
      Sementara itu, karyawan disarankan untuk menggunakan ruang meeting di lantai 1 dan 2.
      Estimasi perbaikan memakan waktu 2-3 hari kerja tergantung ketersediaan spare part.
    `;

    const summary = await summarizeText(longText, 50);
    console.log("Summary:", summary);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Contoh 6: Generate structured report
const exampleGenerateStructuredReport = async () => {
  try {
    const unstructuredText =
      "kemarin sore sekitar jam 4 ada kebocoran pipa di toilet lantai 2, airnya sampai ke koridor, perlu diperbaiki segera karena licin dan berbahaya";

    const structuredReport = await generateStructuredReport(unstructuredText);
    console.log("Structured Report:", structuredReport);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Contoh 7: Check API health
const exampleCheckAPIHealth = async () => {
  try {
    const isHealthy = await checkAPIHealth();
    console.log("API Health:", isHealthy ? "✅ Healthy" : "❌ Not accessible");
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Export contoh-contoh untuk testing
export {
  exampleGenerateResponse,
  exampleGenerateJSON,
  exampleAnalyzeText,
  exampleGenerateStatusUpdate,
  exampleSummarizeText,
  exampleGenerateStructuredReport,
  exampleCheckAPIHealth,
};

// Uncomment untuk menjalankan contoh
// exampleGenerateResponse();
// exampleGenerateJSON();
// exampleAnalyzeText();
// exampleGenerateStatusUpdate();
// exampleSummarizeText();
// exampleGenerateStructuredReport();
// exampleCheckAPIHealth();
