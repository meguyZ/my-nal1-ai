import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  SendHorizontal, User, Bot, Menu, Plus, Image as ImageIcon, 
  Code, Sparkles, Sun, Moon, Zap, Terminal, PenTool, Layout, 
  Settings, History, HelpCircle, X, ChevronDown, Check, Trash2, 
  MessageSquare, Info, MoreVertical, Shield, Globe, Cpu, Monitor,
  Pin, PinOff, Edit2, Paperclip, FileText, XCircle, RefreshCw
} from 'lucide-react';

// --- NAL1 CONFIGURATION ---
const NAL1_MODELS = [
  { id: 'openai', name: 'Nal1 Ultra', desc: 'Powerful for complex reasoning.', icon: <Sparkles size={16} className="text-purple-500" /> },
  { id: 'qwen', name: 'Nal1 Architect', desc: 'Expert in coding and logic.', icon: <Terminal size={16} className="text-blue-500" /> },
  { id: 'mistral', name: 'Nal1 Lite', desc: 'Fast and efficient.', icon: <Zap size={16} className="text-orange-500" /> },
];

const NAL1_MODES = [
  { id: 'standard', name: 'Standard', icon: <Sparkles size={18} />, prompt: "Be helpful and concise." },
  { id: 'analyst', name: 'Analyst', icon: <Zap size={18} />, prompt: "Analyze deeply." },
  { id: 'savage', name: 'Savage', icon: <Terminal size={18} />, prompt: "Be direct and sharp." },
  { id: 'image', name: 'Vision', icon: <ImageIcon size={18} />, prompt: "IMAGE_GEN" }, 
];

// --- STORAGE UTILS ---
const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getFromStorage = (key, fallback) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

// --- CORE COMPONENTS ---

const CodeBlock = ({ language, code, isDark }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`my-4 rounded-2xl overflow-hidden font-mono text-sm border ${isDark ? 'border-[#333] bg-[#000]' : 'border-gray-200 bg-[#f8f9fa]'}`}>
      <div className={`px-4 py-2.5 text-[10px] uppercase flex justify-between items-center border-b ${isDark ? 'border-[#333] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
        <span className="font-bold tracking-widest">{language || 'code'}</span>
        <button onClick={handleCopy} className="hover:text-blue-500 font-bold uppercase">{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <div className="p-5 overflow-x-auto"><pre className={isDark ? 'text-gray-300' : 'text-gray-800'}><code>{code}</code></pre></div>
    </div>
  );
};

const ImageResult = ({ url, prompt }) => (
  <div className="mt-4 max-w-full rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-700">
    <img src={url} alt={prompt} className="w-full h-auto object-cover bg-gray-100 dark:bg-gray-900 min-h-[300px]" />
    <div className="p-4 bg-white dark:bg-[#1e1e1e] text-[11px] opacity-60 italic border-t border-inherit">Prompt: {prompt}</div>
  </div>
);

const MessageContent = ({ text, isDark, attachments }) => {
  const contentText = typeof text === 'string' ? text : JSON.stringify(text);
  if (contentText.startsWith('NAL1_IMG:')) {
    const parts = contentText.split('|');
    return <ImageResult url={parts[0].replace('NAL1_IMG:', '')} prompt={parts[1] || ''} />;
  }
  const codeBlockRegex = /```(\w*)\s*([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = codeBlockRegex.exec(contentText)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: contentText.substring(lastIndex, match.index) });
    parts.push({ type: 'code', language: match[1], content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < contentText.length) parts.push({ type: 'text', content: contentText.substring(lastIndex) });

  return (
    <div className="space-y-4">
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'bg-[#1e1f20] border-[#333]' : 'bg-[#f0f4f9] border-gray-200'}`}>
              {file.type.startsWith('image/') ? <img src={file.dataUrl} className="w-10 h-10 rounded object-cover" alt="" /> : <FileText size={16} className="text-blue-500" />}
              <span className="text-[10px] font-bold max-w-[100px] truncate">{file.name}</span>
            </div>
          ))}
        </div>
      )}
      {parts.map((part, index) => (
        part.type === 'code' ? <CodeBlock key={index} language={part.language} code={part.content} isDark={isDark} /> :
        <div key={index} className={`whitespace-pre-wrap leading-7 text-[16px] sm:text-[17px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {part.content.split(/(\*\*.*?\*\*)/g).map((subPart, i) => subPart.startsWith('**') && subPart.endsWith('**') ? <strong key={i} className={isDark ? "text-white font-bold" : "text-black font-bold"}>{subPart.replace(/\*\*/g, '')}</strong> : subPart)}
        </div>
      ))}
    </div>
  );
};

