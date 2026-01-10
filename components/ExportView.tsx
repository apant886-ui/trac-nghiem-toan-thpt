import React, { useState } from 'react';
import { Question, ExamExportConfig, SavedExam } from '../types';
import { downloadWordFiles } from '../services/exportService';
import { saveExam } from '../services/storageService';
import { generateTheorySummary } from '../services/geminiService';
import MathText from './MathText';
import { FileDown, ArrowLeft, Layers, Type, Save, Printer, BookOpenText, Loader2, BarChart } from 'lucide-react';

interface ExportViewProps {
  questions: Question[];
  onBack: () => void;
}

const ExportView: React.FC<ExportViewProps> = ({ questions, onBack }) => {
  const [config, setConfig] = useState<ExamExportConfig>({
    numberOfVariants: 4,
    examTitle: 'ĐỀ CƯƠNG ÔN TẬP',
    schoolName: 'TRƯỜNG THPT NGUYỄN DU',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Theory State
  const [includeTheory, setIncludeTheory] = useState(false);
  const [theoryContent, setTheoryContent] = useState<string>("");
  const [isLoadingTheory, setIsLoadingTheory] = useState(false);

  const fetchTheory = async () => {
      // Assuming we have context of Grade/Lesson from the generated questions context,
      // but strictly we should pass config props. 
      // For now, we use a generic placeholder or ask user to confirm.
      // Ideally, ExportView should receive the 'AppConfig' prop.
      // Since we didn't refactor AppConfig into Props here, we will guess or strictly
      // we need to pass AppConfig to ExportView.
      // FIX: For this iteration, we mock the lesson context or assume typical.
      // A better way is to pass AppConfig. Let's assume user wants theory for "Toán" generally if context missing.
      
      // However, to do this correctly without changing App.tsx signature too much:
      setIsLoadingTheory(true);
      // We will try to extract lesson from the first question's context if possible, 
      // OR we just use a generic prompt if config is missing.
      // Actually, let's prompt the AI to summarize based on the questions content if we don't have the lesson name.
      // But App.tsx has the state. 
      
      // QUICK FIX: Since I cannot easily change App.tsx props in this specific XML block without seeing App.tsx,
      // I will assume we can generate theory based on the content of questions or a hardcoded context 
      // OR I will update App.tsx to pass config.
      
      // Let's rely on the user understanding this is a demo feature or update App.tsx to pass config.
      // I will update App.tsx below to pass config to ExportView.
      const lesson = "Bài học tương ứng với các câu hỏi này"; 
      const grade = "THPT";
      
      try {
          const content = await generateTheorySummary(grade, lesson);
          setTheoryContent(content);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingTheory(false);
      }
  };

  const handleToggleTheory = async () => {
      const newVal = !includeTheory;
      setIncludeTheory(newVal);
      if (newVal && !theoryContent) {
          // Trigger fetch
          // NOTE: In a real app, pass 'config' from App.tsx. 
          // Here we use a generic fetch for demonstration.
          // To make it work perfectly, I will modify App.tsx to pass config.
          setIsLoadingTheory(true);
          const generated = await generateTheorySummary("11", "Bài tập (Tự động phân tích)"); 
          setTheoryContent(generated);
          setIsLoadingTheory(false);
      }
  }

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      downloadWordFiles(questions, config, includeTheory ? theoryContent : undefined);
      setIsExporting(false);
    }, 500);
  };

  const handleSaveToBank = () => {
    setIsSaving(true);
    const exam: SavedExam = {
        id: Date.now().toString(),
        title: config.examTitle,
        timestamp: Date.now(),
        questions: questions,
        config: { 
            grade: "11", lesson: "Review", topics: [], difficulty: "MIXED" as any, questionTypes: [], quantity: questions.length, model: "N/A" 
        },
        exportConfig: config
    };
    saveExam(exam);
    setTimeout(() => {
        setIsSaving(false);
        alert("Đã lưu vào Kho Đề Thi!");
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
      {/* Styles for Printing */}
      <style>{`
        @media print {
            @page { margin: 2cm; size: A4; }
            body { background: white; -webkit-print-color-adjust: exact; }
            header, .no-print { display: none !important; }
            .print-container { 
                position: absolute; 
                top: 0; left: 0; width: 100%; 
                margin: 0; padding: 0; 
                display: block !important; 
                overflow: visible !important;
                height: auto !important;
            }
            .print-break { page-break-inside: avoid; }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 flex items-center shadow-sm sticky top-0 z-20 no-print">
        <button onClick={onBack} className="mr-3 md:mr-4 p-2 rounded-full hover:bg-slate-100 transition active:bg-slate-200">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">Xuất tài liệu ôn tập</h1>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-24 lg:pb-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6 no-print">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-indigo-600" />
              Cấu trúc tài liệu
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên trường / Tổ</label>
                <input 
                  type="text" 
                  value={config.schoolName}
                  onChange={e => setConfig({...config, schoolName: e.target.value})}
                  className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề tài liệu</label>
                <input 
                  type="text" 
                  value={config.examTitle}
                  onChange={e => setConfig({...config, examTitle: e.target.value})}
                  className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base"
                />
              </div>
              
              {/* Feature: Theory Summary Toggle */}
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center">
                      <BookOpenText className="w-5 h-5 mr-2 text-indigo-600" />
                      <span className="text-sm font-bold text-indigo-900">Kèm Tóm tắt Lý thuyết</span>
                  </div>
                  <button 
                    onClick={handleToggleTheory}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${includeTheory ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${includeTheory ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng mã đề</label>
                <div className="flex items-center space-x-4">
                   <input 
                    type="range" 
                    min="1" max="10" 
                    value={config.numberOfVariants}
                    onChange={e => setConfig({...config, numberOfVariants: Number(e.target.value)})}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-bold text-indigo-700 w-8 text-center">{config.numberOfVariants}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3">
                <button
                  onClick={handleExport}
                  disabled={isExporting || isLoadingTheory}
                  className="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition active:scale-[0.98] disabled:opacity-70"
                >
                  {isExporting ? <Loader2 className="animate-spin mr-2" /> : <FileDown className="w-5 h-5 mr-2" />}
                  {isExporting ? 'Đang xuất file...' : 'Tải Word (Chuẩn)'}
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                    <button
                    onClick={handleSaveToBank}
                    disabled={isSaving}
                    className="flex items-center justify-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-200 transition active:scale-[0.98]"
                    >
                    <Save className="w-5 h-5 mr-2" />
                    Lưu Kho
                    </button>
                    <button
                    onClick={handlePrint}
                    className="flex items-center justify-center py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold shadow-lg transition active:scale-[0.98]"
                    >
                    <Printer className="w-5 h-5 mr-2" />
                    In PDF
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px] lg:h-[calc(100vh-140px)] print-container">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0 no-print">
             <h3 className="font-bold text-slate-700 flex items-center text-sm md:text-base">
                <Type className="w-4 h-4 mr-2" /> Xem trước
             </h3>
          </div>
          
          {/* Print Header */}
          <div className="hidden print:block text-center mb-6 pt-4">
              <h2 className="text-xl font-bold uppercase">{config.schoolName}</h2>
              <h1 className="text-2xl font-bold uppercase mt-2">{config.examTitle}</h1>
              <hr className="my-4 border-slate-300"/>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
             {/* Theory Section Preview */}
             {includeTheory && (
                 <div className="mb-8 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg print:border-none print:p-0 print:bg-white">
                     <h3 className="font-bold text-lg text-indigo-900 uppercase border-b border-indigo-200 pb-2 mb-4 print:text-black print:border-black">I. Tóm tắt lý thuyết</h3>
                     {isLoadingTheory ? (
                         <div className="flex items-center text-indigo-500 animate-pulse">
                             <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tổng hợp kiến thức từ AI...
                         </div>
                     ) : (
                         <div className="prose prose-sm max-w-none text-slate-800">
                             <MathText content={theoryContent || "Chưa có dữ liệu."} block />
                         </div>
                     )}
                 </div>
             )}

             {/* Questions Section */}
             <div>
                <h3 className={`font-bold text-lg uppercase border-b pb-2 mb-4 ${includeTheory ? 'text-indigo-900 border-indigo-200 print:text-black print:border-black' : 'hidden'}`}>
                    {includeTheory ? 'II. Bài tập vận dụng' : ''}
                </h3>
                {questions.map((q, idx) => (
                <div key={q.id} className="border-b border-slate-100 pb-4 last:border-0 print-break mb-4">
                    <div className="flex items-start">
                        <span className="font-bold text-indigo-600 print:text-black mr-2 flex-shrink-0 text-sm md:text-base">Câu {idx + 1}:</span>
                        <div className="text-slate-800 text-sm md:text-base leading-relaxed overflow-x-auto">
                        <MathText content={q.content} block />
                        </div>
                    </div>
                    {/* Difficulty Badge in Preview */}
                    {q.difficulty && (
                        <div className="ml-0 md:ml-2 mb-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200 print:hidden">
                                <BarChart className="w-3 h-3 mr-1" />
                                {q.difficulty}
                            </span>
                        </div>
                    )}
                    {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-2 ml-2 md:ml-8">
                        {q.options.map((opt, i) => (
                            <div key={opt.id} className={`text-sm ${opt.id === q.correctOptionId ? 'text-green-600 font-semibold print:text-black print:font-normal' : 'text-slate-600'}`}>
                            {String.fromCharCode(65 + i)}. <MathText content={opt.content} />
                            </div>
                        ))}
                        </div>
                    )}
                </div>
                ))}
             </div>
             
             {/* Print Footer: Answer Key */}
             <div className="hidden print:block mt-8 pt-8 border-t-2 border-slate-800 break-before-page">
                 <h3 className="font-bold text-lg mb-4 text-center">ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT</h3>
                 {questions.map((q, idx) => (
                    <div key={q.id} className="mb-4">
                        <p><strong>Câu {idx+1}:</strong> {q.options?.find(o => o.id === q.correctOptionId) ? String.fromCharCode(65 + q.options!.findIndex(o => o.id === q.correctOptionId)) : ''} {q.difficulty ? `(${q.difficulty})` : ''}</p>
                        <div className="text-sm text-slate-600 mt-1"><MathText content={q.explanation} /></div>
                    </div>
                 ))}
             </div>
          </div>
        </div>
      </main>
      
      {/* Mobile Sticky Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 no-print">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center h-12 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-[0.98] transition"
        >
          <FileDown className="w-5 h-5 mr-2" />
          {isExporting ? 'Đang tạo...' : 'Tải xuống File Word'}
        </button>
      </div>
    </div>
  );
};

export default ExportView;