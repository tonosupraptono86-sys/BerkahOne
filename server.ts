import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();

  app.use(express.json());

  // Health check endpoint for Cloud Run and uptime checks
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Endpoint AI Features untuk Pembuatan Undangan Jumpa Bulan RT 02
  app.post("/api/gemini/undangan", async (req, res) => {
    try {
      const {
        jenisAcara = "Pertemuan Jumpa Bulan Rutin RT 02",
        tanggal = "Sabtu, 11 Oktober 2026",
        waktu = "19.30 WIB (Ba'da Isya) s/d Selesai",
        tempat = "Balai Warga RT 02 RW 14 Tanjung Sari",
        agendaList = [
          "Laporan Keuangan Kas Besar RT & Iuran Warga Bulan Berjalan",
          "Evaluasi Program Kebersihan Lingkungan & Kerja Bakti",
          "Evaluasi Jadwal Ronda & Keamanan Lingkungan",
          "Arisan Rutin Warga & Jimpitan",
          "Musyawarah / Tanya Jawab & Aspirasi Warga"
        ],
        tone = "resmi_akrab",
        ringkasanKas = {},
        namaKetua = "Drs. Bambang Sudarsono",
        namaSekretaris = "Agus Setiawan, S.T.",
        namaBendahara = "Misbahudin",
        catatanTambahan = ""
      } = req.body;

      const ai = new GoogleGenAI();

      const systemPrompt = `Anda adalah Asisten Sekretaris & Tata Usaha Cerdas BerkahOne untuk Rukun Tetangga (RT 02 RW 14 Tanjung Sari, Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang).
Tugas Anda adalah membuat berkas Undangan Jumpa Bulan (Pertemuan Rutin Warga) yang santun, profesional, jelas, dan memikat partisipasi warga.

Format respon HARUS berupa JSON murni tanpa markdown triple backticks (jangan gunakan \`\`\`json atau \`\`\`), dengan skema persis:
{
  "judulUndangan": "string (Judul undangan)",
  "pesanWhatsApp": "string (Teks format WhatsApp lengkap dengan emoji, asteris tebal, rincian acara, agenda terstruktur, dan salam)",
  "suratResmiText": "string (Teks surat dinas resmi RT lengkap kop, nomor surat, perihal, isi, dan tanda tangan pengurus)",
  "drafSambutanKetua": "string (Naskah draf sambutan pembuka Ketua RT/Pengurus saat acara)",
  "pesanPengingatH1": "string (Pesan pengingat singkat H-1 untuk grup WhatsApp)",
  "tipsPertemuan": ["string", "string", "string"]
}`;

      const userPrompt = `Buatkan draf Undangan Jumpa Bulan dengan rincian berikut:
- Jenis Acara: ${jenisAcara}
- Hari & Tanggal: ${tanggal}
- Waktu: ${waktu}
- Tempat Pertemuan: ${tempat}
- Nada Bahasa (Tone): ${
        tone === 'formal_kedinasan'
          ? 'Resmi Kedinasan Formal'
          : tone === 'santai_kekeluargaan'
          ? 'Santai Hangat Penuh Kekeluargaan'
          : tone === 'singkat_padat'
          ? 'Singkat, Padat, Langsung ke Poin Penting'
          : 'Resmi Santun & Akrab Kekeluargaan (Direkomendasikan)'
      }
- Agenda Utama:
${agendaList.map((a: string, i: number) => `  ${i + 1}. ${a}`).join('\n')}
- Konteks Keuangan Kas RT:
  * Saldo Kas Besar Saat Ini: ${ringkasanKas.saldoKasBesar ? 'Rp ' + Number(ringkasanKas.saldoKasBesar).toLocaleString('id-ID') : 'Transparan & Terkelola'}
  * Kas Kecil Iuran Warga: ${ringkasanKas.saldoKasKecil ? 'Rp ' + Number(ringkasanKas.saldoKasKecil).toLocaleString('id-ID') : 'Tercatat'}
  * Kas BOP Kelurahan: ${ringkasanKas.saldoBOP ? 'Rp ' + Number(ringkasanKas.saldoBOP).toLocaleString('id-ID') : 'Tercatat'}
  * Bulan Berjalan: ${ringkasanKas.bulan || 'Oktober 2026'}
- Pengurus Penyelenggara:
  * Ketua RT 02: ${namaKetua}
  * Sekretaris RT 02: ${namaSekretaris}
  * Bendahara RT 02: ${namaBendahara}
- Catatan Tambahan Pengurus: ${catatanTambahan || 'Membawa uang jimpitan dan hadir tepat waktu.'}

Hasilkan JSON valid sesuai instruksi.`;

      let responseText = "{}";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });
        responseText = response.text || "{}";
      } catch (firstErr: any) {
        console.warn("Retrying with gemini-3.1-flash-lite due to:", firstErr.message);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
              { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          responseText = response.text || "{}";
        } catch (secondErr: any) {
          console.warn("Using smart template fallback due to:", secondErr.message);
          // Return reliable structured fallback
          responseText = JSON.stringify({
            judulUndangan: `Undangan Resmi ${jenisAcara}`,
            pesanWhatsApp: `🏛️ *UNDANGAN JUMPA BULAN & MUSYAWARAH RT 02 RW 14*\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nYth. Bapak/Ibu/Saudara Warga RT 02 RW 14 di Tempat,\n\n_Assalamu'alaikum Warahmatullahi Wabarakatuh,_\nSalam guyub rukun untuk seluruh warga.\n\nMengharap dengan hormat kehadiran Bapak/Ibu dalam acara *${jenisAcara}*:\n\n📅 *Hari / Tanggal* : *${tanggal}*\n⏰ *Waktu*           : *${waktu}*\n📍 *Tempat*          : *${tempat}*\n\n📋 *SUSUNAN AGENDA:*\n${agendaList.map((a: string, i: number) => `• ${a}`).join('\n')}\n\n💰 *KILAS KAS RT 02 (TRANSPARAN):*\n• Saldo Kas Besar: ${ringkasanKas.saldoKasBesar ? 'Rp ' + Number(ringkasanKas.saldoKasBesar).toLocaleString('id-ID') : 'Tercatat Transparan'}\n• Kas Kecil Iuran Warga: ${ringkasanKas.saldoKasKecil ? 'Rp ' + Number(ringkasanKas.saldoKasKecil).toLocaleString('id-ID') : 'Tercatat'}\n\n📝 *Catatan Pengurus:* ${catatanTambahan || 'Membawa jimpitan dan hadir tepat waktu.'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nHormat kami,\n*PENGURUS RT 02 RW 14*\nKetua RT: *${namaKetua}* | Bendahara: *${namaBendahara}*`,
            suratResmiText: `PEMERINTAH KOTA SEMARANG\nKECAMATAN PEDURUNGAN - KELURAHAN PEDURUNGAN TENGAH\nRUKUN TETANGGA 02 RW 14 TANJUNG SARI\n\nNomor    : 045/UND/RT02-RW14/X/2026\nPerihal  : Undangan ${jenisAcara}\n\nKepada Yth. Bapak/Ibu Warga RT 02 RW 14 di Tempat\n\nDengan hormat,\nBersama ini kami mengundang Bapak/Ibu untuk hadir pada:\nHari/Tanggal : ${tanggal}\nWaktu        : ${waktu}\nTempat       : ${tempat}\nAcara        : ${jenisAcara}\n\nAgenda:\n${agendaList.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}\n\nCatatan: ${catatanTambahan || 'Diharapkan hadir tepat waktu.'}\n\nSemarang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\nPengurus RT 02 RW 14 Tanjung Sari\n\nKetua RT 02,                            Sekretaris,\n${namaKetua}             ${namaSekretaris}`,
            drafSambutanKetua: `Assalamu'alaikum Warahmatullahi Wabarakatuh, salam sejahtera untuk kita semua.\nBapak dan Ibu warga RT 02 yang saya hormati, puji syukur malam ini kita dapat berkumpul dalam acara Jumpa Bulan RT 02.\nMalam ini kita sampaikan laporan pertanggungjawaban kas RT secara transparan, mengevaluasi kebersihan lingkungan, keamanan ronda, dan menampung aspirasi warga...`,
            pesanPengingatH1: `🔔 *PENGINGAT (H-1) JUMPA BULAN RT 02*\nMengingatkan besok malam (${tanggal} pukul ${waktu}) bertempat di ${tempat}. Mohon berkenan hadir tepat waktu. Terima kasih!`,
            tipsPertemuan: [
              "Sediakan lembar absensi kehadiran dan kotak jimpitan di meja masuk.",
              "Tampilkan rincian Laporan Buku Kas Besar RT secara transparan.",
              "Buka sesi tanya jawab terbuka untuk menampung ide dan aspirasi warga."
            ]
          });
        }
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json\n?|\n?```/g, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Error generating Undangan Jumpa Bulan via Gemini:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal menghasilkan naskah undangan dengan AI."
      });
    }
  });

  // Environment detection:
  // - In development mode (AI Studio dev sandbox): tsx server.ts runs with port 3000
  // - In Cloud Run production deployment: process.env.PORT or K_SERVICE is set, or NODE_ENV=production
  const portArgIndex = process.argv.indexOf("--port");
  const portFromArg = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : undefined;
  const portEnv = process.env.PORT || portFromArg;

  const isCloudRun = Boolean(process.env.K_SERVICE);
  const isProduction =
    process.env.NODE_ENV === "production" ||
    isCloudRun ||
    (Boolean(process.env.PORT) && process.env.PORT !== "3000");

  const isDev = !isProduction;

  // Vite middleware for development vs static serve for production
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<!doctype html><html><head><title>BerkahOne</title></head><body><div id='root'></div></body></html>");
      }
    });
  }

  // Network Port configuration:
  // - In development mode (AI Studio dev sandbox), the dev server must bind to port 3000.
  // - In production / Cloud Run deployment, the container must bind to process.env.PORT (default 8080).
  const PORT = portEnv ? parseInt(portEnv, 10) : (isDev ? 3000 : 8080);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isDev ? "development" : "production"})`);
  });

  server.on("error", (err: any) => {
    console.error("Server listen error:", err);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

