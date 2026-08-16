import { useState, useCallback } from "react";
import axios from "axios";
import Camera from "../components/Camera";
import UserCard from "../components/UserCard";
import "./ScanPage.css";

export default function ScanPage() {
  const [capturedImage, setCapturedImage] = useState(null);
  const [embedding, setEmbedding] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCapture = useCallback((dataUrl) => {
    setCapturedImage(dataUrl);
    setResult(null);
    setError(null);
  }, []);

  const handleEmbedding = useCallback((emb) => {
    setEmbedding(emb);
  }, []);

  async function handleScan() {
    if (!embedding) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("face_embedding", JSON.stringify(embedding));

      const res = await axios.post("/api/users/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || "Scan failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCapturedImage(null);
    setEmbedding(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="scan-page">
      <div className="page-header">
        <h1 className="page-title">Face Scan</h1>
        <p className="page-subtitle">
          Look into the camera to identify yourself
        </p>
      </div>

      <div className="scan-layout">
        {/* Camera panel */}
        <div className="scan-camera-panel card">
          <h2 className="panel-title">Camera</h2>
          <Camera
            onCapture={handleCapture}
            onEmbedding={handleEmbedding}
            captureLabel="Take Photo"
            scanning={loading}
          />

          {capturedImage && !loading && (
            <div className="scan-actions">
              <button
                className="btn btn-primary"
                onClick={handleScan}
                disabled={!embedding}
              >
                🔍 Identify Person
              </button>
              <button className="btn btn-ghost" onClick={reset}>
                Clear
              </button>
            </div>
          )}

          {loading && (
            <div className="scan-status scanning">
              <div className="pulse-ring" />
              <span>Scanning face...</span>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="scan-result-panel">
          {!result && !error && (
            <div className="scan-placeholder card">
              <div className="placeholder-icon">👤</div>
              <p>Capture a photo and click <strong>Identify Person</strong> to see results</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error card">
              <span className="alert-icon">✕</span>
              <div>
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="result-container">
              {result.matched ? (
                <>
                  <div className="match-banner success">
                    <span className="match-icon">✓</span>
                    <div>
                      <strong>Identity Verified</strong>
                      <p>{result.message}</p>
                    </div>
                    <div className="confidence-badge">
                      {result.confidence?.toFixed(1)}%
                    </div>
                  </div>
                  <UserCard user={result.user} />
                </>
              ) : (
                <div className="match-banner failure card">
                  <span className="match-icon">✕</span>
                  <div>
                    <strong>Not Recognized</strong>
                    <p>{result.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
