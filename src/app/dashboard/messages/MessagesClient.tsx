"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Lock, Loader2 } from "lucide-react";
import { getConversation, sendMessage } from "@/app/actions/messages";
import { format } from "date-fns";

type User = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  unreadCount?: number;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
};

export default function MessagesClient({ contacts, currentUserId }: { contacts: User[], currentUserId: string }) {
  const [activeContact, setActiveContact] = useState<User | null>(contacts[0] || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation when active contact changes
  useEffect(() => {
    if (!activeContact) return;
    let isMounted = true;
    
    const fetchChat = async () => {
      setLoadingChat(true);
      const chat = await getConversation(activeContact.id);
      if (isMounted) {
        setMessages(chat);
        setLoadingChat(false);
        setTimeout(scrollToBottom, 100);
      }
    };
    
    fetchChat();
    
    return () => { isMounted = false; };
  }, [activeContact?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activeContact) return;
    
    setSending(true);
    const content = inputText;
    setInputText(""); // optimistic UI clear
    
    const res = await sendMessage(activeContact.id, content);
    
    if (res.success) {
      // Refresh chat
      const chat = await getConversation(activeContact.id);
      setMessages(chat);
      setTimeout(scrollToBottom, 100);
    } else {
      setInputText(content); // revert
      alert("Failed to send message: " + res.error);
    }
    
    setSending(false);
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[600px] items-center justify-center p-8 text-center">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Active Connections</h2>
        <p className="text-gray-500 max-w-md">
          Once you are enrolled in a collaborative research program, you will be able to message your class peers and mentors here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row h-[700px] overflow-hidden">
      
      {/* Contact List Menu */}
      <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 tracking-tight text-lg">Connections</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`p-4 border-b border-gray-50 cursor-pointer transition-all ${activeContact?.id === contact.id ? 'bg-gray-100 shadow-inner' : 'hover:bg-gray-50/80'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 pr-2">
                  <div className={`h-11 w-11 rounded-full flex shrink-0 items-center justify-center font-bold text-lg mr-3 shadow-sm ${contact.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-white text-gray-600 border border-gray-200'}`}>
                    {contact.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{contact.name}</p>
                    <p className={`text-xs mt-1 font-medium truncate flex items-center ${contact.role === 'ADMIN' ? 'text-rose-600' : 'text-gray-500'}`}>
                      {contact.role === "ADMIN" ? "CRI Support" : "Class Peer"}
                    </p>
                  </div>
                </div>
                {contact.unreadCount && contact.unreadCount > 0 ? (
                  <div className="h-5 min-w-[20px] rounded-full bg-red-500 text-white flex items-center justify-center text-[11px] font-bold px-1.5 shrink-0 shadow-sm animate-in zoom-in">
                    {contact.unreadCount}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="w-full md:w-2/3 flex flex-col bg-gray-50/30 relative">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 shadow-sm z-10">
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 md:hidden ${activeContact.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                  {activeContact.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{activeContact.name}</h3>
                  <p className={`text-xs font-semibold ${activeContact.role === 'ADMIN' ? 'text-rose-500' : 'text-blue-600'}`}>
                    {activeContact.role === "ADMIN" ? "System Administrator" : "Enrolled Peer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingChat ? (
                <div className="flex h-full items-center justify-center">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-center px-4">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-sm">
                      <p className="text-gray-500 font-medium text-sm">
                        Say hello to {activeContact.name}! Your messages are securely transmitted and instantly available.
                      </p>
                   </div>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      {!isMe && (
                         <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs mr-3 self-end mb-1 ${activeContact.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-gray-200 text-gray-600'}`}>
                           {activeContact.name?.charAt(0) || "U"}
                         </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div 
                          className={`p-4 rounded-2xl text-[15px] font-medium leading-relaxed shadow-sm
                            ${isMe 
                              ? 'bg-blue-600 text-white rounded-br-none border border-blue-700' 
                              : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                            }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 mt-2 px-1">
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Footer */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a secure message..." 
                  className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-5 py-3.5 text-sm font-medium outline-none transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={sending || !inputText.trim()}
                  className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all shrink-0 disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full items-center justify-center bg-gray-50">
             <p className="text-gray-400 font-medium">Select a contact to begin messaging.</p>
          </div>
        )}
      </div>

    </div>
  );
}
