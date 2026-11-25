import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  evaluateProfanity,
  normalizeForProfanityCheck,
} from "@/lib/profanity-filter";
import {
  generateEditToken,
  hashEditToken,
  sanitizePlainText,
  verifyEditToken,
} from "@/lib/security";
import { resetRateLimiterForTests } from "@/lib/rate-limit";
import { resetWishesStoreForTests } from "@/lib/wishes-store";
import { GET as getWishes, POST as postWish } from "@/app/api/wishes/route";
import { PATCH as patchWish } from "@/app/api/wishes/[id]/route";
import { POST as postPresign } from "@/app/api/uploads/presign/route";
import { GET as getCalendar } from "@/app/api/calendar/route";
import { GET as getAdmin, POST as postAdmin } from "@/app/api/admin/route";
import { GET as getSettings } from "@/app/api/settings/route";

describe("Bagian 2 & 4: Backend, Profanity Filter ID/Aceh, REST API & Security QA", () => {
  beforeEach(() => {
    resetRateLimiterForTests();
    resetWishesStoreForTests();
  });

  describe("1. Profanity Filter Bahasa Indonesia & Bahasa Aceh (Termasuk Kosakata Tambahan)", () => {
    it("mendeteksi seluruh kata kasar Bahasa Aceh baru: buy, capok, puko, pukoe lempap, bajeng, dan ek boh", () => {
      const cases = [
        { input: "dasar buy kah", expectedWord: "buy" },
        { input: "muka capok that", expectedWord: "capok" },
        { input: "aneuk puko", expectedWord: "puko" },
        { input: "dasar pukoe lempap", expectedWord: "pukoe lempap" },
        { input: "aneuk bajeng", expectedWord: "bajeng" },
        { input: "cok ek boh", expectedWord: "ek boh" },
        { input: "dasar asee", expectedWord: "asee" },
        { input: "pungo that", expectedWord: "pungo" },
      ];

      for (const c of cases) {
        const res = evaluateProfanity(c.input);
        expect(res.flagged, `Harusnya mendeteksi "${c.input}"`).toBe(true);
        expect(res.matchedWords).toContain(c.expectedWord);
      }
    });

    it("mendeteksi kata kasar meski disamarkan dengan huruf besar, titik/strip, leetspeak, atau perpanjangan huruf", () => {
      expect(evaluateProfanity("B.U.Y").flagged).toBe(true);
      expect(evaluateProfanity("c-a-p-o-k").flagged).toBe(true);
      expect(evaluateProfanity("p.u.k.0").flagged).toBe(true);
      expect(evaluateProfanity("puk03 l3mp4p").matchedWords).toContain(
        "pukoe lempap"
      );
      expect(evaluateProfanity("pukoeee lempaaap").matchedWords).toContain(
        "pukoe lempap"
      );
      expect(evaluateProfanity("b4j3ng").matchedWords).toContain("bajeng");
      expect(evaluateProfanity("3k b0h").matchedWords).toContain("ek boh");
      expect(evaluateProfanity("e-k b-o-h").matchedWords).toContain("ek boh");
      expect(evaluateProfanity("ekboh").matchedWords).toContain("ek boh");
      expect(evaluateProfanity("a.n.j.i.n.g").matchedWords).toContain("anjing");
      expect(evaluateProfanity("b0d0hhh").matchedWords).toContain("bodoh");
    });

    it("tidak memicu false positive pada kalimat doa sopan Bahasa Indonesia dan Bahasa Aceh", () => {
      const politeSentences = [
        "Selamat menempuh hidup baru Cut Sarah dan Teuku Faisal, semoga sakinah mawaddah warahmah.",
        "Saleum teuka, semoga ekonomi keluarga selalu diberkahi Allah dan bahagia sampai anak cucu.",
        "Teurimong geunaseh atas undangan Resepsi Intat Linto Baro di Banda Aceh.",
        "Semoga budaya adat Aceh selalu lestari dan membawa keberkahan.",
      ];

      for (const sentence of politeSentences) {
        const res = evaluateProfanity(sentence);
        expect(res.flagged, `Tidak boleh false positive pada: ${sentence}`).toBe(
          false
        );
        expect(res.matchedWords).toHaveLength(0);
      }
    });

    it("menormalisasi simbol pemisah dan huruf berulang secara akurat", () => {
      expect(normalizeForProfanityCheck("P.U.K.O.E L-E-M-P-A-P")).toBe(
        "pukoe lempap"
      );
      expect(normalizeForProfanityCheck("A.S.E.E.E.E")).toBe("asee");
    });
  });

  describe("2. Sanitasi XSS & Keamanan Edit Token", () => {
    it("membersihkan tag HTML dan script berbahaya dari input teks", () => {
      const dirty =
        '<script>alert("xss")</script>Selamat <b>bahagia</b> <img src=x onerror=alert(1)>selalu!';
      expect(sanitizePlainText(dirty)).toBe(
        'alert("xss")Selamat bahagia selalu!'
      );
    });

    it("menolak senderName yang hanya berisi tag HTML kosong (HTTP 400)", async () => {
      const req = new NextRequest("http://localhost:3000/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: "<script></script><b>   </b>",
          type: "TEXT",
          textContent: "Semoga berkah selalu.",
        }),
      });
      const res = await postWish(req);
      expect(res.status).toBe(400);
    });

    it("memverifikasi editToken dengan SHA-256 timing-safe secara akurat", () => {
      const token = generateEditToken();
      const hash = hashEditToken(token);
      expect(token).toHaveLength(48);
      expect(verifyEditToken(token, hash)).toBe(true);
      expect(verifyEditToken("token-palsu-1234567890", hash)).toBe(false);
    });
  });

  describe("3. Endpoint API /api/wishes, /api/wishes/[id] & Rate Limiting", () => {
    it("menyimpan doa teks sopan dengan status PUBLISHED dan menjaga privasi pada GET /api/wishes", async () => {
      const postReq = new NextRequest("http://localhost:3000/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: "Teuku Iskandar",
          senderRelation: "Kerabat Banda Aceh",
          type: "TEXT",
          textContent:
            "Semoga menjadi keluarga sakinah mawaddah warahmah hingga ke anak cucu.",
        }),
      });

      const postRes = await postWish(postReq);
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      expect(postData.wish.status).toBe("PUBLISHED");
      expect(postData.editToken).toBeDefined();
      expect(postData.wish.editTokenHash).toBeUndefined();

      const publicGetReq = new NextRequest("http://localhost:3000/api/wishes");
      const publicGetRes = await getWishes(publicGetReq);
      const publicGetData = await publicGetRes.json();
      expect(publicGetData.privateMode).toBe(true);
      expect(publicGetData.wishes).toEqual([]);

      const senderGetReq = new NextRequest(
        `http://localhost:3000/api/wishes?wishId=${postData.wish.id}`,
        {
          headers: { "x-edit-token": postData.editToken },
        }
      );
      const senderGetRes = await getWishes(senderGetReq);
      expect(senderGetRes.status).toBe(200);
      const senderGetData = await senderGetRes.json();
      expect(senderGetData.wish.id).toBe(postData.wish.id);
    });

    it("menahan ucapan teks yang mengandung kata kasar Aceh (PENDING_MODERATION) dan mengizinkan edit dengan token sah", async () => {
      const postReq = new NextRequest("http://localhost:3000/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: "Tamu Uji",
          senderRelation: "Teman",
          type: "TEXT",
          textContent: "Ucapan berisi kata pukoe lempap dan ek boh",
        }),
      });

      const postRes = await postWish(postReq);
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      expect(postData.wish.status).toBe("PENDING_MODERATION");

      const wishId = postData.wish.id as string;
      const editToken = postData.editToken as string;

      const badPatchReq = new NextRequest(
        `http://localhost:3000/api/wishes/${wishId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-edit-token": "wrong-token-12345678901234567890",
          },
          body: JSON.stringify({
            senderName: "Tamu Uji",
            type: "TEXT",
            textContent: "Doa sudah diperbaiki menjadi santun.",
          }),
        }
      );
      const badPatchRes = await patchWish(badPatchReq, {
        params: Promise.resolve({ id: wishId }),
      });
      expect(badPatchRes.status).toBe(403);

      const goodPatchReq = new NextRequest(
        `http://localhost:3000/api/wishes/${wishId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-edit-token": editToken,
          },
          body: JSON.stringify({
            senderName: "Tamu Uji Santun",
            senderRelation: "Sahabat",
            type: "TEXT",
            textContent: "Semoga kedua mempelai selalu diberkahi Allah SWT.",
          }),
        }
      );
      const goodPatchRes = await patchWish(goodPatchReq, {
        params: Promise.resolve({ id: wishId }),
      });
      expect(goodPatchRes.status).toBe(200);
      const goodPatchData = await goodPatchRes.json();
      expect(goodPatchData.wish.status).toBe("PUBLISHED");
      expect(goodPatchData.wish.senderName).toBe("Tamu Uji Santun");
    });

    it("memblokir spam dengan HTTP 429 Too Many Requests pada pengiriman ke-11 dari IP yang sama", async () => {
      for (let i = 0; i < 10; i++) {
        const req = new NextRequest("http://localhost:3000/api/wishes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-real-ip": "203.0.113.77",
          },
          body: JSON.stringify({
            senderName: `Tamu ${i}`,
            type: "TEXT",
            textContent: "Doa berkah selalu.",
          }),
        });
        const res = await postWish(req);
        expect(res.status).toBe(201);
      }

      const spamReq = new NextRequest("http://localhost:3000/api/wishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": "203.0.113.77",
        },
        body: JSON.stringify({
          senderName: "Spammer",
          type: "TEXT",
          textContent: "Spam ke-11.",
        }),
      });
      const spamRes = await postWish(spamReq);
      expect(spamRes.status).toBe(429);
      expect(spamRes.headers.get("Retry-After")).toBeDefined();
    });
  });

  describe("4. Endpoint Presign Video & Kalender .ics", () => {
    it("menolak video > 50 MB pada mode Supabase Free atau > 60 detik, dan menerbitkan presigned URL untuk video valid", async () => {
      const overSupabaseFreeReq = new NextRequest(
        "http://localhost:3000/api/uploads/presign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: "besar-55mb.mp4",
            contentType: "video/mp4",
            sizeBytes: 55 * 1024 * 1024,
            durationSec: 30,
          }),
        }
      );
      const overSupabaseFreeRes = await postPresign(overSupabaseFreeReq);
      expect(overSupabaseFreeRes.status).toBe(400);

      const tooLongReq = new NextRequest(
        "http://localhost:3000/api/uploads/presign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: "panjang.mp4",
            contentType: "video/mp4",
            sizeBytes: 10 * 1024 * 1024,
            durationSec: 75,
          }),
        }
      );
      const tooLongRes = await postPresign(tooLongReq);
      expect(tooLongRes.status).toBe(400);

      const validReq = new NextRequest(
        "http://localhost:3000/api/uploads/presign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: "ucapan.webm",
            contentType: "video/webm",
            sizeBytes: 5 * 1024 * 1024,
            durationSec: 25,
          }),
        }
      );
      const validRes = await postPresign(validReq);
      expect(validRes.status).toBe(200);
      const validData = await validRes.json();
      expect(validData.objectKey).toMatch(/^wishes\/videos\//);
      expect(validData.uploadUrl).toBeDefined();
    });

    it("menghasilkan berkas kalender .ics Resepsi Intat Linto Baro yang valid", async () => {
      const calRes = await getCalendar();
      expect(calRes.status).toBe(200);
      expect(calRes.headers.get("Content-Type")).toContain("text/calendar");
      const text = await calRes.text();
      expect(text).toContain("BEGIN:VCALENDAR");
      expect(text).toContain("SUMMARY:Resepsi Intat Linto Baro");
      expect(text).not.toContain("Peusijuek");
    });

    it("melindungi endpoint /api/admin dari akses tanpa token (HTTP 401) dan menyediakan fallback di /api/settings", async () => {
      const unauthGet = new NextRequest("http://localhost:3000/api/admin");
      const getRes = await getAdmin(unauthGet);
      expect(getRes.status).toBe(401);

      const unauthPost = new NextRequest("http://localhost:3000/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_wish",
          wishId: "00000000-0000-0000-0000-000000000001",
        }),
      });
      const postRes = await postAdmin(unauthPost);
      expect(postRes.status).toBe(401);

      const settingsRes = await getSettings();
      expect(settingsRes.status).toBe(200);
    });
  });
});
