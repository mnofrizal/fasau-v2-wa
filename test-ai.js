#!/usr/bin/env node

import {
  generateResponse,
  generateJSON,
  analyzeText,
  generateStatusUpdate,
  summarizeText,
  generateStructuredReport,
  checkAPIHealth,
} from "./utils/ai.js";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const separator = () => {
  console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}`);
};

// Test functions
const testAPIHealth = async () => {
  log("blue", "🔍 Testing API Health...");
  try {
    const isHealthy = await checkAPIHealth();
    if (isHealthy) {
      log("green", "✅ API is healthy and accessible");
    } else {
      log("red", "❌ API is not accessible or not configured");
    }
    return isHealthy;
  } catch (error) {
    log("red", `❌ API Health Check Error: ${error.message}`);
    return false;
  }
};

const testGenerateResponse = async () => {
  log("blue", "🤖 Testing Generate Response...");
  try {
    const response = await generateResponse(
      "Buatkan ucapan selamat untuk karyawan yang baru dipromosi menjadi manager"
    );
    log("green", "✅ Response generated successfully:");
    console.log(`${colors.yellow}${response}${colors.reset}`);
  } catch (error) {
    log("red", `❌ Generate Response Error: ${error.message}`);
  }
};

const testGenerateJSON = async () => {
  log("blue", "📋 Testing Generate JSON...");
  try {
    const schema = {
      name: "string",
      position: "string",
      department: "string",
      skills: ["array of strings"],
      experience_years: "number",
      active: "boolean",
    };

    const jsonResponse = await generateJSON(
      "Buatkan profil karyawan IT dengan nama Budi Santoso, posisi Senior Developer, departemen Technology, skill JavaScript, Python, dan React, pengalaman 5 tahun, status aktif",
      schema
    );
    log("green", "✅ JSON generated successfully:");
    console.log(
      `${colors.yellow}${JSON.stringify(jsonResponse, null, 2)}${colors.reset}`
    );
  } catch (error) {
    log("red", `❌ Generate JSON Error: ${error.message}`);
  }
};

const testAnalyzeText = async () => {
  log("blue", "🔍 Testing Analyze Text...");
  try {
    const categories = [
      "complaint",
      "request",
      "information",
      "emergency",
      "maintenance",
    ];
    const analysis = await analyzeText(
      "Tolong segera perbaiki AC di ruang meeting lantai 3, sudah rusak sejak kemarin dan sangat panas, meeting penting besok pagi",
      categories
    );
    log("green", "✅ Text analysis completed:");
    console.log(
      `${colors.yellow}${JSON.stringify(analysis, null, 2)}${colors.reset}`
    );
  } catch (error) {
    log("red", `❌ Analyze Text Error: ${error.message}`);
  }
};

const testGenerateStatusUpdate = async () => {
  log("blue", "📢 Testing Generate Status Update...");
  try {
    const statusUpdate = await generateStatusUpdate(
      "laporan kerusakan plafond di ruang meeting lantai 2, ada bocoran air dari atap yang menyebabkan plafond basah dan menetes",
      "https://example.com/damage-photo.jpg"
    );
    log("green", "✅ Status update generated:");
    console.log(`${colors.yellow}${statusUpdate}${colors.reset}`);
  } catch (error) {
    log("red", `❌ Generate Status Update Error: ${error.message}`);
  }
};

const testSummarizeText = async () => {
  log("blue", "📝 Testing Summarize Text...");
  try {
    const longText = `
      Pada hari Senin tanggal 15 Januari 2024, terjadi kerusakan sistem AC di gedung kantor pusat.
      Kerusakan dimulai dari lantai 3 ruang meeting A pada pukul 09:00 WIB, kemudian menyebar ke ruang-ruang lainnya di lantai yang sama.
      Tim maintenance telah dihubungi pada pukul 09:30 dan tiba di lokasi pada pukul 10:15.
      Setelah dilakukan pemeriksaan, ditemukan bahwa kerusakan disebabkan oleh kompressor utama yang mengalami overheat.
      Tim maintenance akan melakukan perbaikan pada hari Selasa dimulai pukul 08:00 WIB.
      Sementara itu, karyawan disarankan untuk menggunakan ruang meeting di lantai 1 dan 2 sebagai alternatif.
      Estimasi perbaikan memakan waktu 2-3 hari kerja tergantung ketersediaan spare part kompressor.
      Manajemen akan memberikan update progress perbaikan setiap hari melalui email internal.
    `;

    const summary = await summarizeText(longText.trim(), 80);
    log("green", "✅ Text summarized:");
    console.log(`${colors.yellow}${summary}${colors.reset}`);
  } catch (error) {
    log("red", `❌ Summarize Text Error: ${error.message}`);
  }
};

const testGenerateStructuredReport = async () => {
  log("blue", "📊 Testing Generate Structured Report...");
  try {
    const unstructuredText =
      "kemarin sore sekitar jam 4 ada kebocoran pipa air di toilet lantai 2 sebelah ruang HR, airnya sampai ke koridor dan bikin licin, perlu diperbaiki segera karena berbahaya buat karyawan yang lewat";

    const structuredReport = await generateStructuredReport(unstructuredText);
    log("green", "✅ Structured report generated:");
    console.log(
      `${colors.yellow}${JSON.stringify(structuredReport, null, 2)}${
        colors.reset
      }`
    );
  } catch (error) {
    log("red", `❌ Generate Structured Report Error: ${error.message}`);
  }
};

// Main test runner
const runAllTests = async () => {
  log("bright", "🚀 Starting AI Functions Test Suite");
  separator();

  // Check if API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    log(
      "red",
      "⚠️  WARNING: OPENROUTER_API_KEY is not set in environment variables"
    );
    log(
      "yellow",
      "   Please set your OpenRouter API key in .env file to run tests"
    );
    log("yellow", "   Example: OPENROUTER_API_KEY=your_api_key_here");
    separator();
    return;
  }

  // Test API health first
  const isHealthy = await testAPIHealth();
  separator();

  if (!isHealthy) {
    log("red", "❌ API is not accessible. Please check your configuration.");
    return;
  }

  // Run all tests
  const tests = [
    { name: "Generate Response", fn: testGenerateResponse },
    { name: "Generate JSON", fn: testGenerateJSON },
    { name: "Analyze Text", fn: testAnalyzeText },
    { name: "Generate Status Update", fn: testGenerateStatusUpdate },
    { name: "Summarize Text", fn: testSummarizeText },
    { name: "Generate Structured Report", fn: testGenerateStructuredReport },
  ];

  for (const test of tests) {
    try {
      await test.fn();
    } catch (error) {
      log("red", `❌ Test "${test.name}" failed: ${error.message}`);
    }
    separator();
  }

  log("bright", "🎉 Test Suite Completed!");
};

// Run specific test based on command line argument
const runSpecificTest = async (testName) => {
  const tests = {
    health: testAPIHealth,
    response: testGenerateResponse,
    json: testGenerateJSON,
    analyze: testAnalyzeText,
    status: testGenerateStatusUpdate,
    summarize: testSummarizeText,
    report: testGenerateStructuredReport,
  };

  if (tests[testName]) {
    log("bright", `🚀 Running specific test: ${testName}`);
    separator();
    await tests[testName]();
    separator();
  } else {
    log("red", `❌ Unknown test: ${testName}`);
    log(
      "yellow",
      "Available tests: health, response, json, analyze, status, summarize, report"
    );
  }
};

// Command line interface
const args = process.argv.slice(2);
if (args.length > 0) {
  runSpecificTest(args[0]);
} else {
  runAllTests();
}
