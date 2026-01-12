import React, { useState, useEffect, useRef } from 'react';
import { generateQuestions, getLessonTopics, generateQuestionsFromImage } from './services/geminiService';
import { getSavedExams, deleteExam, saveExam, exportExamToJson, importExamFromJson } from './services/storageService';
import { Question, AppConfig, Difficulty, QuestionType, Curriculum, SavedExam, AppMode } from './types';
import PresentationView from './components/PresentationView';
import ExportView from './components/ExportView';
import SimulationView from './components/SimulationView';
import { BookOpen, Presentation, FileText, Loader2, Sparkles, Check, School, BookMarked, RefreshCw, Cpu, Zap, Image as ImageIcon, Upload, Archive, Trash2, ChevronRight, X, Download, FileUp, PlayCircle } from 'lucide-react';

enum InputMethod {
    MANUAL = 'MANUAL',
    IMAGE = 'IMAGE'
}

// Data mẫu cho bộ sách "Kết nối tri thức" - Cập nhật đầy đủ
const KNTT_CURRICULUM: Curriculum = {
  "10": [
    // Tập 1
    "Bài 1. Mệnh đề",
    "Bài 2. Tập hợp",
    "Bài 3. Bất phương trình bậc nhất hai ẩn",
    "Bài 4. Hệ bất phương trình bậc nhất hai ẩn",
    "Bài 5. Giá trị lượng giác của một góc từ 0 đến 180 độ",
    "Bài 6. Hệ thức lượng trong tam giác",
    "Bài 7. Các khái niệm mở đầu (Vectơ)",
    "Bài 8. Tổng và hiệu của hai vectơ",
    "Bài 9. Tích của một số với một vectơ",
    "Bài 10. Vectơ trong mặt phẳng tọa độ",
    "Bài 11. Tích vô hướng của hai vectơ",
    "Bài 12. Số gần đúng và sai số",
    "Bài 13. Các số đặc trưng đo xu thế trung tâm",
    "Bài 14. Các số đặc trưng đo độ phân tán",
    // Tập 2
    "Bài 15. Hàm số",
    "Bài 16. Hàm số bậc hai",
    "Bài 17. Dấu của tam thức bậc hai",
    "Bài 18. Phương trình quy về phương trình bậc hai",
    "Bài 19. Phương pháp tọa độ trong mặt phẳng",
    "Bài 20. Vị trí tương đối giữa hai đường thẳng. Góc và khoảng cách",
    "Bài 21. Đường tròn trong mặt phẳng tọa độ",
    "Bài 22. Ba đường conic",
    "Bài 23. Quy tắc đếm",
    "Bài 24. Hoán vị, chỉnh hợp và tổ hợp",
    "Bài 25. Nhị thức Newton",
    "Bài 26. Biến cố và định nghĩa cổ điển của xác suất",
    "Bài 27. Thực hành tính xác suất theo định nghĩa cổ điển"
  ],
  "11": [
    // Tập 1
    "Bài 1. Giá trị lượng giác của góc lượng giác",
    "Bài 2. Công thức lượng giác",
    "Bài 3. Hàm số lượng giác",
    "Bài 4. Phương trình lượng giác cơ bản",
    "Bài 5. Dãy số",
    "Bài 6. Cấp số cộng",
    "Bài 7. Cấp số nhân",
    "Bài 8. Mẫu số liệu ghép nhóm",
    "Bài 9. Các số đặc trưng đo xu thế trung tâm",
    "Bài 10. Đường thẳng và mặt phẳng trong không gian",
    "Bài 11. Hai đường thẳng song song",
    "Bài 12. Đường thẳng và mặt phẳng song song",
    "Bài 13. Hai mặt phẳng song song",
    "Bài 14. Phép chiếu song song",
    "Bài 15. Giới hạn của dãy số",
    "Bài 16. Giới hạn của hàm số",
    "Bài 17. Hàm số liên tục",
    // Tập 2
    "Bài 18. Lũy thừa với số mũ thực",
    "Bài 19. Logarit",
    "Bài 20. Hàm số mũ và hàm số logarit",
    "Bài 21. Phương trình, bất phương trình mũ và logarit",
    "Bài 22. Hai đường thẳng vuông góc",
    "Bài 23. Đường thẳng vuông góc với mặt phẳng",
    "Bài 24. Phép chiếu vuông góc. Góc giữa đường thẳng và mặt phẳng",
    "Bài 25. Hai mặt phẳng vuông góc",
    "Bài 26. Khoảng cách",
    "Bài 27. Thể tích",
    "Bài 28. Biến cố hợp, biến cố giao, biến cố độc lập",
    "Bài 29. Công thức cộng xác suất",
    "Bài 30. Công thức nhân xác suất",
    "Bài 31. Định nghĩa và ý nghĩa của đạo hàm",
    "Bài 32. Các quy tắc tính đạo hàm",
    "Bài 33. Đạo hàm cấp hai"
  ],
  "12": [
    // Tập 1
    "Bài 1. Tính đơn điệu và cực trị của hàm số",
    "Bài 2. Giá trị lớn nhất và giá trị nhỏ nhất của hàm số",
    "Bài 3. Đường tiệm cận của đồ thị hàm số",
    "Bài 4. Khảo sát sự biến thiên và vẽ đồ thị của hàm số",
    "Bài 5. Ứng dụng đạo hàm để giải quyết một số vấn đề liên quan đến thực tiễn",
    "Bài 6. Vectơ trong không gian",
    "Bài 7. Hệ trục tọa độ trong không gian",
    "Bài 8. Biểu thức tọa độ của các phép toán vectơ",
    "Bài 9. Khoảng biến thiên và khoảng tứ phân vị của mẫu số liệu ghép nhóm",
    "Bài 10. Phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm",
    // Tập 2
    "Bài 11. Nguyên hàm",
    "Bài 12. Tích phân",
    "Bài 13. Ứng dụng hình học của tích phân",
    "Bài 14. Phương trình mặt phẳng",
    "Bài 15. Phương trình đường thẳng trong không gian",
    "Bài 16. Công thức tính góc trong không gian",
    "Bài 17. Phương trình mặt cầu",
    "Bài 18. Xác suất có điều kiện",
    "Bài 19. Công thức xác suất toàn phần và công thức Bayes"
  ]
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [inputMethod, setInputMethod] = useState<InputMethod>(InputMethod.MANUAL);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Exam Bank
  const [showBank, setShowBank] = useState(false);
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Dynamic Topics from AI
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const [config, setConfig] = useState<AppConfig>({
    grade: "11",
    lesson: KNTT_CURRICULUM["11"][0], // Use first lesson of grade 11 as default
    topics: [],
    difficulty: Difficulty.UNDERSTANDING,
    questionTypes: [QuestionType.MCQ],
    quantity: 10,
    model: 'gemini-3-flash-preview'
  });

  const analyzeLesson = async (currentGrade: string, currentLesson: string) => {
    setIsAnalysing(true);
    setAvailableTopics([]);
    setConfig(prev => ({...prev, topics: []}));
    try {
      const topics = await getLessonTopics(currentGrade, currentLesson);
      setAvailableTopics(topics);
      setConfig(prev => ({...prev, topics: topics}));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalysing(false);
    }
  };

  useEffect(() => {
    // Only analyze if manual mode and lesson is set
    if (inputMethod === InputMethod.MANUAL) {
        analyzeLesson(config.grade, config.lesson);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGradeChange = (newGrade: string) => {
    const defaultLesson = KNTT_CURRICULUM[newGrade][0];
    setConfig(prev => ({ ...prev, grade: newGrade, lesson: defaultLesson }));
    analyzeLesson(newGrade, defaultLesson);
  };

  const handleLessonChange = (newLesson: string) => {
    setConfig(prev => ({ ...prev, lesson: newLesson }));
    analyzeLesson(config.grade, newLesson);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let generated: Question[] = [];
      if (inputMethod === InputMethod.MANUAL) {
        generated = await generateQuestions(config);
      } else {
        if (!imagePreview) throw new Error("Vui lòng chọn ảnh trước.");
        // Strip prefix data:image/jpeg;base64,
        const base64Data = imagePreview.split(',')[1];
        generated = await generateQuestionsFromImage(base64Data, config.quantity);
      }
      setQuestions(generated);
      setMode(AppMode.PRESENTATION);
    } catch (err: unknown) {
      if(err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi không xác định");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const loadSavedExam = (exam: SavedExam) => {
      setQuestions(exam.questions);
      // setConfig(exam.config); // Optional: restore config
      setMode(AppMode.PRESENTATION);
      setShowBank(false);
  };

  const handleDeleteExam = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Bạn có chắc muốn xóa đề này?")) {
          deleteExam(id);
          setSavedExams(prev => prev.filter(ex => ex.id !== id));
      }
  };

  const handleExportJson = (e: React.MouseEvent, exam: SavedExam) => {
      e.stopPropagation();
      exportExamToJson(exam);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const exam = await importExamFromJson(file);
          saveExam(exam); // Save to local storage
          setSavedExams(getSavedExams()); // Refresh list
          alert(`Đã nhập thành công đề: ${exam.title}`);
      } catch (err) {
          alert("Lỗi nhập file: " + (err instanceof Error ? err.message : "File không hợp lệ"));
      } finally {
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  const handleSaveCurrentExam = () => {
      const examTitle = inputMethod === InputMethod.IMAGE ? 'Đề thi từ Ảnh' : config.lesson;
      const newExam: SavedExam = {
          id: Date.now().toString(),
          title: `${examTitle} - ${new Date().toLocaleDateString('vi-VN')}`,
          timestamp: Date.now(),
          questions: questions,
          config: config
      };
      saveExam(newExam);
      alert("Đã lưu đề thi vào Kho!");
  };

  const toggleTopic = (t: string) => {
    setConfig(prev => {
      const exists = prev.topics.includes(t);
      return {
        ...prev,
        topics: exists ? prev.topics.filter(item => item !== t) : [...prev.topics, t]
      };
    });
  };

  if (mode === AppMode.PRESENTATION) {
    return (
        <PresentationView 
            questions={questions} 
            onBack={() => setMode(AppMode.HOME)} 
            onSave={handleSaveCurrentExam}
            examTitle={inputMethod === InputMethod.IMAGE ? 'Đề thi từ Ảnh' : config.lesson}
        />
    );
  }

  if (mode === AppMode.SIMULATION) {
      return (
          <SimulationView
              questions={questions}
              onBack={() => setMode(AppMode.HOME)}
              examTitle={inputMethod === InputMethod.IMAGE ? 'Đề thi từ Ảnh' : config.lesson}
          />
      )
  }

  if (mode === AppMode.EXPORT) {
    return <ExportView questions={questions} onBack={() => setMode(AppMode.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-32 lg:pb-10">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-indigo-600/20 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] md:w-[30%] md:h-[30%] bg-blue-600/20 rounded-full blur-[70px] md:blur-[100px]"></div>
      </div>

      <div className="relative container mx-auto px-4 py-4 md:px-6 md:py-8 max-w-6xl">
        {/* Compact Header */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shrink-0">
              <BookOpen className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-tight">AI Math Pro</h1>
              <p className="text-slate-400 text-[10px] md:text-sm hidden sm:block">Kết Nối Tri Thức Với Cuộc Sống</p>
            </div>
          </div>
          <div className="flex space-x-2">
             <button 
                onClick={() => {
                    setSavedExams(getSavedExams());
                    setShowBank(true);
                }}
                className="flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs md:text-sm font-medium transition"
             >
                 <Archive className="w-4 h-4 mr-2 text-emerald-400" />
                 Kho Đề
             </button>
          </div>
        </header>

        {/* INPUT METHOD TABS */}
        <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700 w-full max-w-md">
                <button
                    onClick={() => setInputMethod(InputMethod.MANUAL)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${inputMethod === InputMethod.MANUAL ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    <School className="w-4 h-4 mr-2" /> Tạo từ SGK
                </button>
                <button
                    onClick={() => setInputMethod(InputMethod.IMAGE)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${inputMethod === InputMethod.IMAGE ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    <ImageIcon className="w-4 h-4 mr-2" /> Quét từ Ảnh
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Configuration Panel */}
          <div className="lg:col-span-5 space-y-4 md:space-y-6">
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl md:rounded-3xl p-5 shadow-xl h-full">
               
               {inputMethod === InputMethod.MANUAL ? (
                 <>
                   <h2 className="text-base md:text-lg font-bold text-white mb-4 flex items-center">
                      <School className="w-5 h-5 mr-2 text-indigo-400" />
                      Nội Dung Bài Học
                   </h2>

                   {/* Step 1: Grade Selection */}
                   <div className="mb-4">
                      <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Khối Lớp</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["10", "11", "12"].map(g => (
                          <button
                            key={g}
                            onClick={() => handleGradeChange(g)}
                            className={`h-11 rounded-lg font-bold text-sm transition-all ${
                              config.grade === g 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            Lớp {g}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Step 2: Lesson Selection */}
                   <div className="mb-4">
                      <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Bài Học</label>
                      <div className="relative">
                        <BookMarked className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
                        <select 
                          value={config.lesson}
                          onChange={(e) => handleLessonChange(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 text-white pl-10 pr-4 h-12 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm md:text-base font-medium truncate"
                        >
                          {KNTT_CURRICULUM[config.grade].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                   </div>

                   {/* Step 3: AI Analysis (Dynamic Topics) */}
                   <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Chủ đề Kiến thức (AI)</label>
                        <button 
                          onClick={() => analyzeLesson(config.grade, config.lesson)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center p-2 md:p-0 bg-indigo-900/30 rounded md:bg-transparent"
                          title="Phân tích lại"
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${isAnalysing ? 'animate-spin' : ''}`} /> Làm mới
                        </button>
                      </div>
                      
                      {isAnalysing ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-10 bg-slate-700/50 rounded-lg w-full"></div>
                          <div className="h-10 bg-slate-700/50 rounded-lg w-3/4"></div>
                        </div>
                      ) : availableTopics.length > 0 ? (
                        <div className="space-y-2 max-h-48 md:max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                          {availableTopics.map((t, idx) => (
                            <button
                              key={idx}
                              onClick={() => toggleTopic(t)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm text-left transition-all active:scale-[0.98] ${
                                config.topics.includes(t)
                                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                              }`}
                            >
                              <span className="line-clamp-2 leading-snug">{t}</span>
                              {config.topics.includes(t) && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" />}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm text-center">
                          Không tải được chủ đề.
                        </div>
                      )}
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col h-full">
                     <h2 className="text-base md:text-lg font-bold text-white mb-4 flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2 text-indigo-400" />
                        Tải Lên Ảnh Đề Bài
                     </h2>
                     <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition p-6 relative">
                        {!imagePreview ? (
                            <>
                                <Upload className="w-12 h-12 text-slate-500 mb-4" />
                                <p className="text-slate-400 text-center text-sm mb-2">Chạm để tải ảnh bài tập lên</p>
                                <p className="text-slate-600 text-xs">Hỗ trợ JPG, PNG</p>
                            </>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg shadow-lg object-contain" />
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setImagePreview(null);
                                        setSelectedImage(null);
                                    }}
                                    className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-full shadow-lg m-2 hover:bg-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                     </div>
                     <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                        <span className="font-bold">Tính năng Snap & Remix:</span> AI sẽ phân tích đề bài trong ảnh và tạo ra bộ câu hỏi mới tương tự (thay số) để học sinh luyện tập thêm.
                     </div>
                 </div>
               )}
            </div>
          </div>

          {/* RIGHT: Advanced Settings & Actions */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl md:rounded-3xl p-5 shadow-xl flex-1 flex flex-col">
               <h2 className="text-base md:text-lg font-bold text-white mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                  Cấu Hình Chi Tiết
               </h2>

               {/* AI Model Selection */}
               <div className="mb-5">
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Mô hình AI</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setConfig({ ...config, model: 'gemini-3-flash-preview' })}
                      className={`flex flex-row items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98] ${
                        config.model === 'gemini-3-flash-preview'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner'
                          : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <Zap className={`w-5 h-5 mr-3 shrink-0 ${config.model === 'gemini-3-flash-preview' ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`} />
                        <div className="text-left">
                           <span className="block font-bold text-sm">Gemini 3 Flash</span>
                           <span className="block text-xs opacity-70">Tốc độ cao</span>
                        </div>
                      </div>
                      {config.model === 'gemini-3-flash-preview' && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>

                    <button
                      onClick={() => setConfig({ ...config, model: 'gemini-3-pro-preview' })}
                      className={`flex flex-row items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98] ${
                        config.model === 'gemini-3-pro-preview'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-inner'
                          : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <Cpu className={`w-5 h-5 mr-3 shrink-0 ${config.model === 'gemini-3-pro-preview' ? 'text-purple-400' : 'text-slate-500'}`} />
                        <div className="text-left">
                           <span className="block font-bold text-sm">Gemini 3 Pro</span>
                           <span className="block text-xs opacity-70">Thông minh</span>
                        </div>
                      </div>
                      {config.model === 'gemini-3-pro-preview' && <Check className="w-4 h-4 text-purple-400" />}
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                 <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Độ khó</label>
                    <div className="relative">
                        <select
                          value={config.difficulty}
                          onChange={(e) => setConfig({...config, difficulty: e.target.value as Difficulty})}
                          className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 h-11 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none"
                        >
                          <option value={Difficulty.RECOGNITION}>Nhận biết (Dễ)</option>
                          <option value={Difficulty.UNDERSTANDING}>Thông hiểu (Trung bình)</option>
                          <option value={Difficulty.APPLICATION}>Vận dụng (Khá)</option>
                          <option value={Difficulty.ADVANCED_APPLICATION}>Vận dụng cao (Khó)</option>
                          <option value={Difficulty.MIXED}>Hỗn hợp</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Số lượng câu</label>
                    <div className="flex items-center space-x-3 bg-slate-900 border border-slate-600 rounded-xl px-4 h-11">
                       <input
                        type="range"
                        min="5" max="50" step="5"
                        value={config.quantity}
                        onChange={(e) => setConfig({...config, quantity: Number(e.target.value)})}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <span className="font-mono text-indigo-400 font-bold w-6 text-right">{config.quantity}</span>
                    </div>
                 </div>
               </div>

               <div className="mb-6">
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Dạng câu hỏi</label>
                  <div className="flex flex-wrap gap-2">
                   {[QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.SHORT_ANSWER, QuestionType.ESSAY].map(type => (
                     <button
                        key={type}
                        onClick={() => {
                            if (config.questionTypes.includes(type) && config.questionTypes.length > 1) {
                                setConfig({...config, questionTypes: config.questionTypes.filter(t => t !== type)});
                            } else if (!config.questionTypes.includes(type)) {
                                setConfig({...config, questionTypes: [...config.questionTypes, type]});
                            }
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            config.questionTypes.includes(type)
                            ? 'bg-slate-100 text-slate-900 shadow'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                     >
                       {type === QuestionType.MCQ ? 'Trắc nghiệm' : 
                        type === QuestionType.TRUE_FALSE ? 'Đúng/Sai' :
                        type === QuestionType.SHORT_ANSWER ? 'Trả lời ngắn' : 'Tự luận'}
                     </button>
                   ))}
                  </div>
               </div>

               {/* Desktop Action Buttons (Hidden on mobile) */}
               <div className="hidden lg:block mt-auto space-y-4">
                   <DesktopActions 
                     isLoading={isLoading} 
                     config={config} 
                     questions={questions} 
                     handleGenerate={handleGenerate}
                     setMode={setMode}
                     inputMethod={inputMethod}
                     hasImage={!!imagePreview}
                   />
               </div>

               {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center animate-shake">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-lg border-t border-slate-700 lg:hidden z-50">
        {!questions.length || isLoading ? (
             <button
             onClick={handleGenerate}
             disabled={isLoading || (inputMethod === InputMethod.MANUAL ? config.topics.length === 0 : !imagePreview)}
             className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
           >
             {isLoading ? (
               <>
                 <Loader2 className="w-6 h-6 animate-spin mr-2" />
                 <span>Đang xử lý...</span>
               </>
             ) : (
               <>
                 <Sparkles className="w-6 h-6 mr-2" />
                 <span>{inputMethod === InputMethod.MANUAL ? "Tạo Bộ Câu Hỏi" : "Quét & Tạo"} ({config.quantity})</span>
               </>
             )}
           </button>
        ) : (
            <div className="grid grid-cols-3 gap-2">
                 <button
                    onClick={() => setMode(AppMode.PRESENTATION)}
                    className="flex flex-col items-center justify-center h-12 bg-slate-700 text-white rounded-xl font-bold text-xs shadow-lg active:scale-[0.98]"
                  >
                    <Presentation className="w-5 h-5 mb-0.5" /> Trình Chiếu
                  </button>
                 <button
                    onClick={() => setMode(AppMode.SIMULATION)}
                    className="flex flex-col items-center justify-center h-12 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg active:scale-[0.98]"
                  >
                    <PlayCircle className="w-5 h-5 mb-0.5" /> Thi Thử
                  </button>
                  <button
                    onClick={() => setMode(AppMode.EXPORT)}
                    className="flex flex-col items-center justify-center h-12 bg-slate-700 text-white rounded-xl font-bold text-xs shadow-lg active:scale-[0.98]"
                  >
                    <FileText className="w-5 h-5 mb-0.5" /> Xuất File
                  </button>
            </div>
        )}
      </div>
      
      {/* EXAM BANK MODAL */}
      {showBank && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850 rounded-t-2xl">
                      <div className="flex items-center">
                          <Archive className="w-5 h-5 mr-2 text-emerald-400" />
                          <h3 className="text-lg md:text-xl font-bold text-white">Kho Đề Đã Lưu</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                          <button 
                            onClick={handleImportClick}
                            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-bold rounded-lg transition"
                          >
                              <FileUp className="w-4 h-4 mr-1.5" /> Nhập Đề
                          </button>
                          <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            className="hidden" 
                          />
                          <button onClick={() => setShowBank(false)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800">
                      {savedExams.length === 0 ? (
                          <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                              <Archive className="w-12 h-12 mb-3 opacity-20" />
                              <p>Chưa có đề thi nào được lưu.</p>
                              <p className="text-xs mt-2">Bạn có thể tạo mới hoặc nhập file JSON.</p>
                          </div>
                      ) : (
                          savedExams.map(exam => (
                              <div key={exam.id} onClick={() => loadSavedExam(exam)} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 hover:bg-slate-700 transition cursor-pointer group flex items-center justify-between">
                                  <div className="flex-1 pr-4">
                                      <div className="font-bold text-white mb-1 line-clamp-1">{exam.title}</div>
                                      <div className="text-xs text-slate-400 flex items-center">
                                          <span>{new Date(exam.timestamp).toLocaleString('vi-VN')}</span>
                                          <span className="mx-2">•</span>
                                          <span className="bg-slate-600 px-1.5 py-0.5 rounded text-slate-300">{exam.questions.length} câu</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                      <button 
                                        onClick={(e) => handleExportJson(e, exam)}
                                        className="p-2 hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 rounded-lg transition"
                                        title="Tải file JSON"
                                      >
                                          <Download className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={(e) => handleDeleteExam(e, exam.id)}
                                        className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition"
                                        title="Xóa đề"
                                      >
                                          <Trash2 className="w-5 h-5" />
                                      </button>
                                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white ml-1" />
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Extracted for cleaner render
const DesktopActions = ({ isLoading, config, questions, handleGenerate, setMode, inputMethod, hasImage }: any) => (
    <>
        <button
        onClick={handleGenerate}
        disabled={isLoading || (inputMethod === InputMethod.MANUAL ? config.topics.length === 0 : !hasImage)}
        className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
        >
        {isLoading ? (
            <>
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Đang xử lý...</span>
            </>
        ) : (
            <>
            <Sparkles className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
            <span>{inputMethod === InputMethod.MANUAL ? "Tạo Bộ Câu Hỏi Ngay" : "Quét Ảnh & Tạo"}</span>
            </>
        )}
        </button>
        
        {questions.length > 0 && !isLoading && (
        <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
            <button
            onClick={() => setMode(AppMode.PRESENTATION)}
            className="flex items-center justify-center py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
            >
            <Presentation className="w-5 h-5 mr-2" /> Trình Chiếu
            </button>
            <button
            onClick={() => setMode(AppMode.SIMULATION)}
            className="flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-500/20"
            >
            <PlayCircle className="w-5 h-5 mr-2" /> Thi Thử
            </button>
            <button
            onClick={() => setMode(AppMode.EXPORT)}
            className="flex items-center justify-center py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
            >
            <FileText className="w-5 h-5 mr-2" /> Xuất File
            </button>
        </div>
        )}
    </>
);

export default App;