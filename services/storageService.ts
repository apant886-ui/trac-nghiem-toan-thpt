import { SavedExam } from "../types";

const KEY = 'math_app_exam_bank_v1';

export const getSavedExams = (): SavedExam[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load exams", e);
    return [];
  }
};

export const saveExam = (exam: SavedExam): void => {
  try {
    const current = getSavedExams();
    // Check if exists, update
    const index = current.findIndex(e => e.id === exam.id);
    if (index >= 0) {
      current[index] = exam;
    } else {
      current.unshift(exam); // Add to top
    }
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save exam", e);
    alert("Bộ nhớ trình duyệt đã đầy, không thể lưu thêm.");
  }
};

export const deleteExam = (id: string): void => {
  try {
    const current = getSavedExams();
    const filtered = current.filter(e => e.id !== id);
    localStorage.setItem(KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete exam", e);
  }
};

// NEW: Export single exam to JSON file
export const exportExamToJson = (exam: SavedExam) => {
    const jsonString = JSON.stringify(exam, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `MathPro_Exam_${exam.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// NEW: Import exam from JSON file
export const importExamFromJson = (file: File): Promise<SavedExam> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                // Basic validation
                if (!json.id || !json.questions || !Array.isArray(json.questions)) {
                    throw new Error("File không đúng định dạng đề thi Math Pro.");
                }
                // Ensure ID is unique if needed, or keep original to update
                // Here we keep original ID to allow overwriting/updating imports
                resolve(json as SavedExam);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Lỗi đọc file"));
        reader.readAsText(file);
    });
};