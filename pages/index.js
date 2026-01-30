import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Comparison feature
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [compareResult, setCompareResult] = useState(null);

  const decodieren = async () => {
    setError("");
    setSuccess("");
    setResult(null);

    if (!code.trim()) {
      setError("Bitte einen Bestellschlüssel eingeben.");
      return;
    }

    try {
      const response = await fetch("/api/decode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      let successMsg = "Bestellschlüssel erfolgreich dekodiert!";
      if (data.hasStandardValues) {
        successMsg +=
          " ⚠️ Einige Komponenten wurden mit Standard-Werten ergänzt (gelb markiert).";
      }
      setSuccess(successMsg);
      setResult(data);
    } catch (err) {
      setError("Fehler beim Dekodieren: " + err.message);
    }
  };

  const vergleichen = async () => {
    setCompareResult(null);

    if (!code1.trim() || !code2.trim()) {
      setCompareResult({ error: "Bitte beide Codes eingeben." });
      return;
    }

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code1: code1.trim().toUpperCase(),
          code2: code2.trim().toUpperCase(),
        }),
      });

      const data = await response.json();
      setCompareResult(data);
    } catch (err) {
      setCompareResult({ error: "Fehler beim Vergleich: " + err.message });
    }
  };

  const beispiel = () => {
    setCode("DSX2ZS09010L9005BN01000VMESB0");
  };

  const beispielKurz = () => {
    setCode("DSX2Z");
  };

  const beispielASK = () => {
    setCode("ASK-21-2-N-01000-VM-SV-DK2-GD1-I0-KHS-KVS-S1-SDS-E0");
  };

  const beispielEW = () => {
    setCode("EW-21-2-S0-ELOX-B9005-090-000-000");
  };

  const beispielVergleich = () => {
    setCode1("DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0");
    setCode2("DSX2ZS09010L9005BN01000VMESB0");
  };

  const loeschen = () => {
    setCode("");
    setResult(null);
    setError("");
    setSuccess("");
  };

  const loeschenVergleich = () => {
    setCode1("");
    setCode2("");
    setCompareResult(null);
  };

  return (
    <>
      <Head>
        <title>SCHAKO Bestellschlüssel Decoder</title>
        <meta
          name="description"
          content="SCHAKO Bestellschlüssel Decoder für DSX, ASK und EW Produkte"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <h1>🛠️ SCHAKO Bestellschlüssel Decoder</h1>
        <p className="subtitle">
          Unterstützt: DSX (Schlitzdurchlass), ASK (Anschlusskasten), EW
          (Eckwinkel)
        </p>

        <div className="input-section">
          <div className="form-group">
            <label htmlFor="bestellCode">
              Bestellschlüssel eingeben (mit oder ohne Bindestriche):
            </label>
            <textarea
              id="bestellCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="z.B.: DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0 oder DSX2Z (kurze Codes werden mit Standard-Werten ergänzt)"
            />
          </div>
          <div className="button-group">
            <button className="btn-primary" onClick={decodieren}>
              Dekodieren
            </button>
            <p className="examples-label"> Beispiele einfügen:</p>
            <button className="btn-secondary" onClick={beispiel}>
              DSX Vollständig
            </button>
            <button className="btn-secondary" onClick={beispielKurz}>
              DSX Kurz
            </button>
            <button className="btn-secondary" onClick={beispielASK}>
              ASK
            </button>
            <button className="btn-secondary" onClick={beispielEW}>
              EW
            </button>
            <button className="btn-secondary" onClick={loeschen}>
              🗑️ Löschen
            </button>
          </div>
        </div>

        {(error || success || result) && (
          <div className="results-section">
            {error && <div className="error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {result && (
              <>
                <div className="info-box">
                  <div className="info-row">
                    <span className="info-label">Produkttyp:</span>
                    <span className="info-value">{result.productType}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Vollständiger Code:</span>
                    <div className="full-code">{result.formatted_code}</div>
                  </div>
                  {result.hasStandardValues && (
                    <div className="warning-notice">
                      ⚠️ <strong>Hinweis:</strong> Gelb markierte Komponenten
                      wurden mit Standard-Werten ergänzt
                    </div>
                  )}
                </div>

                <div className="component-grid">
                  {result.components.map((komp, idx) => (
                    <div
                      key={idx}
                      className={`component-card ${komp.isStandard ? "standard-value" : ""}`}
                    >
                      <div className="component-header">
                        <span className="component-index">{komp.index}</span>
                        <h3 className="component-name">
                          {komp.name.toUpperCase()}
                        </h3>
                      </div>
                      <div className="code">
                        {komp.value}
                        {komp.isStandard && (
                          <span className="standard-badge">Standard</span>
                        )}
                      </div>
                      <div className="description">
                        {komp.description || "Keine Beschreibung verfügbar"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="input-section comparison-section">
          <h2 className="section-title">🔍 Code-Vergleich</h2>
          <p className="section-description">
            Prüfen Sie, ob zwei Codes identisch sind (nützlich um Codes mit und
            ohne Bindestriche zu vergleichen).
          </p>

          <div className="form-group">
            <label htmlFor="code1">Code 1 (z.B. mit Bindestrichen):</label>
            <textarea
              id="code1"
              value={code1}
              onChange={(e) => setCode1(e.target.value)}
              placeholder="DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0"
              style={{ minHeight: "60px" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="code2">Code 2 (z.B. ohne Bindestriche):</label>
            <textarea
              id="code2"
              value={code2}
              onChange={(e) => setCode2(e.target.value)}
              placeholder="DSX2ZS09010L9005BN01000VMESB0"
              style={{ minHeight: "60px" }}
            />
          </div>

          <div className="button-group">
            <button className="btn-primary" onClick={vergleichen}>
              Vergleichen
            </button>
            <button className="btn-secondary" onClick={beispielVergleich}>
              Beispiel laden
            </button>
            <button className="btn-secondary" onClick={loeschenVergleich}>
              🗑️ Löschen
            </button>
          </div>
        </div>

        {compareResult && (
          <div className="results-section">
            {compareResult.error && (
              <div className="error">{compareResult.error}</div>
            )}

            {!compareResult.error && (
              <>
                {compareResult.identical ? (
                  <div className="success-message">
                    <div style={{ fontSize: "18px", marginBottom: "10px" }}>
                      <strong>✅ Die Codes sind identisch!</strong>
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.9 }}>
                      Beide Codes repräsentieren:{" "}
                      <code
                        style={{
                          background: "rgba(255,255,255,0.3)",
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        {compareResult.formatted_code}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="error">
                    <div style={{ fontSize: "18px", marginBottom: "10px" }}>
                      <strong>❌ Die Codes sind unterschiedlich!</strong>
                    </div>
                    <div style={{ marginTop: "12px", fontSize: "14px" }}>
                      <strong>Code 1:</strong>{" "}
                      <code>{compareResult.formatted_code1 || "Ungültig"}</code>
                      <br />
                      <strong>Code 2:</strong>{" "}
                      <code>{compareResult.formatted_code2 || "Ungültig"}</code>
                    </div>
                    {compareResult.differences &&
                      compareResult.differences.length > 0 && (
                        <div style={{ marginTop: "12px" }}>
                          <strong>Unterschiede:</strong>
                          <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                            {compareResult.differences.map((diff, idx) => (
                              <li key={idx}>{diff}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        :root {
          --primary: #0284c7;
          --primary-dark: #0369a1;
          --primary-light: #38bdf8;
          --bg: #f8fafc;
          --surface: #ffffff;
          --text: #0f172a;
          --text-secondary: #64748b;
          --border: #e2e8f0;
          --success: #16a34a;
          --warning: #fbbf24;
          --warning-bg: #fef3c7;
          --error: #dc2626;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          color: var(--text);
          padding: 20px;
          line-height: 1.6;
          min-height: 100vh;
        }

        code {
          font-family: "Courier New", "Consolas", monospace;
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.95em;
        }

        .container {
          max-width: 1300px;
          margin: 0 auto;
        }

        h1 {
          color: var(--primary);
          margin-bottom: 10px;
          font-size: 32px;
          font-weight: 700;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .examples-label {
          align-self: center;
          margin: 0 10px 0 20px;}

        .subtitle {
          color: var(--text-secondary);
          margin-bottom: 30px;
          font-size: 15px;
          font-weight: 500;
        }

        .input-section {
          background: var(--surface);
          padding: 28px;
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .comparison-section {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        }

        .section-title {
          margin-bottom: 12px;
          font-size: 24px;
          color: var(--primary);
          font-weight: 700;
        }

        .section-description {
          margin-bottom: 20px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          color: var(--text);
          font-size: 14px;
        }

        input[type="text"],
        textarea {
          width: 100%;
          padding: 14px;
          border: 2px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          font-family: "Courier New", monospace;
          color: var(--text);
          background: var(--surface);
          transition: all 0.3s ease;
        }

        textarea {
          resize: vertical;
          min-height: 90px;
        }

        input[type="text"]:focus,
        textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1);
        }

        .button-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        button:active {
          transform: translateY(1px);
        }

        .btn-primary {
          background: linear-gradient(
            135deg,
            var(--primary) 0%,
            var(--primary-dark) 100%
          );
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(
            135deg,
            var(--primary-dark) 0%,
            var(--primary) 100%
          );
          box-shadow: 0 4px 8px rgba(2, 132, 199, 0.3);
        }

        .btn-secondary {
          background: #f1f5f9;
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          background: #e2e8f0;
          border-color: var(--primary-light);
        }

        .results-section {
          display: block;
        }

        .component-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .component-card {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .component-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(
            90deg,
            var(--primary) 0%,
            var(--primary-light) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .component-card:hover {
          border-color: var(--primary);
          box-shadow: 0 8px 16px rgba(2, 132, 199, 0.15);
          transform: translateY(-2px);
        }

        .component-card:hover::before {
          opacity: 1;
        }

        .component-card.standard-value {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-color: var(--warning);
        }

        .component-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .component-index {
          background: var(--primary);
          color: white;
          font-weight: 700;
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 6px;
          min-width: 48px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);
        }

        .component-name {
          color: var(--primary-dark);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.5px;
          flex: 1;
          line-height: 1.2;
        }

        .component-card .code {
          background: #f1f5f9;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: "Courier New", monospace;
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
          word-break: break-all;
          border: 1px solid var(--border);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .standard-badge {
          background: var(--warning);
          color: #78350f;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .component-card .description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          font-weight: 500;
        }

        .error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 2px solid #f87171;
          color: #7f1d1d;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.1);
        }

        .success-message {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 2px solid #34d399;
          color: #064e3b;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.1);
        }

        .info-box {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 2px solid var(--primary-light);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px rgba(2, 132, 199, 0.1);
        }

        .info-row {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-row:last-of-type {
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 700;
          color: var(--primary-dark);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }

        .full-code {
          background: rgba(255, 255, 255, 0.8);
          padding: 16px;
          border-radius: 8px;
          font-family: "Courier New", monospace;
          font-size: 15px;
          font-weight: 700;
          word-break: break-all;
          border: 2px solid var(--primary);
          color: var(--primary-dark);
        }

        .warning-notice {
          margin-top: 16px;
          padding: 12px;
          background: rgba(251, 191, 36, 0.2);
          border-radius: 8px;
          font-size: 13px;
          color: #78350f;
          border: 1px solid var(--warning);
        }

        @media (max-width: 1400px) {
          .component-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 1100px) {
          .component-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .component-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .component-grid {
            grid-template-columns: 1fr;
          }

          .component-grid {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: 26px;
          }

          .button-group {
            flex-direction: column;
          }

          button {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .component-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .component-name {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}
