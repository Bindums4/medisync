import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { getSocket } from '../socket';
import Icon from './Icon';

export default function Chat({ appointmentId, disabled }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottom = useRef(null);

  useEffect(() => {
    api.get(`/messages/${appointmentId}`).then((r) => setMessages(r.data));
    const s = getSocket();
    const join = () => s.emit('appt:join', appointmentId);
    join();
    s.on('connect', join);
    const on = (m) => m.appointment === appointmentId && setMessages((p) => (p.some((x) => x._id === m._id) ? p : [...p, m]));
    s.on('chat:message', on);
    return () => { s.off('connect', join); s.off('chat:message', on); };
  }, [appointmentId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    getSocket().emit('chat:send', { appointment: appointmentId, text });
    setText('');
  };

  return (
    <div className="card chatcard">
      <h3 className="row"><Icon name="chat" /> Consultation chat</h3>
      <div className="chat">
        {messages.length === 0 && <p className="muted small center">Say hello. Messages here are only visible to you and your doctor.</p>}
        {messages.map((m) => (
          <div key={m._id} className={`bubble ${m.sender._id === user._id ? 'mine' : ''}`}>
            {m.sender._id !== user._id && <b className="small">{m.sender.role === 'doctor' ? 'Dr. ' : ''}{m.sender.name}</b>}
            <div>{m.text}</div>
            <span className="time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {disabled ? <p className="muted small center">This appointment is cancelled, chat is closed.</p> : (
        <form className="row" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
          <button className="btn icon-btn" aria-label="Send"><Icon name="send" size={18} /></button>
        </form>
      )}
    </div>
  );
}