const SuggestionCard = ({ text, icon, onClick, isDark }) => (
  <button onClick={() => onClick(text)} className={`text-left p-6 rounded-[24px] transition-all duration-300 min-h-[160px] flex flex-col justify-between group border border-transparent shadow-sm ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] text-gray-200' : 'bg-[#f0f4f9] hover:bg-[#e9eef6] text-gray-700'}`}>
    <span className="text-[14px] md:text-[15px] font-medium leading-relaxed opacity-90">{text}</span>
    <div className={`p-3 rounded-full w-fit ${isDark ? 'bg-[#131314]' : 'bg-white'} group-hover:scale-110 transition-transform shadow-md`}>{icon}</div>
  </button>
);

// --- BRAIN LOGIC (BYPASS ENGINE) ---
class Nal1Brain {
  constructor() {
    this.textApiUrl = 'https://text.pollinations.ai/'; 
  }

  async process(input, modelId, modeId, attachments = [], retryCount = 0) {
    if (!input.trim() && attachments.length === 0) return null;

    if (modeId === 'image') {
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(input)}?seed=${seed}&width=1024&height=1024&nologo=true&model=flux`;
      await new Promise(r => setTimeout(r, 2000));
      return `NAL1_IMG:${imageUrl}|${input}`;
    }

    const selectedMode = NAL1_MODES.find(m => m.id === modeId);
    let attachmentCtx = attachments.length > 0 ? ` [Files: ${attachments.map(a => a.name).join(', ')}]` : "";
    
    // Bypass Logic: ใช้ System Prompt ที่สั้นและชัดเจนเพื่อลด Error
    const systemPrompt = `Nal1 AI: ${selectedMode?.prompt} Thai Lang. Markdown.${attachmentCtx}`;
    const fullQuery = `${systemPrompt}\n\nQ: ${input}\nA:`;

    try {
      const response = await fetch(`${this.textApiUrl}${encodeURIComponent(fullQuery)}?model=${modelId}`, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' },
        cache: 'no-cache'
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.text();
      if (!data || data.length < 2) throw new Error("Empty response");
      
      return data;
    } catch (e) {
      console.warn(`Node ${modelId} failed. Retry: ${retryCount}/3`);
      
      if (retryCount < 3) {
        // Bypass Strategy: สลับโมเดลอัตโนมัติเมื่อเกิด Error
        const fallbackModels = NAL1_MODELS.map(m => m.id).filter(id => id !== modelId);
        const nextModel = fallbackModels[retryCount % fallbackModels.length];
        return await this.process(input, nextModel, modeId, attachments, retryCount + 1);
      }
      
      return "⚠️ **Nal1 Bypass Mode:** ระบบขัดข้องชั่วคราวเนื่องจากปริมาณการใช้งานสูง กรุณาลองส่งข้อความอีกครั้งใน 5 วินาที";
    }
  }
}

// --- MAIN APP ---

export default function App() {
  const [chats, setChats] = useState(() => getFromStorage('nal1_chats_v5', []));
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem('nal1_active_chat') || null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('nal1_theme') === 'dark');
  const [model, setModel] = useState(() => localStorage.getItem('nal1_model') || 'openai');
  const [mode, setMode] = useState(() => localStorage.getItem('nal1_mode') || 'standard');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const brain = useRef(new Nal1Brain());

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);
  const sortedChats = useMemo(() => [...chats].sort((a, b) => (a.isPinned === b.isPinned) ? new Date(b.timestamp) - new Date(a.timestamp) : (a.isPinned ? -1 : 1)), [chats]);

  useEffect(() => {
    saveToStorage('nal1_chats_v5', chats);
    if (activeChatId) localStorage.setItem('nal1_active_chat', activeChatId);
    localStorage.setItem('nal1_theme', isDark ? 'dark' : 'light');
    localStorage.setItem('nal1_model', model);
    localStorage.setItem('nal1_mode', mode);
  }, [chats, activeChatId, isDark, model, mode]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 250) + 'px'; } }, [input]);

  const createNewChat = () => {
    const newChat = { id: Date.now().toString(), title: 'New Chat', messages: [], isPinned: false, timestamp: new Date().toISOString() };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput('');
    setAttachments([]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachments(prev => [...prev, { name: f.name, type: f.type, dataUrl: ev.target.result }]);
      reader.readAsDataURL(f);
    });
    e.target.value = null;
  };

  const handleSend = async (customInput = null) => {
    const prompt = (customInput || input).trim();
    if ((!prompt && attachments.length === 0) || isTyping) return;

    let currentId = activeChatId;
    if (!currentId) {
      const newChat = { id: Date.now().toString(), title: prompt ? prompt.substring(0, 40) : 'New Chat', messages: [], isPinned: false, timestamp: new Date().toISOString() };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      currentId = newChat.id;
    }

    const currentFiles = [...attachments];
    setInput('');
    setAttachments([]);
    const userMsg = { id: Date.now().toString(), text: prompt, sender: 'user', timestamp: new Date(), attachments: currentFiles };
    setChats(prev => prev.map(c => c.id === currentId ? { ...c, title: c.messages.length === 0 && prompt ? prompt.substring(0, 40) : c.title, messages: [...c.messages, userMsg], timestamp: new Date().toISOString() } : c));
    setIsTyping(true);

    const response = await brain.current.process(prompt, model, mode, currentFiles);
    
    if (response) {
      const botMsg = { id: (Date.now() + 1).toString(), text: response, sender: 'bot', timestamp: new Date() };
      setChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: [...c.messages, botMsg] } : c));
    }
    setIsTyping(false);
  };

  const theme = {
    bg: isDark ? 'bg-[#131314]' : 'bg-white',
    sidebar: isDark ? 'bg-[#1e1e20]' : 'bg-[#f0f4f9]',
    text: isDark ? 'text-gray-100' : 'text-gray-800',
    muted: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-[#333]' : 'border-gray-200',
    inputBg: isDark ? 'bg-[#1e1f20]' : 'bg-[#f0f4f9]',
    active: isDark ? 'bg-[#28292a] text-white' : 'bg-[#dde3ea] text-gray-900',
    hover: isDark ? 'hover:bg-[#28292a]' : 'hover:bg-[#e9eef6]',
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-all duration-300 ${theme.bg} ${theme.text}`} style={{ fontFamily: "'Inter', 'Noto Sans Thai', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap'); .custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 10px; } .scrollbar-none::-webkit-scrollbar { display: none; } textarea { field-sizing: content; } .animate-in { animation: animate-in 0.4s ease-out; } @keyframes animate-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }` }} />

      <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ${theme.sidebar} ${sidebarOpen ? 'w-[300px] translate-x-0 border-r border-black/5 dark:border-white/5' : 'w-0 -translate-x-full md:w-[68px] md:translate-x-0'} flex flex-col shadow-xl md:shadow-none`}>
        <div className="p-4 h-16 flex items-center"><button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2.5 rounded-full ${theme.hover} ${theme.muted}`}><Menu size={20} /></button></div>
        <div className="px-4 py-2 mt-2 mb-6"><button onClick={createNewChat} className={`flex items-center gap-3 p-3.5 rounded-full transition-all ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-[#dde3ea] text-gray-700'} ${!sidebarOpen ? 'w-10 h-10 px-0 justify-center' : 'w-[140px]'}`}><Plus size={22} />{sidebarOpen && <span className="text-sm font-semibold">New chat</span>}</button></div>
        <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
          {sidebarOpen && <div className={`text-[11px] font-bold mb-3 px-3 uppercase tracking-widest opacity-40`}>Recent Logs</div>}
          {sortedChats.map(c => (
            <div key={c.id} onClick={() => { setActiveChatId(c.id); if (window.innerWidth < 1024) setSidebarOpen(false); }} className={`group flex items-center gap-3 p-2.5 rounded-full cursor-pointer relative mb-1 ${activeChatId === c.id ? theme.active : theme.hover}`}>
              {c.isPinned ? <Pin size={16} className="text-blue-500" /> : <MessageSquare size={18} className={theme.muted} />}
              {sidebarOpen && (
                editingChatId === c.id ? 
                <input autoFocus className="bg-transparent border-none outline-none text-sm w-full" value={editingTitle} onChange={e => setEditingTitle(e.target.value)} onBlur={() => { if(editingTitle.trim()) setChats(prev => prev.map(x => x.id === c.id ? {...x, title: editingTitle} : x)); setEditingChatId(null); }} /> :
                <span className="text-sm truncate pr-2 flex-1 font-medium">{c.title}</span>
              )}
              {sidebarOpen && <div className="opacity-0 group-hover:opacity-100 flex gap-1"><button onClick={e => { e.stopPropagation(); setEditingChatId(c.id); setEditingTitle(c.title); }}><Edit2 size={12}/></button><button onClick={e => { e.stopPropagation(); setChats(prev => prev.filter(x => x.id !== c.id)); }}><Trash2 size={12}/></button></div>}
            </div>
          ))}
        </div>
        <div className="p-4 space-y-1 border-t border-black/5 dark:border-white/5"><button onClick={() => setShowSettings(true)} className={`flex items-center gap-3 p-3 w-full rounded-full ${theme.hover} text-sm ${theme.muted} ${!sidebarOpen && 'justify-center'}`}><Settings size={18} />{sidebarOpen && <span>Settings</span>}</button></div>
      </aside>

      <main className={`flex-1 flex flex-col relative transition-all duration-300 ${sidebarOpen ? 'md:ml-[300px]' : 'md:ml-[68px]'}`}>
        <header className={`p-4 h-20 flex justify-between items-center sticky top-0 z-30 ${theme.bg}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`md:hidden ${theme.muted}`}><Menu size={24} /></button>
            <div className={`flex items-center gap-1 p-1 rounded-2xl ${theme.inputBg} border ${theme.border}`}>
              {NAL1_MODELS.map(m => (
                <button key={m.id} onClick={() => setModel(m.id)} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${model === m.id ? (isDark ? 'bg-white text-black' : 'bg-black text-white shadow-sm') : theme.muted}`}>{m.name.split(' ')[1]}</button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-4 pb-48 scrollbar-none">
          {!activeChatId || messages.length === 0 ? (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 md:px-20 max-w-[1200px] mx-auto w-full animate-in">
              <div className="w-full mb-16 px-2 text-left">
                <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight py-4 leading-[1.2]">
                  <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent pb-4 block">Hello, User.</span>
                </h1>
                <h2 className={`text-4xl md:text-6xl font-semibold opacity-20 ${isDark ? 'text-white' : 'text-gray-400'} leading-tight`}>How can I help you today?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <SuggestionCard text="สร้างภาพวิวภูเขาไฟฟูจิสไตล์สีน้ำ" icon={<ImageIcon size={20} className="text-blue-500" />} onClick={handleSend} isDark={isDark} />
                <SuggestionCard text="เขียนโค้ด Python สำหรับคำนวณภาษี" icon={<Code size={20} className="text-orange-500" />} onClick={handleSend} isDark={isDark} />
                <SuggestionCard text="สรุปข่าวเทคโนโลยีล่าสุดสั้นๆ" icon={<Sparkles size={20} className="text-purple-500" />} onClick={handleSend} isDark={isDark} />
                <SuggestionCard text="วางแผนการเรียนภาษาอังกฤษใน 3 เดือน" icon={<PenTool size={20} className="text-red-500" />} onClick={handleSend} isDark={isDark} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10 py-6 px-4 md:px-16 lg:px-48 max-w-[1200px] mx-auto w-full animate-in">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-4 md:gap-8 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#d96570] flex items-center justify-center text-white shadow-md"><Bot size={18} /></div>}
                   <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.sender === 'user' ? <div className={`py-3 px-6 rounded-[28px] text-[16px] shadow-sm ${isDark ? 'bg-[#28292a] text-white border border-white/5' : 'bg-[#f0f4f9] text-gray-800'}`}><MessageContent text={msg.text} attachments={msg.attachments} isDark={isDark} /></div> : <div className="w-full"><MessageContent text={msg.text} isDark={isDark} /></div>}
                   </div>
                   {msg.sender === 'user' && <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3c4043]' : 'bg-[#e0e0e0]'}`}><User size={16} className={isDark ? 'text-white' : 'text-gray-600'} /></div>}
                </div>
              ))}
              {isTyping && <div className="flex gap-4 md:gap-8 animate-pulse"><div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#d96570] flex items-center justify-center text-white shadow-md"><RefreshCw size={18} className="animate-spin" /></div><div className="flex flex-col gap-2.5 w-full max-w-[500px] mt-2 opacity-30 font-mono text-[10px] tracking-widest">NEURAL_SYNC_ACTIVE...</div></div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className={`p-4 md:p-6 w-full max-w-[900px] mx-auto ${theme.bg} sticky bottom-0 z-30`}>
          <div className={`relative flex flex-col rounded-[32px] transition-all duration-300 ${theme.inputBg} border border-transparent focus-within:ring-1 focus-within:ring-blue-500/30 shadow-lg`}>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 pt-4 pb-2">
                {attachments.map((f, i) => (
                  <div key={i} className={`relative group p-2 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#28292a] border-[#444]' : 'bg-white border-gray-100'}`}>
                    {f.type.startsWith('image/') ? <img src={f.dataUrl} className="w-8 h-8 rounded object-cover" alt="" /> : <FileText size={16} className="text-blue-500" />}
                    <span className="text-[10px] max-w-[80px] truncate">{f.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 text-red-500"><XCircle size={14} fill="white" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 pt-3.5 flex items-center gap-2">
               <button onClick={() => fileInputRef.current.click()} className={`p-2 rounded-full ${theme.hover} ${theme.muted}`} title="Attach"><Paperclip size={20} /></button>
               <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFile} />
               <button onClick={() => setShowModeSelector(!showModeSelector)} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full transition-all ${isDark ? 'bg-[#3c4043] text-gray-300' : 'bg-white text-gray-600 shadow-sm border border-gray-100'}`}>
                 {NAL1_MODES.find(m => m.id === mode)?.icon}
                 <span className="hidden sm:inline">{NAL1_MODES.find(m => m.id === mode)?.name}</span>
                 <ChevronDown size={14} className={showModeSelector ? 'rotate-180 transition-transform' : ''} />
               </button>
               {showModeSelector && (
                 <div className={`absolute bottom-full left-5 mb-4 w-64 rounded-[28px] shadow-2xl border p-2 z-50 animate-in ${isDark ? 'bg-[#1e1f20] border-[#333]' : 'bg-white border-gray-100'}`}>
                   {NAL1_MODES.map(m => (
                     <button key={m.id} onClick={() => { setMode(m.id); setShowModeSelector(false); }} className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm rounded-full transition-all mb-1 ${mode === m.id ? 'bg-[#e9eff6] text-blue-600 dark:bg-[#3c4043]' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'}`}><span className={mode === m.id ? 'text-blue-500' : ''}>{m.icon}</span><span className="font-semibold flex-1 text-left">{m.name}</span>{mode === m.id && <Check size={16} />}</button>
                   ))}
                 </div>
               )}
            </div>
            <div className="flex items-end gap-2 pr-4 pb-2">
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder={mode === 'image' ? "Describe the image..." : "Enter a prompt here"} className="flex-1 bg-transparent border-none outline-none resize-none px-6 py-4 text-[16px] leading-relaxed placeholder-gray-500" rows={1} />
              <button onClick={() => handleSend()} disabled={(!input.trim() && attachments.length === 0) || isTyping} className={`mb-2 p-3 rounded-full transition-all ${input.trim() || attachments.length > 0 ? 'text-blue-500' : 'opacity-20'}`}><SendHorizontal size={24} /></button>
            </div>
          </div>
          <p className="text-center mt-3 text-[11px] opacity-40 font-medium">Nal1 Intelligence Node • v2.2 Private Bypass</p>
        </div>

        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
            <div className={`w-full max-w-xl rounded-[32px] p-8 shadow-2xl relative border ${isDark ? 'bg-[#1e1e20] text-white border-[#333]' : 'bg-white text-gray-800 border-gray-100'}`}>
              <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"><X size={20} /></button>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-blue-500"><Settings /> Nal1 Settings</h2>
              <div className="space-y-8">
                <div><label className="text-[11px] font-bold uppercase tracking-widest opacity-40 mb-4 block">Engine</label>
                  <div className="grid grid-cols-1 gap-2">
                    {NAL1_MODELS.map(m => (
                      <button key={m.id} onClick={() => setModel(m.id)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${model === m.id ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500' : 'border-black/5 dark:border-white/5'}`}><div className="text-left font-bold text-sm">{m.name}</div>{model === m.id && <Check size={18} className="text-blue-500" />}</button>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-black/5 flex justify-between items-center"><div className="flex items-center gap-3 text-red-500"><Trash2 size={18} /><span className="text-sm font-bold">Clear History</span></div><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 bg-red-500 text-white text-[11px] font-bold rounded-full">RESET</button></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
