import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  SendHorizontal, User, Bot, Menu, Plus, Image as ImageIcon, 
  Code, Sparkles, Sun, Moon, Zap, Terminal, PenTool, Layout, 
  Settings, History, HelpCircle, X, ChevronDown, Check, Trash2, 
  MessageSquare, Info, MoreVertical, Shield, Globe, Cpu, Monitor,
  Pin, PinOff, Edit2, Paperclip, FileText, Download
} from 'lucide-react';

// --- NAL1 CONFIGURATION ---
const NAL1_MODELS = [
  { id: 'openai', name: 'Nal1 Ultra', desc: 'Powerful for complex reasoning and creative tasks.', icon: <Sparkles size={16} className="text-purple-500" /> },
  { id: 'qwen', name: 'Nal1 Architect', desc: 'Optimized for high-speed coding and technical logic.', icon: <Terminal size={16} className="text-blue-500" /> },
  { id: 'mistral', name: 'Nal1 Lite', desc: 'Fast, efficient, and great for daily brief tasks.', icon: <Zap size={16} className="text-orange-500" /> },
];

const NAL1_MODES = [
  { id: 'standard', name: 'Standard', icon: <Sparkles size={18} />, prompt: "Be helpful, clear, and concise." },
  { id: 'analyst', name: 'Analyst', icon: <Zap size={18} />, prompt: "Mode: Analyst. Be logical, structured, and data-driven." },
  { id: 'savage', name: 'Savage', icon: <Terminal size={18} />, prompt: "Mode: Savage. Be direct, brutally honest, and sharp." },
  { id: 'teacher', name: 'Teacher', icon: <PenTool size={18} />, prompt: "Mode: Teacher. Explain clearly with analogies." },
  { id: 'image', name: 'Nal1 Vision', icon: <ImageIcon size={18} />, prompt: "IMAGE_GENERATION_MODE" }, 
];

// --- STORAGE UTILS ---
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to storage", e);
  }
};

const getFromStorage = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

// --- UI COMPONENTS ---

