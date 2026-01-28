
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '../features/chat/chatSlice';

export default function ChatPage() {

    const dispatch = useDispatch()


    const { chat, chatLoading, chatError, chatSuccess, chatErrorMessage } = useSelector(state => state.chat)

    const [messages, setMessages] = useState([
        {
            _id: 1,
            text: "Hello! I'm the IndoreMart Assistant. I can help you find products, locate shops, check prices, and answer questions about our services. What are you looking for today?",
            sender: 'ai',
            timestamp: new Date(),
        },
    ]);


    const handleChatHistory = (message) => {
        setMessages([...messages, message])
    }


    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();

        if (chatSuccess) {
            handleChatHistory({
                _id: crypto.randomUUID(),
                text: chat.message,
                sender: 'ai',
                timestamp: new Date(),
            })
        }

    }, [chatSuccess]);

    const handleSendMessage = (e) => {
        e.preventDefault()

        handleChatHistory({
            _id: crypto.randomUUID(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        })

        dispatch(sendMessage(inputValue))
        setInputValue("")
        scrollToBottom();
    };


    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="fixed top-14 w-full bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                            📦
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">IndoreMart Assistant</h1>
                            <p className="text-xs text-slate-500">Your personal shopping guide</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-24">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message._id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                            <div
                                className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg ${message.sender === 'user'
                                    ? 'bg-emerald-500 text-white rounded-br-none'
                                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{message.text}</p>
                                <p
                                    className={`text-xs mt-1.5 ${message.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                                        }`}
                                >
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {chatLoading && (
                        <p>Thinking....</p>
                    )}
                    {chatError && (
                        <p>{chatErrorMessage}</p>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 w-full bg-white border-t border-slate-200 px-4 py-4 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask me anything... e.g., 'Where can I find bread?'"
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                        />
                        <button
                            type='submit'
                            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all duration-200 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 min-w-fit"
                        >
                            <span>Send</span>
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9-9m0 0l-9-9m9 9H3"
                                />
                            </svg>
                        </button>
                    </form>
                    <p className="text-xs text-slate-500 mt-2">
                        💡 Try asking about products, stores, delivery times, or prices
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}