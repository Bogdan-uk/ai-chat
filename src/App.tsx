import ChatSidebar from './components/aiSidebar';

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          padding: '2rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'relative',
        }}
      >
        <p
          style={{
            fontSize: '1.6rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            marginBottom: '0.5rem',
          }}
        >
          This is my first AI chat
        </p>
        <div
          style={{
            marginTop: '1.5rem',
            fontSize: '0.95rem',
            color: '#9ca3af',
            position: 'relative',
            paddingRight: '4rem',
          }}
        >
          Try it out on the right
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'inline-block',
              width: '64px',
              height: '2px',
              background:
                'linear-gradient(90deg, rgba(148,163,184,0.3), rgba(96,165,250,1))',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '-2px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: '8px',
              height: '8px',
              borderRight: '2px solid #60a5fa',
              borderTop: '2px solid #60a5fa',
            }}
          />
        </div>
      </div>
      <ChatSidebar />
    </main>
  );
}
