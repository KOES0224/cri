"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Send, Search, Users, ChevronDown, Check, Loader2 } from "lucide-react";
import { getConversation, sendMessage, sendGroupMessage } from "@/app/actions/messages";
import { formatKST } from "@/lib/formatKST";

type Program = {
  id: string;
  title: string;
};

type Enrollment = {
  program: {
    id: string;
    title: string;
  }
};

type User = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  email?: string | null;
  unreadCount?: number;
  enrollments?: Enrollment[];
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
};

export default function AdminMessagesClient({ contacts, currentUserId, programs }: { contacts: User[], currentUserId: string, programs: Program[] }) {
  const [activeContactIds, setActiveContactIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("ALL");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter the contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = (contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
                            (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCourse = selectedProgramId === "ALL" || 
                            (contact.enrollments && contact.enrollments.some(e => e.program.id === selectedProgramId));
      
      return matchesSearch && matchesCourse;
    });
  }, [contacts, searchQuery, selectedProgramId]);

  // Handle Loading Chat when exactly ONE contact is selected
  useEffect(() => {
    if (activeContactIds.length !== 1) {
      setMessages([]);
      return;
    }
    
    let isMounted = true;
    const fetchChat = async () => {
      setLoadingChat(true);
      const chat = await getConversation(activeContactIds[0]);
      if (isMounted) {
        setMessages(chat);
        setLoadingChat(false);
        setTimeout(scrollToBottom, 100);
      }
    };
    
    fetchChat();
    return () => { isMounted = false; };
  }, [activeContactIds]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputText.trim() || activeContactIds.length === 0) return;
    
    setSending(true);
    const content = inputText;
    setInputText("");
    
    if (activeContactIds.length === 1) {
      // Single send
      const res = await sendMessage(activeContactIds[0], content);
      if (res.success) {
        const chat = await getConversation(activeContactIds[0]);
        setMessages(chat);
        setTimeout(scrollToBottom, 100);
      } else {
        setInputText(content);
        alert("Failed to send message: " + (res.error || "Unknown error"));
      }
    } else {
      // Group send
      const res = await sendGroupMessage(activeContactIds, content);
      if (res.success) {
        alert(`Successfully broadcasted message to ${activeContactIds.length} users.`);
        setActiveContactIds([]); // clear selection after group blast? Actually, maybe keep it so they can send another.
      } else {
        setInputText(content);
        alert("Failed to send broadcast: " + (res.error || "Unknown error"));
      }
    }
    
    setSending(false);
  };

  const toggleContact = (id: string) => {
    setActiveContactIds(prev => {
      if (prev.includes(id)) return prev.filter(cId => cId !== id);
      return [...prev, id];
    });
  };

  const selectAllFiltered = () => {
    const ids = filteredContacts.map(c => c.id);
    setActiveContactIds(ids);
  };

  const isGroupMode = activeContactIds.length > 1;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row h-[750px] overflow-hidden">
      
      {/* Contact List Menu */}
      <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col overflow-hidden bg-white">
        
        {/* Filters Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <select 
              value={selectedProgramId} 
              onChange={e => setSelectedProgramId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="ALL">All Enrolled Courses</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center pt-2">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{filteredContacts.length} Contacts Found</span>
             <button onClick={selectAllFiltered} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center">
               <Check className="w-3 h-3 mr-1" /> Select All Filtered
             </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(contact => {
            const isSelected = activeContactIds.includes(contact.id);
            return (
              <div 
                key={contact.id}
                onClick={() => toggleContact(contact.id)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-all flex items-center ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/80'}`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                   {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                
                <div className="flex items-center min-w-0 pr-2 flex-1">
                  <div className={`h-10 w-10 rounded-full flex shrink-0 items-center justify-center font-bold text-sm mr-3 shadow-sm ${contact.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                    {contact.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{contact.name}</p>
                    <p className={`text-xs mt-0.5 font-medium truncate ${contact.role === 'ADMIN' ? 'text-rose-600' : 'text-gray-500'}`}>
                      {contact.role === "ADMIN" ? "Admin" : contact.email}
                    </p>
                  </div>
                </div>

                {contact.unreadCount && contact.unreadCount > 0 ? (
                  <div className="h-5 min-w-[20px] rounded-full bg-red-500 text-white flex items-center justify-center text-[11px] font-bold px-1.5 shrink-0 shadow-sm">
                    {contact.unreadCount}
                  </div>
                ) : null}
              </div>
            );
          })}
          {filteredContacts.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm font-medium">
              No contacts match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="w-full md:w-2/3 flex flex-col bg-gray-50/30 relative">
        {activeContactIds.length > 0 ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 shadow-sm z-10">
              <div className="flex items-center">
                {isGroupMode ? (
                   <>
                     <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                        <Users className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="font-bold text-gray-900 text-lg">Broadcast Message</h3>
                       <p className="text-xs font-semibold text-purple-600">{activeContactIds.length} Recipients Selected</p>
                     </div>
                   </>
                ) : (
                   <>
                     <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${contacts.find(c => c.id === activeContactIds[0])?.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                       {contacts.find(c => c.id === activeContactIds[0])?.name?.charAt(0) || "U"}
                     </div>
                     <div>
                       <h3 className="font-bold text-gray-900 text-lg">{contacts.find(c => c.id === activeContactIds[0])?.name}</h3>
                       <p className={`text-xs font-semibold ${contacts.find(c => c.id === activeContactIds[0])?.role === 'ADMIN' ? 'text-rose-500' : 'text-blue-600'}`}>
                         {contacts.find(c => c.id === activeContactIds[0])?.role === "ADMIN" ? "Administrator" : "Student / Parent"}
                       </p>
                     </div>
                   </>
                )}
              </div>
            </div>

            {/* Message Feed */}
            {isGroupMode ? (
               <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                  <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                     <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send className="w-8 h-8 ml-1" />
                     </div>
                     <h2 className="text-xl font-bold text-gray-900 mb-2">Group Broadcast Mode</h2>
                     <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        You are about to send a single message to {activeContactIds.length} recipients. The message will appear in each recipient's private inbox.
                     </p>
                  </div>
               </div>
            ) : (
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {loadingChat ? (
                   <div className="flex h-full items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                   </div>
                 ) : messages.length === 0 ? (
                   <div className="flex flex-col h-full items-center justify-center text-center px-4">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-sm">
                         <p className="text-gray-500 font-medium text-sm">
                           No message history yet. Say hello!
                         </p>
                      </div>
                   </div>
                 ) : (
                   messages.map(msg => {
                     const isMe = msg.senderId === currentUserId;
                     return (
                       <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                         {!isMe && (
                            <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex-shrink-0 flex items-center justify-center font-bold text-xs mr-3 self-end mb-1">
                              {contacts.find(c => c.id === activeContactIds[0])?.name?.charAt(0) || "U"}
                            </div>
                         )}
                         <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                           <div 
                             className={`p-4 rounded-3xl text-[15px] font-medium leading-relaxed shadow-sm
                               ${isMe 
                                 ? 'bg-blue-600 text-white rounded-br-none border border-blue-700' 
                                 : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                               }`}
                           >
                             {msg.content}
                           </div>
                           <span className="text-[11px] font-bold text-gray-400 mt-2 px-1">
                             {formatKST(new Date(msg.createdAt), 'h:mm a')}
                           </span>
                         </div>
                       </div>
                     );
                   })
                 )}
                 <div ref={messagesEndRef} />
               </div>
            )}

            {/* Composer Footer */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isGroupMode ? `Broadcast to ${activeContactIds.length} users...` : "Type a secure message..."} 
                  className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-5 py-4 text-sm font-medium outline-none transition-all shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  disabled={sending || !inputText.trim()}
                  className={`h-14 w-14 rounded-2xl text-white flex items-center justify-center transition-all shrink-0 disabled:opacity-50 shadow-lg ${isGroupMode ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30 ring-purple-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 ring-blue-200'} focus:ring-4`}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="h-6 w-6 ml-1" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full items-center justify-center bg-gray-50">
             <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-gray-400">
                <Users className="w-8 h-8" />
             </div>
             <p className="text-gray-400 font-medium">Select one or more contacts to begin messaging.</p>
          </div>
        )}
      </div>

    </div>
  );
}
