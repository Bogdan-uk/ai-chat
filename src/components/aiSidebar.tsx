import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
const TYPING_INTERVAL = 10; // скорость "печати" ответа AI (меньше = быстрее)

interface Message {
  role: 'you' | 'ai';
  text: string;
}

export default function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const [typingIndex, setTypingIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    // Добавляем ваше сообщение сразу, чтобы интерфейс казался отзывчивым
    setMessages((prev) => [...prev, { role: 'you', text: input }]);
    const messageToSend = input;
    setInput('');

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch(import.meta.env.VITE_ENVI_VAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.error('Ошибка сервера:', res.status);
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: 'Произошла ошибка сервера. Попробуйте ещё раз.' },
        ]);
        return;
      }

      const data = await res.json();
      const replyText: string = data.reply ?? 'AI не вернул ответ.';

      // Готовим сообщение AI и запускаем "печать" по буквам
      setMessages((prev) => [...prev, { role: 'ai', text: '' }]);
      setTypingMessage(replyText);
      setTypingIndex(0);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // Запрос был отменён пользователем (Стоп ответ)
        return;
      }

      console.error('Ошибка запроса:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Не удалось связаться с сервером.' },
      ]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  const clearMessages = () => {
    setMessages([]);
    setTypingMessage(null);
    setTypingIndex(0);
  };

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setTypingMessage(null);
    setTypingIndex(0);
    setLoading(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Остановка текущей записи
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Ваш браузер не поддерживает голосовой ввод.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setInput(text);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const isAiResponding = loading || !!typingMessage;

  // Анимация "печати" ответа AI по буквам
  useEffect(() => {
    if (!typingMessage) return;

    if (typingIndex >= typingMessage.length) {
      setTypingMessage(null);
      return;
    }

    const timeout = setTimeout(() => {
      setTypingIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        setMessages((prevMessages) => {
          if (prevMessages.length === 0) return prevMessages;

          const updated = [...prevMessages];
          const last = updated[updated.length - 1];

          if (last.role !== 'ai') return prevMessages;

          updated[updated.length - 1] = {
            ...last,
            text: typingMessage.slice(0, nextIndex),
          };

          return updated;
        });

        return nextIndex;
      });
    }, TYPING_INTERVAL);

    return () => clearTimeout(timeout);
  }, [typingMessage, typingIndex]);

  return (
    <aside
      style={{
        position: 'relative',
        width: isOpen ? '75vw' : '40px',
        height: '100%',
        borderLeft: '1px solid #1f2937',
        padding: isOpen ? '1rem' : '0.5rem 0.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isOpen ? 'flex-start' : 'center',
        alignItems: 'stretch',
        background:
          'radial-gradient(700px circle at 18% 10%, rgba(59,130,246,0.22), transparent 60%), radial-gradient(700px circle at 85% 90%, rgba(236,72,153,0.16), transparent 55%), linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(15,23,42,0.96) 100%)',
        color: '#e5e7eb',
        transition: 'width 0.25s ease-in-out, padding 0.25s ease-in-out',
      }}
    >
      {/* Кнопка-свайп для скрытия/показа сайдбара справа */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'absolute',
          left: '-32px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '28px',
          height: '72px',
          borderRadius: '999px 0 0 999px',
          border: '1px solid #1f2937',
          background:
            'linear-gradient(180deg, rgba(2,6,23,0.95), rgba(15,23,42,0.95))',
          color: '#e5e7eb',
          fontSize: '0.8rem',
          cursor: 'pointer',
        }}
      >
        AI
      </button>

      {isOpen && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              gap: '0.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.1rem' }}>AI Chat</h2>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={clearMessages}
                disabled={messages.length === 0}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.8rem',
                  borderRadius: '999px',
                  border: '1px solid #4b5563',
                  backgroundColor:
                    messages.length === 0 ? 'transparent' : '#0f172a',
                  color: messages.length === 0 ? '#6b7280' : '#e5e7eb',
                  cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Очистить
              </button>
            </div>
          </div>

          <div
            ref={chatRef}
            className="ai-chat-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '0.75rem',
              paddingRight: '0.25rem',
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Задайте первый вопрос, чтобы начать общение с AI.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'you' ? 'flex-end' : 'flex-start',
                  marginBottom: '0.4rem',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    backgroundColor:
                      m.role === 'you' ? '#1d4ed8' : 'rgba(31,41,55,0.9)',
                    color: '#e5e7eb',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      opacity: 0.8,
                      marginBottom: '0.1rem',
                    }}
                  >
                    {m.role === 'you' ? 'Вы' : 'AI'}
                  </div>
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                AI печатает…
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
              placeholder="Спросите что-нибудь у AI…"
              style={{
                flexGrow: 1,
                flexBasis: 0,
                padding: '0.5rem 0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                backgroundColor: 'rgba(2,6,23,0.55)',
                color: '#e5e7eb',
              }}
            />

            <button
              type="button"
              onClick={toggleRecording}
              disabled={loading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '999px',
                border: '1px solid #4b5563',
                backgroundColor: isRecording ? '#1d4ed8' : '#020617',
                color: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: 0,
              }}
            >
              <span
                style={{
                  width: '14px',
                  height: '18px',
                  borderRadius: '999px',
                  border: '2px solid #e5e7eb',
                  borderBottom: 'none',
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '-6px',
                    width: '10px',
                    height: '6px',
                    borderBottom: '2px solid #e5e7eb',
                    borderRadius: '999px',
                    transform: 'translateX(-50%)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '-10px',
                    width: '2px',
                    height: '6px',
                    backgroundColor: '#e5e7eb',
                    transform: 'translateX(-50%)',
                  }}
                />
              </span>
            </button>

            {isAiResponding && (
              <button
                type="button"
                onClick={stopResponse}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  border: '1px solid #b91c1c',
                  backgroundColor: 'rgba(2,6,23,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span className="ai-stop-logo" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: loading ? '#4b5563' : '#22c55e',
                color: '#020617',
                fontWeight: 500,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease-in-out',
              }}
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        </>
      )}
    </aside>
  );
}
