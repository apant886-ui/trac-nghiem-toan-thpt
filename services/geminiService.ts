import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { AppConfig, Difficulty, Question, QuestionType } from "../types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDifficulty = (d: Difficulty): string => {
  switch (d) {
    case Difficulty.RECOGNITION: return "Mức độ Nhận biết (Dễ)";
    case Difficulty.UNDERSTANDING: return "Mức độ Thông hiểu (Trung bình)";
    case Difficulty.APPLICATION: return "Mức độ Vận dụng (Khá)";
    case Difficulty.ADVANCED_APPLICATION: return "Mức độ Vận dụng cao (Khó - Tư duy tổng hợp)";
    case Difficulty.MIXED: return "Hỗn hợp các mức độ từ Nhận biết đến Vận dụng cao";
    default: return "Trung bình";
  }
};

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey });
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper function
async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.status || error?.response?.status || error?.code;
    const msg = error?.message || "";
    
    // Check for 429 (Resource Exhausted/Rate Limit) or 503 (Service Unavailable)
    if ((status === 429 || msg.includes("429") || status === 503) && retries > 0) {
      console.warn(`API Request failed with ${status}. Retrying in ${backoff}ms...`);
      await delay(backoff);
      return withRetry(fn, retries - 1, backoff * 2);
    }
    
    if (status === 429 || msg.includes("429") || msg.includes("quota")) {
        throw new Error("Hệ thống AI đang quá tải (429). Vui lòng đợi khoảng 1 phút rồi thử lại.");
    }
    
    throw error;
  }
}

// Helper to clean JSON text from Markdown code blocks
const cleanJsonText = (text: string): string => {
  if (!text) return "";
  let cleaned = text.trim();
  // Remove markdown code blocks if present
  // This regex matches the starting ```json or ``` and the ending ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return cleaned;
};

// NEW: Fetch topics based on Grade and Lesson
export const getLessonTopics = async (grade: string, lesson: string): Promise<string[]> => {
  const ai = getClient();
  
  const prompt = `
    Tôi là giáo viên Toán đang dạy bộ sách "Kết nối tri thức với cuộc sống".
    Lớp: ${grade}.
    Bài học: ${lesson}.
    
    Hãy liệt kê 4-6 dạng toán hoặc chủ đề kiến thức trọng tâm nhất của bài học này để tôi soạn đề kiểm tra.
    Chỉ trả về danh sách tên chủ đề, ngắn gọn, súc tích.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  };

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      }
    }));

    const rawData = response.text;
    if (!rawData) return [];
    
    try {
        return JSON.parse(cleanJsonText(rawData));
    } catch (e) {
        console.error("Failed to parse topics JSON:", e);
        return [];
    }
  } catch (error) {
    console.error("Error fetching topics:", error);
    return ["Lý thuyết chung", "Bài tập tính toán", "Bài tập vận dụng"]; // Fallback
  }
};

// NEW: Generate Theory Summary for Review Document
export const generateTheorySummary = async (grade: string, lesson: string): Promise<string> => {
    const ai = getClient();
    const prompt = `
        Tóm tắt lý thuyết trọng tâm cho bài học: "${lesson}" (Toán lớp ${grade} - Sách Kết nối tri thức).
        
        Yêu cầu định dạng:
        1. Trình bày ngắn gọn, súc tích dưới dạng HTML đơn giản (sử dụng <h3>, <ul>, <li>, <b>).
        2. CÁC CÔNG THỨC TOÁN HỌC PHẢI DÙNG THẺ <math> CHỨA LATEX.
        3. QUAN TRỌNG: Latex phải dùng DOUBLE BACKSLASH (\\\\) để escape. Ví dụ: <math>y = x^{2} + \\\\frac{1}{2}</math>.
        4. Tập trung vào công thức, định nghĩa và tính chất quan trọng nhất để học sinh ôn tập.
        5. Không bao gồm phần bài tập ví dụ.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        }));
        return response.text || "Không thể tạo tóm tắt lý thuyết.";
    } catch (e) {
        console.error("Theory generation error", e);
        return "";
    }
}