const CodeBlock = ({ language, code, isDark }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`my-4 rounded-2xl overflow-hidden font-mono text-sm border ${isDark ? 'border-[#333] bg-[#000]' : 'border-gray-200 bg-[#f8f9fa]'}`}>
      <div className={`px-4 py-2.5 text-xs uppercase flex justify-between items-center border-b ${isDark ? 'border-[#333] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
        <span className="font-bold tracking-wider">{language || 'code'}</span>
        <button onClick={handleCopy} className="hover:text-blue-500 transition-colors uppercase font-bold text-[10px]">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-5 overflow-x-auto">
        <pre className={isDark ? 'text-gray-300' : 'text-gray-800'}><code>{code}</code></pre>
      </div>
    </div>
  );
};

const ImageResult = ({ url, prompt }) => (
  <div className="mt-4 max-w-full rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-700">
    <img src={url} alt={prompt} className="w-full h-auto object-cover bg-gray-100 dark:bg-gray-900 min-h-[300px]" />
    <div className="p-4 bg-white dark:bg-[#1e1e1e] text-xs opacity-60 italic border-t border-inherit">
      Prompt: {prompt}
    </div>
  </div>
);

const MessageContent = ({ text, attachments, isDark }) => {
  const contentText = typeof text === 'string' ? text : JSON.stringify(text);

  if (contentText.startsWith('NAL1_IMG:')) {
    const parts = contentText.split('|');
    const url = parts[0].replace('NAL1_IMG:', '');
    const prompt = parts[1] || '';
    return <ImageResult url={url} prompt={prompt} />;
  }

  const codeBlockRegex = /```(\w*)\s*([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(contentText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: contentText.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1], content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  
  if (lastIndex < contentText.length) {
    parts.push({ type: 'text', content: contentText.substring(lastIndex) });
  }

  return (
    <div className="space-y-4">
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, idx) => (
            <div key={idx} className={`flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'bg-[#1e1f20] border-[#333]' : 'bg-[#f0f4f9] border-gray-200'}`}>
              {file.type.startsWith('image/') ? (
                <img src={file.dataUrl} className="w-10 h-10 rounded object-cover shadow-sm" alt="attached" />
              ) : (
                <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <FileText size={20} />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate max-w-[120px]">{file.name}</span>
                <span className="text-[10px] opacity-50 uppercase">{file.type.split('/')[1] || 'FILE'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {parts.map((part, index) => (
        part.type === 'code' 
          ? <CodeBlock key={index} language={part.language} code={part.content} isDark={isDark} />
          : <div key={index} className={`whitespace-pre-wrap leading-7 text-[16px] sm:text-[17px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {part.content.split(/(\*\*.*?\*\*)/g).map((subPart, i) => 
                subPart.startsWith('**') && subPart.endsWith('**') 
                  ? <strong key={i} className={isDark ? "text-white font-bold" : "text-black font-bold"}>{subPart.replace(/\*\*/g, '')}</strong> 
                  : subPart
              )}
            </div>
      ))}
    </div>
  );
};

const SuggestionCard = ({ text, icon, onClick, isDark }) => (
  <button 
    onClick={() => onClick(text)}
    className={`text-left p-6 rounded-[24px] transition-all duration-300 min-h-[180px] flex flex-col justify-between group border border-transparent shadow-sm
      ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] text-gray-200' : 'bg-[#f0f4f9] hover:bg-[#e9eef6] text-gray-700'}`}
  >
    <span className="text-[14px] md:text-[15px] font-medium leading-relaxed opacity-90">{text}</span>
    <div className={`p-3 rounded-full w-fit ${isDark ? 'bg-[#131314]' : 'bg-white'} group-hover:scale-110 transition-transform shadow-md`}>
      {icon}
    </div>
  </button>
);

// --- BRAIN LOGIC ---
class Nal1Brain {
  constructor() {
    this.textApiUrl = 'https://text.pollinations.ai/'; 
  }

  async process(input, modelId, modeId, attachments = []) {
    if (!input.trim() && attachments.length === 0) return null;

    if (modeId === 'image') {
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(input)}?seed=${seed}&width=1024&height=1024&nologo=true&model=flux`;
      await new Promise(r => setTimeout(r, 2000));
      return `NAL1_IMG:${imageUrl}|${input}`;
    }

    const selectedMode = NAL1_MODES.find(m => m.id === modeId);
    
    // Construct Attachment Context
    let attachmentCtx = "";
    if (attachments.length > 0) {
      attachmentCtx = `\n\n[USER ATTACHED FILES: ${attachments.map(a => `${a.name} (${a.type})`).join(', ')}]. Please acknowledge these files in your analysis.`;
    }

    const systemPrompt = `You are Nal1 (Neural Adaptive Logic 1), a helpful AI assistant. Respond in Thai. Current mode: ${selectedMode?.name}. Instructions: ${selectedMode?.prompt}. Output formatted in Markdown.${attachmentCtx}`;
    
    try {
      const response = await fetch(`${this.textApiUrl}${encodeURIComponent(systemPrompt + "\nUser: " + input)}?model=${modelId}`);
      if (!response.ok) throw new Error();
      return await response.text();
    } catch (e) {
      return "ขออภัยครับ ระบบประมวลผลขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง";
    }
  }
}

// --- MAIN APP COMPONENT ---

export default function Nal1Gemini() {
  const [chats, setChats] = useState(() => getFromStorage('nal1_chats_v3', []));
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem('nal1_active_chat') || null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('nal1_theme') === 'dark');
  const [model, setModel] = useState(() => localStorage.getItem('nal1_model') || 'openai');
  const [mode, setMode] = useState(() => localStorage.getItem('nal1_mode') || 'standard');
  
  // UI States
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const brain = useRef(new Nal1Brain());
  const menuRef = useRef(null);

  // Sorting
  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [chats]);

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  // Sync to Storage
  useEffect(() => {
    saveToStorage('nal1_chats_v3', chats);
    if (activeChatId) localStorage.setItem('nal1_active_chat', activeChatId);
    localStorage.setItem('nal1_theme', isDark ? 'dark' : 'light');
    localStorage.setItem('nal1_model', model);
    localStorage.setItem('nal1_mode', mode);
  }, [chats, activeChatId, isDark, model, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 250) + 'px';
    }
  }, [input]);

  // Handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
    // Clear input
    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      isPinned: false,
      timestamp: new Date().toISOString()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput('');
    setAttachments([]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSend = async (customInput = null) => {
    const prompt = (customInput || input).trim();
    if ((!prompt && attachments.length === 0) || isTyping) return;

    let currentId = activeChatId;
    if (!currentId) {
      const newChat = { 
        id: Date.now().toString(), 
        title: prompt ? prompt.substring(0, 40) : 'New Chat (Files)', 
        messages: [], 
        isPinned: false,
        timestamp: new Date().toISOString() 
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      currentId = newChat.id;
    }

    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);

    const userMsg = { 
      id: Date.now().toString(), 
      text: prompt, 
      sender: 'user', 
      attachments: currentAttachments,
      timestamp: new Date() 
    };

    setChats(prev => prev.map(c => c.id === currentId ? { 
      ...c, 
      title: c.messages.length === 0 ? (prompt ? prompt.substring(0, 40) : 'File Analysis') : c.title, 
      messages: [...c.messages, userMsg],
      timestamp: new Date().toISOString()
    } : c));

    setIsTyping(true);
    const responseText = await brain.current.process(prompt, model, mode, currentAttachments);
    
    if (responseText) {
      const botMsg = { id: (Date.now() + 1).toString(), text: responseText, sender: 'bot', timestamp: new Date() };
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
    active: isDark ? 'bg-[#28292a] text-white shadow-sm' : 'bg-[#dde3ea] text-gray-900 shadow-sm',
    hover: isDark ? 'hover:bg-[#28292a]' : 'hover:bg-[#e9eef6]',
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-all duration-300 ${theme.bg} ${theme.text}`} style={{ fontFamily: "'Inter', 'Noto Sans Thai', sans-serif" }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 10px; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        textarea { field-sizing: content; }
        .animate-in { animation: animate-in 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes animate-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${theme.sidebar} 
        ${sidebarOpen ? 'w-[300px] translate-x-0' : 'w-0 -translate-x-full md:w-[68px] md:translate-x-0'} flex flex-col`}>
        
        <div className="p-4 h-16 flex items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 ${theme.muted}`}>
            <Menu size={20} />
          </button>
        </div>

        <div className="px-4 py-2 mt-2 mb-6">
           <button 
             onClick={createNewChat}
             className={`flex items-center gap-3 p-3.5 rounded-full transition-all shadow-sm
               ${isDark ? 'bg-[#1a1a1a] text-gray-300 hover:bg-[#2c2c2c]' : 'bg-[#dde3ea] text-gray-700 hover:bg-[#ced4da]'}
               ${!sidebarOpen ? 'w-10 h-10 px-0 justify-center' : 'w-[140px]'}`}
           >
             <Plus size={22} />
             {sidebarOpen && <span className="text-sm font-semibold">New chat</span>}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
          {sidebarOpen && <div className={`text-[12px] font-bold mb-3 px-3 uppercase tracking-widest opacity-40`}>Recent</div>}
          {sortedChats.map((chat) => (
             <div 
                key={chat.id} 
                onClick={() => { if (editingChatId !== chat.id) { setActiveChatId(chat.id); if (window.innerWidth < 1024) setSidebarOpen(false); } }}
                className={`group flex items-center gap-3 p-2.5 rounded-full cursor-pointer transition-all relative mb-1
                  ${activeChatId === chat.id ? theme.active : theme.hover} 
                  ${!sidebarOpen ? 'justify-center' : ''}`}
             >
               {chat.isPinned ? <Pin size={16} className="shrink-0 text-blue-500" /> : <MessageSquare size={18} className={`shrink-0 ${activeChatId === chat.id ? 'text-blue-500' : theme.muted}`} />}
               {sidebarOpen && (
                 <div className="flex-1 overflow-hidden flex items-center">
                   {editingChatId === chat.id ? (
                     <input autoFocus className="bg-transparent border-none outline-none text-sm w-full font-medium" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onBlur={() => { if (editingTitle.trim()) setChats(prev => prev.map(c => c.id === editingChatId ? { ...c, title: editingTitle.trim() } : c)); setEditingChatId(null); }} />
                   ) : <span className="text-sm truncate pr-2 font-medium">{chat.title}</span>}
                 </div>
               )}
               {sidebarOpen && editingChatId !== chat.id && (
                 <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat.id ? null : chat.id); }} className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-full transition-opacity ${theme.hover}`}>
                   <MoreVertical size={14} />
                 </button>
               )}
             </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col relative transition-all duration-300 ${sidebarOpen ? 'md:ml-[300px]' : 'md:ml-[68px]'}`}>
        <header className={`p-4 h-20 flex justify-between items-center sticky top-0 z-30 ${theme.bg}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`md:hidden ${theme.muted}`}><Menu size={24} /></button>
            <div className={`flex items-center gap-1 p-1 rounded-2xl ${theme.inputBg} border ${theme.border}`}>
              {NAL1_MODELS.map(m => (
                <button key={m.id} onClick={() => setModel(m.id)} className={`px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${model === m.id ? (isDark ? 'bg-white text-black' : 'bg-white text-black shadow-sm') : theme.muted}`}>{m.name.split(' ')[1]}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className={`${theme.muted}`}><Settings size={22} /></button>
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
                <SuggestionCard text="วิเคราะห์ไฟล์รูปภาพที่ฉันแนบ" icon={<ImageIcon size={20} className="text-blue-500" />} onClick={handleSend} isDark={isDark} />
                <SuggestionCard text="เขียนโค้ด Python สำหรับประมวลผลข้อมูล" icon={<Code size={20} className="text-orange-500" />} onClick={handleSend} isDark={isDark} />
                <SuggestionCard text="สร้างภาพวิวเมืองไซเบอร์พังก์" icon={<Sparkles size={20} className="text-purple-500" />} onClick={handleSend} isDark={isDark} />
                <SuggestionCard text="ช่วยสรุปใจความสำคัญจากไฟล์เอกสาร" icon={<PenTool size={20} className="text-red-500" />} onClick={handleSend} isDark={isDark} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10 py-6 px-4 md:px-16 lg:px-48 max-w-[1200px] mx-auto w-full">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 md:gap-8 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#d96570] flex items-center justify-center text-white shadow-md animate-in"><Sparkles size={18} /></div>}
                   <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.sender === 'user' ? (
                        <div className={`py-3 px-6 rounded-[28px] text-[16px] ${isDark ? 'bg-[#28292a] text-white border border-white/5' : 'bg-[#f0f4f9] text-gray-800'}`}>
                          <MessageContent text={msg.text} attachments={msg.attachments} isDark={isDark} />
                        </div>
                      ) : <div className="w-full"><MessageContent text={msg.text} isDark={isDark} /></div>}
                   </div>
                   {msg.sender === 'user' && <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3c4043]' : 'bg-[#e0e0e0]'}`}><User size={16} className={isDark ? 'text-white' : 'text-gray-600'} /></div>}
                </div>
              ))}
              {isTyping && <div className="flex gap-4 md:gap-8 animate-in"><div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#d96570] flex items-center justify-center animate-pulse shadow-md"><Sparkles size={18} className="text-white" /></div><div className="flex flex-col gap-2.5 w-full max-w-[500px] mt-2"><div className={`h-4 rounded-full animate-pulse ${isDark ? 'bg-white/5' : 'bg-black/5'}`}></div><div className={`h-4 w-3/4 rounded-full animate-pulse ${isDark ? 'bg-white/5' : 'bg-black/5'}`}></div></div></div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Bar */}
        <div className={`p-4 md:p-6 w-full max-w-[900px] mx-auto ${theme.bg} sticky bottom-0 z-30`}>
          <div className={`relative flex flex-col rounded-[32px] transition-all duration-300 ${theme.inputBg} border border-transparent focus-within:ring-1 focus-within:ring-blue-500/30 shadow-lg`}>
            
            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 pt-4 pb-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className={`relative group p-2 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#28292a] border-[#444]' : 'bg-white border-gray-100'}`}>
                    {file.type.startsWith('image/') ? (
                      <img src={file.dataUrl} className="w-8 h-8 rounded object-cover" />
                    ) : <FileText size={16} className="text-blue-500" />}
                    <span className="text-[10px] max-w-[80px] truncate">{file.name}</span>
                    <button onClick={() => removeAttachment(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 pt-3.5 flex items-center gap-2">
               <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`} title="Attach Files">
                 <Plus size={20} />
               </button>
               <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
               
               <button onClick={() => setShowModeSelector(!showModeSelector)} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full transition-all ${isDark ? 'bg-[#3c4043] text-gray-300' : 'bg-white text-gray-600 shadow-sm border border-gray-100'}`}>
                 {NAL1_MODES.find(m => m.id === mode)?.icon}
                 <span className="hidden sm:inline">{NAL1_MODES.find(m => m.id === mode)?.name}</span>
                 <ChevronDown size={14} className={showModeSelector ? 'rotate-180 transition-transform' : 'transition-transform'} />
               </button>
               
               {showModeSelector && (
                 <div className={`absolute bottom-full left-5 mb-4 w-64 rounded-[28px] shadow-2xl border p-2 z-50 animate-in ${isDark ? 'bg-[#1e1f20] border-[#333]' : 'bg-white border-gray-100'}`}>
                   {NAL1_MODES.map(m => (
                     <button key={m.id} onClick={() => { setMode(m.id); setShowModeSelector(false); }} className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm rounded-full transition-all mb-1 ${mode === m.id ? 'bg-[#e9eff6] text-blue-600 dark:bg-[#3c4043] dark:text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'}`}><span className={mode === m.id ? 'text-blue-500' : ''}>{m.icon}</span><span className="font-semibold flex-1 text-left">{m.name}</span>{mode === m.id && <Check size={16} />}</button>
                   ))}
                 </div>
               )}
            </div>

            <div className="flex items-end gap-2 pr-4 pb-2">
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder={mode === 'image' ? "อธิบายรูปภาพ..." : "พิมพ์ข้อความหรือแนบไฟล์ที่นี่..."} className="flex-1 bg-transparent border-none outline-none resize-none px-6 py-4 text-[16px] leading-relaxed placeholder-gray-500" rows={1} />
              <button onClick={() => handleSend()} disabled={(!input.trim() && attachments.length === 0) || isTyping} className={`mb-2 p-3 rounded-full transition-all ${input.trim() || attachments.length > 0 ? 'text-blue-500' : 'opacity-20 cursor-not-allowed'}`}><SendHorizontal size={24} /></button>
            </div>
          </div>
          <p className="text-center mt-3 text-[11px] opacity-40 font-medium">Nal1 may display inaccurate info. Attachment analysis is simulated locally.</p>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in">
            <div className={`w-full h-full md:h-auto md:max-w-4xl md:rounded-[28px] shadow-2xl overflow-hidden flex flex-col md:flex-row border ${isDark ? 'bg-[#1e1f20] border-[#333]' : 'bg-white border-gray-100'}`}>
              <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r p-4 ${isDark ? 'border-[#333] bg-[#1e1f20]' : 'border-gray-100 bg-[#f8f9fa]'}`}>
                <div className="flex justify-between items-center mb-6 md:mb-8 px-2"><h2 className="text-xl font-medium">Settings</h2><button onClick={() => setShowSettings(false)} className="md:hidden p-2"><X size={20} /></button></div>
                <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">{[{ id: 'general', name: 'General', icon: <Monitor size={18} /> }, { id: 'models', name: 'Extensions', icon: <Cpu size={18} /> }, { id: 'privacy', name: 'Privacy', icon: <Shield size={18} /> }].map(tab => <button key={tab.id} onClick={() => setSettingsTab(tab.id)} className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${settingsTab === tab.id ? (isDark ? 'bg-[#3c4043] text-white' : 'bg-[#e9eef6] text-blue-600') : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'}`}>{tab.icon}{tab.name}</button>)}</div>
              </div>
              <div className="flex-1 p-6 md:p-10 overflow-y-auto relative">
                <button onClick={() => setShowSettings(false)} className="hidden md:block absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><X size={20} /></button>
                {settingsTab === 'general' && <div className="space-y-8 animate-in"><div><h3 className="text-lg font-medium mb-4">Appearance</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button onClick={() => setIsDark(false)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${!isDark ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500' : theme.border}`}><div className="flex items-center gap-3"><Sun size={18} /> Light</div>{!isDark && <Check size={18} className="text-blue-500" />}</button><button onClick={() => setIsDark(true)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isDark ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500' : theme.border}`}><div className="flex items-center gap-3"><Moon size={18} /> Dark</div>{isDark && <Check size={18} className="text-blue-500" />}</button></div></div></div>}
                {settingsTab === 'models' && <div className="space-y-6 animate-in"><div><h3 className="text-lg font-medium mb-4">Neural Engines</h3><div className="grid grid-cols-1 gap-2">{NAL1_MODELS.map(m => <button key={m.id} onClick={() => setModel(m.id)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${model === m.id ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500' : theme.border}`}><div className="text-left"><div className="font-bold text-sm">{m.name}</div><div className="text-[11px] opacity-50 mt-1">{m.desc}</div></div>{model === m.id && <Check size={18} className="text-blue-500" />}</button>)}</div></div></div>}
                {settingsTab === 'privacy' && <div className="space-y-8 animate-in"><div className="flex items-center justify-between p-5 bg-red-500/5 rounded-2xl border border-red-500/10"><div><div className="text-sm font-bold text-red-500">Clear All History</div><div className="text-[11px] opacity-60">Permanently delete all logs.</div></div><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-5 py-2 bg-red-500 text-white text-[11px] font-bold rounded-full hover:bg-red-600">RESET</button></div></div>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
