import React, { useState, useCallback, useEffect } from 'react';
import { Survey, Question, QuestionType, SurveyResponse } from './types';
import { generateSurveyFromPrompt } from './GeminiService';
import QuestionEditor from './components/QuestionEditor';
import FormViewer from './components/FormViewer';
import ResponsesViewer from './components/ResponsesViewer';
import ShareModal from './components/ShareModal';
import { PlusIcon, ShareIcon } from './components/icons';

type View = 'EDIT' | 'PREVIEW' | 'RESPONSES';

const initialSurvey: Survey = {
  title: 'BIỂU MẪU KHẢO SÁT THÔNG TIN MÔI TRƯỜNG',
  description: 'CHÚNG TÔI CAM KẾT CHỈ SỬ DỤNG THÔNG TIN CHO MỤC ĐÍCH NGHIÊN CỨU KHOA HỌC.',
  questions: [
    {
      id: crypto.randomUUID(),
      title: 'Tên doanh nghiệp',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Địa chỉ',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Ngành nghề sản xuất chính (VD: Điện tử, may mặc...)',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Vốn điều lệ',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: ['Dưới 3 tỷ', 'Từ 3 đến dưới 20 tỷ', 'Từ 20 đến dưới 100 tỷ', 'Trên 100 tỷ'],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Quy mô lao động (Người)',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Diện tích nhà xưởng sản xuất (m²)',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Loại hình doanh nghiệp',
      questionType: QuestionType.MULTIPLE_CHOICE,
      options: [
        'Doanh nghiệp nhà nước (Nhà nước nắm giữ trên 50% vốn điều lệ, tổng số cổ phần có quyền biểu quyết)', 
        'Doanh nghiệp FDI (DN có nhà đầu tư nước ngoài là thành viên, cổ đông)', 
        'Doanh nghiệp ngoài nhà nước trong nước (bao gồm cả doanh nghiệp có cổ phần NN dưới 50%)'
      ],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Phần B.1: Chất thải rắn sinh hoạt (CTRSH)',
      description: 'Vui lòng liệt kê các loại chất thải, khối lượng phát sinh (kg/năm) và đơn vị tiếp nhận.',
      questionType: QuestionType.DYNAMIC_TABLE,
      columns: ['Tên chất thải', 'KLPS 2023 (kg)', 'KLPS 2024 (kg)', 'KLPS 6 tháng đầu năm 2025 (kg)', 'Đơn vị tiếp nhận'],
      options: [],
      isRequired: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Phần B.2.I: CTR công nghiệp thông thường - Sử dụng trực tiếp tại cơ sở',
      description: 'Liệt kê tên chất thải và khối lượng phát sinh (kg/năm).',
      questionType: QuestionType.DYNAMIC_TABLE,
      columns: ['Tên chất thải', 'KLPS 2023 (kg)', 'KLPS 2024 (kg)', 'KLPS 6 tháng đầu năm 2025 (kg)'],
      options: [],
      isRequired: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Phần B.2.II: CTR công nghiệp thông thường - Tái sử dụng/tái chế (chuyển giao)',
      description: 'Liệt kê tên chất thải, khối lượng phát sinh (kg/năm) và đơn vị tiếp nhận.',
      questionType: QuestionType.DYNAMIC_TABLE,
      columns: ['Tên chất thải', 'KLPS 2023 (kg)', 'KLPS 2024 (kg)', 'KLPS 6 tháng đầu năm 2025 (kg)', 'Đơn vị tiếp nhận'],
      options: [],
      isRequired: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Phần B.2.III: CTR công nghiệp thông thường - Chất thải phải xử lý',
      description: 'Liệt kê tên chất thải và khối lượng phát sinh (kg/năm).',
      questionType: QuestionType.DYNAMIC_TABLE,
      columns: ['Tên chất thải', 'KLPS 2023 (kg)', 'KLPS 2024 (kg)', 'KLPS 6 tháng đầu năm 2025 (kg)'],
      options: [],
      isRequired: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Phần 3: Chất thải nguy hại (CTNH)',
      description: 'Ghi chú phương pháp xử lý: TC (Tận thu/tái chế); TH (Trung hoà); PT (Phân tách/chiết/lọc/kết tủa); OH (Oxy hoá); SH (Sinh học); ĐX (Đồng xử lý); TĐ (Thiêu đốt); HR (Hoá rắn); CL (Cô lập/đóng kén); C (Chôn lấp); TR (Tẩy rửa); SC (Sơ chế); Khác (ghi rõ tên).',
      questionType: QuestionType.DYNAMIC_TABLE,
      columns: ['Tên chất thải', 'Mã CTNH', 'KL 2023 (kg)', 'KL 2024 (kg)', 'KL 6 tháng đầu năm 2025 (kg)', 'Phương pháp xử lý', 'Đơn vị tiếp nhận'],
      options: [],
      isRequired: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Người liên hệ',
      description: 'Vui lòng cung cấp họ tên Ông/Bà để liên hệ khi cần.',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Số điện thoại liên hệ',
      description: 'để hỏi về cách điền "Phạm Minh Công 0989807832 hoặc Đỗ Đức Tuệ 0942319579"',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: true,
    },
  ],
};