// SHARED SYSTEM INSTRUCTION
const SYSTEM_INSTRUCTION = `
    Bạn là một chuyên gia sư phạm Toán học, chuyên soạn đề theo bộ sách giáo khoa "Kết nối tri thức với cuộc sống" (Việt Nam).
    
    QUY TẮC ĐỊNH DẠNG (BẮT BUỘC TUÂN THỦ):
    1. Trả về định dạng JSON thuần túy. KHÔNG trả về markdown code blocks (như \`\`\`json).
    2. Cú pháp Toán học (QUAN TRỌNG: ESCAPE BACKSLASH):
       - Mọi công thức toán, biến số (x, y...), số mũ, căn thức, phân số phải viết bằng mã LaTeX bên trong thẻ <math>...</math>.
       - VÌ ĐÂY LÀ JSON, BẠN PHẢI DÙNG HAI DẤU GẠCH CHÉO NGƯỢC (DOUBLE BACKSLASH) CHO CÁC LỆNH LATEX.
       - Sai: "\\frac{1}{2}" (JSON hiểu là ký tự Form Feed).
       - Đúng: "\\\\frac{1}{2}" (JSON hiểu là chuỗi "\\frac{1}{2}").
       - Tương tự: "\\\\sqrt", "\\\\alpha", "\\\\beta", "\\\\infty"...
       - Ví dụ: "Tính <math>A = 2^{3} + \\\\frac{1}{2}</math>"
    3. Nội dung:
       - Bám sát chương trình sách giáo khoa "Kết nối tri thức".
       - Số liệu "đẹp", dễ tính toán.
  `;

// SHARED RESPONSE SCHEMA
const RESPONSE_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "Nội dung câu hỏi với LaTeX trong thẻ <math>" },
        type: { type: Type.STRING, enum: [QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.SHORT_ANSWER, QuestionType.ESSAY] },
        difficulty: { type: Type.STRING, description: "Mức độ khó của câu hỏi: Nhận biết, Thông hiểu, Vận dụng, hoặc Vận dụng cao" },
        options: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              content: { type: Type.STRING, description: "Nội dung đáp án với LaTeX trong thẻ <math>" }
            }
          }
        },
        correctOptionId: { type: Type.STRING },
        shortAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING, description: "Lời giải chi tiết với LaTeX trong thẻ <math>" }
      },
      required: ["content", "type", "explanation", "difficulty"]
    }
  };

export const generateQuestions = async (config: AppConfig): Promise<Question[]> => {
  const ai = getClient();

  const prompt = `
    Hãy tạo ${config.quantity} câu hỏi Toán Lớp ${config.grade}.
    Bài học: ${config.lesson}.
    Tập trung vào các chủ đề kiến thức sau: ${config.topics.join(', ')}.
    Độ khó tổng thể: ${formatDifficulty(config.difficulty)}.
    Loại câu hỏi ưu tiên: ${config.questionTypes.join(', ')}.

    Yêu cầu chi tiết:
    1. Xác định mức độ khó cụ thể cho từng câu hỏi (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) và trả về trong trường "difficulty".
    2. Nếu là Trắc nghiệm (MCQ): Cần 4 đáp án (A, B, C, D).
    3. Nếu là Đúng/Sai: 2 đáp án.
    
    Hãy đảm bảo trường "content" chứa câu hỏi, "options" chứa các lựa chọn (nếu có), "correctOptionId" là id của đáp án đúng, và "explanation" là lời giải chi tiết (cũng áp dụng quy tắc thẻ <math> chứa LaTeX với double backslash).
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
      }
    }));

    return parseResponse(response.text);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Không thể tạo câu hỏi. Vui lòng thử lại.");
  }
};

// NEW: Generate questions from image
export const generateQuestionsFromImage = async (base64Image: string, quantity: number): Promise<Question[]> => {
    const ai = getClient();

    const prompt = `
        1. Phân tích nội dung Toán học trong bức ảnh này (đề bài, công thức, dạng toán).
        2. Tạo ra ${quantity} câu hỏi TƯƠNG TỰ về dạng toán và độ khó như trong ảnh (Remix đề bài). Thay đổi số liệu để tạo bài tập mới.
        3. Xác định mức độ khó (Nhận biết/Thông hiểu/Vận dụng/Vận dụng cao) cho từng câu.
        4. Định dạng đầu ra JSON tuân thủ chính xác schema và quy tắc LaTeX (double backslash).
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Strong model for multimodal
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
                temperature: 0.6,
            }
        }));

        return parseResponse(response.text);
    } catch (error: any) {
        console.error("Gemini Image API Error:", error);
        throw new Error(error.message || "Không thể xử lý ảnh. Vui lòng thử lại với ảnh rõ nét hơn.");
    }
}

// Helper to parse and hydrate IDs
const parseResponse = (text?: string): Question[] => {
    if (!text) throw new Error("No data returned from AI");
    
    try {
        // Clean markdown if present
        const cleanedText = cleanJsonText(text);
        
        const parsedQuestions = JSON.parse(cleanedText);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return parsedQuestions.map((q: any) => ({
            ...q,
            id: generateId(),
            options: q.options ? q.options.map((opt: any) => ({ ...opt, id: opt.id || generateId() })) : []
        }));
    } catch (e) {
        console.error("JSON Parse Error. Raw Text:", text);
        throw new Error("Lỗi định dạng dữ liệu từ AI.");
    }
}
