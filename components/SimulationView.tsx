import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionType } from '../types';
import MathText from './MathText';
import { Clock, CheckCircle, XCircle, AlertCircle, BarChart2, Home, ArrowRight, Flag, Calendar } from 'lucide-react';

interface SimulationViewProps {
  questions: Question[];
  onBack: () => void;
  examTitle?: string;
}

// Helper to format time MM:SS
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SimulationView: React.FC<SimulationViewProps> = ({ questions, onBack, examTitle }) => {
  // State
  const [timeLeft, setTimeLeft] = useState(questions.length * 90); // Default 1.5 mins per question
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId/text
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Analytics State
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState<Record<string, { total: number, correct: number }>>({});

  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Timer Effect
  useEffect(() => {
    if (isSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted]);

  const handleSelectOption = (qId: string, optId: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const scrollToQuestion = (qId: string) => {
    scrollRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = () => {
    if (!isSubmitted) {
        if (timeLeft > 0 && !confirm("Bạn có chắc muốn nộp bài sớm?")) return;
        
        // Calculate Score & Stats
        let correctCount = 0;
        const newStats: Record<string, { total: number, correct: number }> = {};

        questions.forEach(q => {
            // Get difficulty key (e.g., "Thông hiểu") or default "Khác"
            const diff = q.difficulty || "Khác";
            if (!newStats[diff]) newStats[diff] = { total: 0, correct: 0 };
            newStats[diff].total += 1;

            const userAnswer = answers[q.id];
            let isCorrect = false;

            if (q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE) {
                if (userAnswer === q.correctOptionId) isCorrect = true;
            } else if (q.type === QuestionType.SHORT_ANSWER) {
                // Simple normalization for short answer check
                if (userAnswer && q.shortAnswer && userAnswer.trim().toLowerCase() === q.shortAnswer.trim().toLowerCase()) {
                    isCorrect = true;
                }
            }
            
            if (isCorrect) {
                correctCount++;
                newStats[diff].correct += 1;
            }
        });

        setScore(correctCount);
        setStats(newStats);
        setIsSubmitted(true);
    }
  };

  // Render Analytics Chart (Simple CSS Bars)
  const renderAnalytics = () => {
      const maxVal = Math.max(...Object.values(stats).map((s: { total: number, correct: number }) => s.total));
      
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Score Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Kết quả chung cuộc</div>
                  <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="transform -rotate-90 w-32 h-32">
                          <circle cx="64" cy="64" r="60" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                          <circle cx="64" cy="64" r="60" stroke="#4f46e5" strokeWidth="8" fill="transparent" 
                                  strokeDasharray={377} 
                                  strokeDashoffset={377 - (377 * score) / questions.length} 
                                  className="transition-all duration-1000 ease-out"
                          />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                          <span className="text-4xl font-black text-slate-800">{score}</span>
                          <span className="text-xs font-bold text-slate-400">/ {questions.length} câu</span>
                      </div>
                  </div>
                  <div className="mt-4 flex items-center text-slate-600 text-sm font-medium">
                      <Clock className="w-4 h-4 mr-1" /> Thời gian: {formatTime(elapsedTime)}
                  </div>
              </div>

              {/* Breakdown Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Phân tích theo độ khó</div>
                  <div className="space-y-4">
                      {Object.entries(stats).map(([diff, data]: [string, { total: number, correct: number }]) => {
                          const percent = Math.round((data.correct / data.total) * 100);
                          return (
                              <div key={diff}>
                                  <div className="flex justify-between text-xs font-bold mb-1">
                                      <span className="text-slate-700">{diff}</span>
                                      <span className={percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                          {data.correct}/{data.total} ({percent}%)
                                      </span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${(data.total / questions.length) * 100}%` }} // Width relative to total questions to show weight? No, let's just show progress bar of correctness
                                      />
                                      {/* Actually better to show correctness bar */}
                                      <div className="w-full h-full bg-slate-100 relative -mt-2">
                                          <div className={`h-2 rounded-full ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${percent}%`}}></div>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3 shadow-lg flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 mr-3 hover:bg-slate-800 rounded-full transition">
                <Home className="w-5 h-5" />
            </button>
            <div>
                <h1 className="font-bold text-lg leading-tight">{examTitle || "Đề thi thử"}</h1>
                <p className="text-xs text-slate-400">Chế độ Mô phỏng • {questions.length} câu hỏi</p>
            </div>
        </div>
        
        {/* Timer Display */}
        {!isSubmitted && (
            <div className={`flex items-center px-4 py-2 rounded-lg font-mono font-bold text-xl ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-emerald-400'}`}>
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(timeLeft)}
            </div>
        )}
        
        {isSubmitted && (
            <div className="flex items-center px-4 py-2 bg-indigo-600 rounded-lg font-bold">
                <Flag className="w-5 h-5 mr-2" /> Kết thúc
            </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* LEFT: Question Stream */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth" id="simulation-content">
              {isSubmitted && renderAnalytics()}

              {questions.map((q, idx) => {
                  const isSelected = !!answers[q.id];
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correctOptionId;

                  return (
                      <div 
                        key={q.id} 
                        id={`q-${q.id}`}
                        ref={el => scrollRefs.current[q.id] = el}
                        className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${isSubmitted ? (isCorrect ? 'border-emerald-200 bg-emerald-50/10' : 'border-red-200 bg-red-50/10') : 'border-slate-200'}`}
                      >
                          {/* Question Header */}
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center">
                                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm mr-3 shrink-0">
                                      {idx + 1}
                                  </span>
                                  {q.difficulty && (
                                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                          {q.difficulty}
                                      </span>
                                  )}
                              </div>
                          </div>

                          {/* Question Content */}
                          <div className="mb-6 text-slate-800 text-lg">
                               <MathText content={q.content} block />
                          </div>

                          {/* Options */}
                          {q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options?.map((opt, i) => {
                                    const selected = userAnswer === opt.id;
                                    const correct = q.correctOptionId === opt.id;
                                    
                                    let btnClass = "border-slate-200 hover:bg-slate-50";
                                    if (!isSubmitted) {
                                        if (selected) btnClass = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600";
                                    } else {
                                        if (correct) btnClass = "border-emerald-500 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-500";
                                        else if (selected && !correct) btnClass = "border-red-500 bg-red-100 text-red-900 opacity-70";
                                        else if (!selected && !correct) btnClass = "opacity-50 border-slate-200";
                                    }

                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSelectOption(q.id, opt.id)}
                                            disabled={isSubmitted}
                                            className={`relative p-4 rounded-lg border-2 text-left transition-all flex items-start ${btnClass}`}
                                        >
                                            <span className="font-bold mr-3 shrink-0">{String.fromCharCode(65 + i)}.</span>
                                            <div className="flex-1"><MathText content={opt.content} /></div>
                                            {isSubmitted && correct && <CheckCircle className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />}
                                            {isSubmitted && selected && !correct && <XCircle className="w-5 h-5 text-red-600 absolute top-4 right-4" />}
                                        </button>
                                    )
                                })}
                            </div>
                          ) : (
                              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 text-sm">
                                  Đây là câu hỏi tự luận/điền khuyết. Vui lòng tự đối chiếu với đáp án sau khi nộp bài.
                              </div>
                          )}

                          {/* Explanation (Only after submit) */}
                          {isSubmitted && (
                              <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in-up">
                                  <div className="font-bold text-indigo-900 mb-2 flex items-center">
                                      <AlertCircle className="w-5 h-5 mr-2" /> Lời giải chi tiết:
                                  </div>
                                  <div className="text-slate-700 bg-slate-50 p-4 rounded-lg leading-relaxed">
                                      <MathText content={q.explanation} block />
                                  </div>
                              </div>
                          )}
                      </div>
                  )
              })}
              
              {/* Bottom Spacer */}
              <div className="h-24"></div>
          </main>

          {/* RIGHT: Sidebar / Navigation Grid */}
          <aside className="w-full md:w-72 lg:w-80 bg-white border-l border-slate-200 shrink-0 flex flex-col h-48 md:h-auto sticky bottom-0 md:relative">
              <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center bg-slate-50">
                  <span>Danh sách câu hỏi</span>
                  <span className="text-xs font-normal text-slate-500">{Object.keys(answers).length}/{questions.length} đã làm</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-5 gap-2">
                      {questions.map((q, idx) => {
                          const hasAnswer = !!answers[q.id];
                          const isCorrect = answers[q.id] === q.correctOptionId;
                          
                          let bgClass = "bg-slate-100 text-slate-500 hover:bg-slate-200";
                          if (!isSubmitted) {
                              if (hasAnswer) bgClass = "bg-indigo-600 text-white shadow-md shadow-indigo-200";
                          } else {
                              if (isCorrect) bgClass = "bg-emerald-500 text-white";
                              else bgClass = "bg-red-500 text-white";
                          }

                          return (
                              <button
                                key={q.id}
                                onClick={() => scrollToQuestion(q.id)}
                                className={`h-10 rounded-lg text-sm font-bold transition-all ${bgClass}`}
                              >
                                  {idx + 1}
                              </button>
                          )
                      })}
                  </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50">
                  {!isSubmitted ? (
                      <button
                        onClick={handleSubmit}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg transition transform active:scale-[0.98] flex items-center justify-center"
                      >
                          <Flag className="w-5 h-5 mr-2" /> Nộp Bài
                      </button>
                  ) : (
                      <div className="grid grid-cols-2 gap-3">
                          <button onClick={onBack} className="py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-white">Thoát</button>
                          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Xem Điểm</button>
                      </div>
                  )}
              </div>
          </aside>
      </div>
    </div>
  );
};

export default SimulationView;