function App() {
  const [survey, setSurvey] = useState<Survey>(initialSurvey);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [currentView, setCurrentView] = useState<View>('EDIT');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFillMode, setIsFillMode] = useState(false);
  const [webAppUrl, setWebAppUrl] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surveyData = params.get('survey');
    const endpoint = params.get('endpoint');

    if (surveyData && endpoint) {
      try {
        const decodedSurvey = JSON.parse(decodeURIComponent(atob(surveyData)));
        const decodedUrl = atob(endpoint);
        setSurvey(decodedSurvey);
        setWebAppUrl(decodedUrl);
        setIsFillMode(true);
      } catch (e) {
        console.error("Failed to parse survey data from URL", e);
        setError("Không thể tải khảo sát từ liên kết. Liên kết có thể bị lỗi.");
      }
    }
  }, []);


  const updateSurvey = (updates: Partial<Survey>) => {
    setSurvey(prev => ({ ...prev, ...updates }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      questionType: QuestionType.SHORT_ANSWER,
      options: [],
      isRequired: false,
    };
    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = useCallback((id: string, updatedQuestion: Partial<Question>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updatedQuestion } : q),
    }));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id),
    }));
  }, []);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newSurvey = await generateSurveyFromPrompt(aiPrompt);
      setSurvey(newSurvey);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormSubmit = (response: SurveyResponse) => {
      setResponses(prev => [...prev, response]);
      alert('Cảm ơn bạn đã gửi phản hồi! (Phản hồi này chỉ được lưu cục bộ cho mục đích xem trước)');
      setCurrentView('RESPONSES');
  }

  const renderEditorView = () => (
    <>
     <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            <h1 className="text-2xl font-bold text-purple-700">AI Survey Builder</h1>
            
            <div className="flex items-center w-full md:w-auto md:max-w-md lg:max-w-lg flex-grow">
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                placeholder="Tạo khảo sát với AI ✨ (vd: khảo sát mức độ hài lòng của khách hàng...)"
                className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                disabled={isLoading}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-r-md hover:bg-purple-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-200 rounded-lg p-1">
                {['EDIT', 'PREVIEW', 'RESPONSES'].map(view => (
                    <button
                    key={view}
                    onClick={() => setCurrentView(view as View)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentView === view
                        ? 'bg-white text-purple-700 shadow'
                        : 'text-gray-600 hover:bg-gray-300'
                    }`}
                    >
                    {view === 'EDIT' ? 'Câu hỏi' : view === 'PREVIEW' ? 'Xem trước' : `Câu trả lời (${responses.length})`}
                    </button>
                ))}
                </div>
                <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    title="Chia sẻ và thu thập dữ liệu"
                >
                    <ShareIcon />
                </button>
            </div>
          </div>
          {error && <div className="text-center text-red-500 pb-2">{error}</div>}
        </div>
      </header>
      <main>
        {
          {
            'EDIT': (
                <div className="max-w-4xl mx-auto py-8 px-4">
                    <div className="bg-white p-6 rounded-lg border-t-8 border-purple-600 mb-6 shadow-md">
                    <input
                        type="text"
                        value={survey.title}
                        onChange={e => updateSurvey({ title: e.target.value })}
                        className="w-full text-4xl font-bold text-gray-800 p-2 border-b-2 border-transparent focus:border-purple-500 outline-none"
                    />
                    <input
                        type="text"
                        value={survey.description}
                        onChange={e => updateSurvey({ description: e.target.value })}
                        placeholder="Mô tả biểu mẫu"
                        className="w-full text-gray-600 mt-2 p-2 border-b-2 border-transparent focus:border-purple-500 outline-none"
                    />
                    </div>
                    {survey.questions.map(q => (
                    <QuestionEditor
                        key={q.id}
                        question={q}
                        updateQuestion={updateQuestion}
                        deleteQuestion={deleteQuestion}
                    />
                    ))}
                    <div className="flex justify-center mt-4">
                    <button onClick={addQuestion} className="p-3 bg-white text-gray-600 hover:bg-gray-100 rounded-full shadow-md border transition-all">
                        <PlusIcon />
                    </button>
                    </div>
                </div>
            ),
            'PREVIEW': <FormViewer survey={survey} onSubmit={handleFormSubmit} />,
            'RESPONSES': <ResponsesViewer survey={survey} responses={responses} />
          }[currentView]
        }
      </main>
    </>
  );

  if (isFillMode) {
    return (
        <div className="min-h-screen bg-purple-50">
             <main>
                <FormViewer survey={survey} onSubmit={() => {}} webAppUrl={webAppUrl} isFillMode={true} />
            </main>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50">
        {renderEditorView()}
        {isShareModalOpen && <ShareModal survey={survey} onClose={() => setIsShareModalOpen(false)} />}
    </div>
  );
}

export default App;
