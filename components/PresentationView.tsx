import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import MathText from './MathText';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Home, RotateCcw, Save, BarChart, Eye, EyeOff } from 'lucide-react';

interface PresentationViewProps {
  questions: Question[];
  onBack: () => void;
  onSave?: () => void; // Function to trigger save from App parent
  examTitle?: string;
}

const PresentationView: React.FC<PresentationViewProps> = ({ questions, onBack, onSave, examTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>({});
  
  // NEW: State to toggle option text visibility
  const [showOptionText, setShowOptionText] = useState(true);

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (optId: string) => {
    if (answeredMap[currentQ.id]) return; // Prevent re-answering
    setSelectedOptionId(optId);
  };

  const submitAnswer = () => {
    if (answeredMap[currentQ.id] || !selectedOptionId) return;

    const isCorrect = selectedOptionId === currentQ.correctOptionId;
    if (isCorrect) setScore(s => s + 1);
    
    setAnsweredMap(prev => ({ ...prev, [currentQ.id]: true }));
    setShowExplanation(true);
  };

  const nextSlide = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOptionId(null);
      setShowExplanation(false);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      // Restore state if viewed back
      const prevQ = questions[currentIndex - 1];
      setSelectedOptionId(null); // Simple reset, or could track history
      setShowExplanation(!!answeredMap[prevQ.id]);
    }
  };

  const handleReset = () => {
      if (confirm("Bạn có chắc muốn làm lại bài thi từ đầu? Mọi kết quả hiện tại sẽ bị xóa.")) {
          setCurrentIndex(0);
          setScore(0);
          setAnsweredMap({});
          setSelectedOptionId(null);
          setShowExplanation(false);
      }
  };

  // Determine difficulty color
  const getDifficultyColor = (diff?: string) => {
      if (!diff) return 'bg-slate-100 text-slate-600';
      const d = diff.toLowerCase();
      if (d.includes('nhận biết')) return 'bg-green-100 text-green-700';
      if (d.includes('thông hiểu')) return 'bg-blue-100 text-blue-700';
      if (d.includes('vận dụng')) return 'bg-orange-100 text-orange-700';
      if (d.includes('cao')) return 'bg-red-100 text-red-700';
      return 'bg-slate-100 text-slate-600';
  };

  // Calculate Progress
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-slate-50 fixed inset-0 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-4 bg-white shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-2">
            <button onClick={onBack} className="flex items-center text-slate-600 hover:text-indigo-600 transition p-2 active:bg-slate-100 rounded-lg" title="Thoát">
            <Home className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="hidden md:block w-px h-6 bg-slate-300 mx-2"></div>
            <div className="text-sm md:text-lg font-bold text-slate-700 max-w-[150px] md:max-w-md truncate">
                {examTitle || "Bài Kiểm Tra"}
            </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
            {/* Score Badge */}
            <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-indigo-100">
                <span className="text-sm md:text-lg text-indigo-800 font-bold whitespace-nowrap">
                    Điểm: {score}/{questions.length}
                </span>
            </div>

            {/* Action Buttons */}
            {/* Toggle Text Visibility */}
            <button 
                onClick={() => setShowOptionText(!showOptionText)}
                className={`p-2 rounded-full transition ${showOptionText ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                title={showOptionText ? "Ẩn nội dung đáp án" : "Hiện nội dung đáp án"}
            >
                {showOptionText ? <Eye className="w-5 h-5 md:w-6 md:h-6" /> : <EyeOff className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            <button 
                onClick={handleReset}
                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition"
                title="Làm lại từ đầu"
            >
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {onSave && (
                <button 
                    onClick={onSave}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition"
                    title="Lưu đề này"
                >
                    <Save className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 md:h-2 bg-slate-200 shrink-0">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Slide Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 p-2 md:p-2 pb-24 md:pb-4">
        <div className="min-h-full flex flex-col justify-start md:justify-center items-center py-2 md:py-2">
            {/* Full HD Width */}
            <div className="w-full max-w-[98%] xl:max-w-[1920px] bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 p-3 md:p-6 lg:p-8 flex flex-col">
            
            {/* Question Counter & Meta Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-6 gap-2">
                <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-slate-100 text-slate-600 text-[10px] md:text-base font-bold rounded-lg uppercase tracking-wider">
                        {currentQ.type === QuestionType.MCQ ? 'Trắc nghiệm' : 
                        currentQ.type === QuestionType.TRUE_FALSE ? 'Đúng / Sai' : 'Tự luận / Trả lời ngắn'}
                    </span>
                    {currentQ.difficulty && (
                        <span className={`inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 ${getDifficultyColor(currentQ.difficulty)} text-[10px] md:text-base font-bold rounded-lg tracking-wider`}>
                            <BarChart className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            {currentQ.difficulty}
                        </span>
                    )}
                </div>
                <span className="text-sm md:text-xl font-bold text-slate-400">
                    Câu {currentIndex + 1} / {questions.length}
                </span>
            </div>
            
            {/* Question Content */}
            <div className="mb-4 md:mb-8">
                <div className="text-xl md:text-4xl lg:text-5xl font-semibold text-slate-900 leading-snug">
                   <MathText content={currentQ.content} block className="text-xl md:text-4xl lg:text-5xl" />
                </div>
            </div>

            {/* Options / Interaction Area */}
            <div className="flex-1 w-full">
                {currentQ.type === QuestionType.MCQ || currentQ.type === QuestionType.TRUE_FALSE ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 lg:gap-8 w-full">
                    {currentQ.options?.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = opt.id === currentQ.correctOptionId;
                    const isAnswered = !!answeredMap[currentQ.id];
                    
                    let borderClass = 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50';
                    // Massive Icon Sizes for Large Screens
                    let icon = <div className="w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full border-[2px] md:border-[3px] border-slate-400 text-slate-700 flex items-center justify-center font-bold text-xl md:text-4xl lg:text-5xl transition-colors shrink-0">{String.fromCharCode(65+idx)}</div>;

                    if (isAnswered) {
                        if (isCorrect) {
                        borderClass = 'border-green-500 bg-green-50 ring-4 ring-green-500/30';
                        icon = <CheckCircle className="w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 text-green-600 shrink-0" />;
                        } else if (isSelected && !isCorrect) {
                        borderClass = 'border-red-500 bg-red-50';
                        icon = <XCircle className="w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 text-red-600 shrink-0" />;
                        } else {
                        borderClass = 'opacity-50 border-slate-200';
                        }
                    } else if (isSelected) {
                        borderClass = 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/30';
                        icon = <div className="w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl md:text-4xl lg:text-5xl shrink-0">{String.fromCharCode(65+idx)}</div>;
                    }

                    // Determine text color for better contrast
                    let textColorClass = 'text-slate-900'; // Default high contrast
                    if (isAnswered) {
                        if (isCorrect) textColorClass = 'text-green-900 font-bold';
                        else if (isSelected && !isCorrect) textColorClass = 'text-red-900 font-semibold';
                        else textColorClass = 'text-slate-500'; // Dim unselected answers
                    }

                    return (
                        <button
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt.id)}
                        disabled={isAnswered}
                        className={`relative flex items-center p-3 md:p-5 lg:p-6 rounded-xl md:rounded-3xl border-[2px] md:border-[3px] transition-all text-left group ${borderClass} active:scale-[0.98]`}
                        >
                          <div className="shrink-0 mr-3 md:mr-5 lg:mr-8">
                              {icon}
                          </div>
                          {/* UPDATED: Changed w-full to flex-1 min-w-0 to prevent layout breakage on large text */}
                          <div className={`text-xl md:text-4xl lg:text-5xl font-medium leading-relaxed break-words flex-1 min-w-0 ${textColorClass}`}>
                              {showOptionText ? <MathText content={opt.content} /> : <span className="opacity-0">...</span>}
                          </div>
                        </button>
                    );
                    })}
                </div>
                ) : (
                <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-8 text-center">
                    <p className="text-yellow-800 text-sm md:text-2xl mb-6">
                    Đây là câu hỏi tự luận hoặc trả lời ngắn. Hãy làm ra giấy sau đó xem đáp án.
                    </p>
                    {!answeredMap[currentQ.id] && (
                        <button 
                            onClick={() => {
                                setAnsweredMap(prev => ({ ...prev, [currentQ.id]: true }));
                                setShowExplanation(true);
                            }}
                            className="px-8 py-4 bg-yellow-600 text-white rounded-xl font-bold text-xl shadow-lg active:scale-95 transition"
                        >
                            Xem Đáp Án
                        </button>
                    )}
                </div>
                )}
            </div>

            {/* Explanation Area */}
            {showExplanation && (
                <div className="mt-6 md:mt-10 p-5 md:p-8 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in-up">
                <h3 className="text-lg md:text-2xl font-bold text-indigo-900 mb-4 flex items-center">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8 mr-3" />
                    Lời giải chi tiết:
                </h3>
                <div className="text-base md:text-xl text-slate-800 leading-relaxed">
                    <MathText content={currentQ.explanation} block />
                </div>
                </div>
            )}
            </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 md:px-8 md:py-5 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         <button 
           onClick={prevSlide}
           disabled={currentIndex === 0}
           className="flex items-center px-4 py-2 md:px-8 md:py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold disabled:opacity-30 transition active:scale-95 text-sm md:text-lg"
         >
           <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 mr-1" />
           <span className="hidden md:inline">Câu trước</span>
         </button>

         {/* Center Action Button */}
         {!answeredMap[currentQ.id] ? (
             <button
               onClick={submitAnswer}
               disabled={!selectedOptionId && (currentQ.type === QuestionType.MCQ || currentQ.type === QuestionType.TRUE_FALSE)}
               className="flex-1 mx-4 max-w-sm flex items-center justify-center px-6 py-3 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base md:text-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
             >
               Kiểm Tra
             </button>
         ) : (
             <div className="flex-1 mx-4 max-w-xs flex items-center justify-center text-indigo-600 font-bold text-lg md:text-2xl animate-pulse">
                {selectedOptionId === currentQ.correctOptionId ? "Chính xác! 🎉" : "Chưa đúng 😅"}
             </div>
         )}

         <button 
           onClick={nextSlide}
           disabled={currentIndex === questions.length - 1}
           className="flex items-center px-4 py-2 md:px-8 md:py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold disabled:opacity-30 transition active:scale-95 text-sm md:text-lg"
         >
           <span className="hidden md:inline">Câu sau</span>
           <ChevronRight className="w-5 h-5 md:w-6 md:h-6 ml-1" />
         </button>
      </div>
    </div>
  );
};

// Missing icon import fallback
function BookOpen({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    )
}

export default PresentationView;