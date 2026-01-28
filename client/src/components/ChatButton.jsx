import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';


export default function ChatFab() {
    const [isOpen, setIsOpen] = useState(false);

    const { pathname } = useLocation()

    if (pathname.includes('chat')) {
        return (
            <></>
        )
    }


    return (
        <>
            {/* FAB Button */}
            <Link to="/chat">
                <div className="fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="group relative w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-out flex items-center justify-center"
                        aria-label="Chat with AI"
                    >
                        {/* Animated background pulse */}
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-pulse opacity-20"></div>

                        {/* Chat Icon */}
                        <svg
                            className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            Chat with AI
                            <div className="absolute top-full right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                        </div>
                    </button>
                </div>
            </Link>

            {/* Optional: Animated notification badge */}
            <div className="fixed bottom-24 right-6 z-40">
                <div className="animate-bounce bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    1
                </div>
            </div>
        </>
    );
}
