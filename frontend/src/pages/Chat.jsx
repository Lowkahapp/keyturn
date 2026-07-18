import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Send, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

let socket;

export default function Chat() {
  const { roomId }   = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [rooms, setRooms]       = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [activeRoom, setActiveRoom] = useState(roomId || null);
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    chatAPI.rooms().then(r => { setRooms(r.data.data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    chatAPI.messages(activeRoom).then(r => setMessages(r.data.data));

    socket = io('/', { auth: { token: localStorage.getItem('kt_token') } });
    socket.emit('join_room', activeRoom);
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    return () => socket?.disconnect();
  }, [activeRoom]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { roomId: activeRoom, message: input, sender_id: user.id, sender_name: user.name, created_at: new Date() };
    socket?.emit('send_message', msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
    chatAPI.send(activeRoom, { message: input }).catch(() => {});
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);
  const otherName = activeRoomData ? (user?.id === activeRoomData.owner_id ? activeRoomData.seeker_name : activeRoomData.owner_name) : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-64px)] flex gap-4">
      {/* Room list */}
      <div className="w-72 flex-shrink-0 card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Messages</h2></div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-4 text-sm text-gray-400">Loading...</div> :
           rooms.length === 0 ? (
            <div className="p-6 text-center"><MessageCircle size={32} className="text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No conversations yet</p></div>
           ) : rooms.map(room => {
            const other = user?.id === room.owner_id ? room.seeker_name : room.owner_name;
            return (
              <button key={room.id} onClick={() => { setActiveRoom(room.id); navigate(`/chat/${room.id}`); }}
                className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors ${activeRoom === room.id ? 'bg-primary-50 border-l-2 border-l-primary' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {other?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{other}</p>
                    <p className="text-xs text-gray-400 truncate">{room.property_title}</p>
                    {room.last_message && <p className="text-xs text-gray-400 truncate mt-0.5">{room.last_message}</p>}
                  </div>
                  {room.unread_count > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{room.unread_count}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        {activeRoom ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold text-sm">{otherName?.[0] || '?'}</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{otherName}</p>
                <p className="text-xs text-gray-400">{activeRoomData?.property_title}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-primary-100' : 'text-gray-400'}`}>
                        {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-3">
              <input className="input flex-1" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} />
              <button type="submit" className="btn-primary px-4 py-2.5"><Send size={16} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
