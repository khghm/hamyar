import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  time: string;
}

export default function SupportChat() {
  const { darkMode, currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'سلام! به پشتیبانی کافی نت همیار خوش آمدید. چطور می‌توانم کمکتان کنم؟', sender: 'support', time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');

  const autoReplies: Record<string, string> = {
    'سلام': 'سلام! خوش آمدید. چطور می‌توانم کمکتان کنم؟',
    'قیمت': 'برای اطلاع از قیمت‌ها می‌توانید به بخش خدمات یا فروشگاه مراجعه کنید. همچنین می‌توانید با شماره 09913911880 تماس بگیرید.',
    'سفارش': 'برای پیگیری سفارش، کد رهگیری خود را در بخش پیگیری سفارش وارد کنید.',
    'آدرس': 'آدرس ما در سایت موجود است. برای اطلاعات بیشتر با شماره 09913911880 تماس بگیرید.',
    'ساعت کاری': 'ساعات کاری ما: شنبه تا پنج‌شنبه ۹ صبح تا ۹ شب، جمعه ۱۰ صبح تا ۲ بعدازظهر.',
    'تخفیف': 'برای اطلاع از تخفیف‌های ویژه، بخش اخبار سایت را دنبال کنید.',
    'پرداخت': 'پرداخت به صورت حضوری یا کارت به کارت امکان‌پذیر است. برای اطلاعات بیشتر تماس بگیرید.',
  };

  const getAutoReply = (text: string): string => {
    for (const [key, reply] of Object.entries(autoReplies)) {
      if (text.includes(key)) return reply;
    }
    return 'پیام شما دریافت شد. کارشناسان ما در اسرع وقت پاسخ خواهند داد. برای پاسخ سریع‌تر با شماره 09913911880 تماس بگیرید.';
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, userMsg]);
    setInput('');

    // Auto reply after 1 second
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: getAutoReply(input),
        sender: 'support',
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center hover:scale-110"
        title="چت پشتیبانی"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}
      style={{ height: '500px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">پشتیبانی همیار</h3>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              آنلاین
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-white/20">
          <Minimize2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : darkMode ? 'bg-slate-700 text-slate-200 rounded-bl-sm' : 'bg-gray-100 text-slate-700 rounded-bl-sm'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className={`p-3 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
            placeholder="پیام خود را بنویسید..."
            className={`flex-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white placeholder-slate-400' : 'bg-gray-100 placeholder-gray-400'}`}
          />
          <button
            onClick={sendMessage}
            className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
          >
            <Send size={16} />
          </button>
        </div>
        <p className={`text-xs mt-2 text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          پاسخ‌دهی خودکار • برای پشتیبانی کامل: 09913911880
        </p>
      </div>
    </div>
  );
}
