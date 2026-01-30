import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const decodieren = async () => {
    setError('');
    setSuccess('');
    setResult(null);

    if (!code.trim()) {
      setError('Bitte einen Bestellschlüssel eingeben.');
      return;
    }

    try {
      const response = await fetch('/api/decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess('Bestellschlüssel erfolgreich dekodiert!');
      setResult(data);
    } catch (err) {
      setError('Fehler beim Dekodieren: ' + err.message);
    }
  };

  const beispiel = () => {
    setCode('DSX2ZS09010L9005BN01000VMESB0');
  };

  const loeschen = () => {
    setCode('');
    setResult(null);
    setError('');
    setSuccess('');
  };

  return (
    <>
      <Head>
        <title>DSX Bestellschlüssel Decoder</title>
        <meta name="description" content="DSX Bestellschlüssel Decoder Tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <h1>🛠️ DSX Bestellschlüssel Decoder</h1>

        <div className="input-section">
          <div className="form-group">
            <label htmlFor="bestellCode">Bestellschlüssel eingeben (mit oder ohne Bindestriche):</label>
            <textarea
              id="bestellCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="z.B.: DSX-2-Z-S0-9010-L9005-V-N-01000-VM-ES-B0 oder DSX2ZS09010L9005VN01000VMESB0"
            />
          </div>
          <div className="button-group">
            <button className="btn-primary" onClick={decodieren}>Dekodieren</button>
            <button className="btn-secondary" onClick={beispiel}>Beispiel laden</button>
            <button className="btn-secondary" onClick={loeschen}>Löschen</button>
          </div>
        </div>

        {(error || success || result) && (
          <div className="results-section">
            {error && <div className="error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {result && (
              <>
                <div className="info-box">
                  <strong>Vollständiger Code (formatiert):</strong><br />
                  <div className="full-code">{result.formatted_code}</div>
                </div>

                <div className="component-grid">
                  {result.components.map((komp, idx) => (
                    <div key={idx} className="component-card">
                      <h3>{komp.index} - {komp.name}</h3>
                      <div className="code">{komp.value}</div>
                      <div className="description">{komp.description || 'Keine Beschreibung verfügbar'}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        :root {
          --primary: #0284c7;
          --primary-dark: #0369a1;
          --bg: #f8fafc;
          --surface: #ffffff;
          --text: #0f172a;
          --text-secondary: #475569;
          --border: #e2e8f0;
          --success: #16a34a;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: var(--bg);
          color: var(--text);
          padding: 20px;
          line-height: 1.5;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        h1 {
          color: var(--primary);
          margin-bottom: 30px;
          font-size: 28px;
        }

        .input-section {
          background: var(--surface);
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 1px solid var(--border);
        }

        .form-group {
          margin-bottom: 16px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text);
        }

        input[type="text"], textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          color: var(--text);
          background: var(--surface);
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        input[type="text"]:focus, textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }

        .button-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background-color: var(--primary-dark);
        }

        .btn-secondary {
          background-color: var(--border);
          color: var(--text);
        }

        .btn-secondary:hover {
          background-color: #cbd5e1;
        }

        .results-section {
          display: block;
        }

        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .component-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s;
        }

        .component-card:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.1);
        }

        .component-card h3 {
          color: var(--primary);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .component-card .code {
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 10px;
          word-break: break-all;
        }

        .component-card .description {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .error {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .success-message {
          background-color: #dcfce7;
          border: 1px solid #86efac;
          color: #166534;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .info-box {
          background: #eff6ff;
          border-left: 4px solid var(--primary);
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .info-box strong {
          color: var(--primary);
        }

        .full-code {
          background: #f1f5f9;
          padding: 16px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          word-break: break-all;
          margin-top: 10px;
          border: 1px solid var(--border);
        }

        @media (max-width: 768px) {
          .component-grid {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}
