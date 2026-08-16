import { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import "./Camera.css";

// Models served from public/models (copied from @vladmandic/face-api npm package)
const MODELS_URL = "/models";

let modelsLoadedGlobal = false; // load once across remounts

export default function Camera({
  onCapture,
  onEmbedding,
  captureLabel = "Capture",
  scanning = false,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(modelsLoadedGlobal);
  const [status, setStatus] = useState(modelsLoadedGlobal ? "" : "Loading AI models…");
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!modelsLoadedGlobal) {
        try {
          setStatus("Loading face detection models…");
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
          ]);
          modelsLoadedGlobal = true;
          if (!cancelled) {
            setModelsLoaded(true);
            setStatus("Starting camera…");
          }
        } catch (err) {
          console.error("Model load error:", err);
          if (!cancelled) setError("Failed to load face recognition models. Check your internet connection and refresh.");
          return;
        }
      }
      if (!cancelled) startCamera();
    }

    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          setStatus("");
        };
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;
    setProcessing(true);
    setStatus("Detecting face…");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("");
        setProcessing(false);
        alert("No face detected. Please ensure your face is clearly visible and well-lit.");
        return;
      }

      const embedding = Array.from(detection.descriptor);
      setCaptured(dataUrl);
      setStatus("✓ Face detected");
      setProcessing(false);
      onCapture?.(dataUrl);
      onEmbedding?.(embedding);
    } catch (err) {
      console.error("Detection error:", err);
      setStatus("");
      setProcessing(false);
      alert("Face detection failed. Please try again.");
    }
  }, [modelsLoaded, onCapture, onEmbedding]);

  function retake() {
    setCaptured(null);
    setStatus("");
    onCapture?.(null);
    onEmbedding?.(null);
  }

  if (error) {
    return (
      <div className="camera-error">
        <span className="camera-error-icon">⚠</span>
        <p>{error}</p>
      </div>
    );
  }

  const isReady = cameraReady && modelsLoaded && !processing;

  return (
    <div className="camera-wrapper">
      {!captured ? (
        <>
          <div className={`camera-view ${scanning ? "scanning" : ""}`}>
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <div className="face-guide">
              <div className="face-oval" />
              <div className="scan-line" />
            </div>
            {(!cameraReady || !modelsLoaded || processing) && (
              <div className="camera-loading">
                <div className="spinner" />
                <p>{status || "Please wait…"}</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {status && !processing && cameraReady && (
            <p className="camera-status">{status}</p>
          )}
          <button className="btn-capture" onClick={capture} disabled={!isReady}>
            <span className="capture-icon">●</span>
            {processing ? "Detecting…" : captureLabel}
          </button>
        </>
      ) : (
        <>
          <div className="camera-preview">
            <img src={captured} alt="Captured face" className="preview-img" />
            <div className="preview-badge">✓ Face detected</div>
          </div>
          <button className="btn-retake" onClick={retake}>↺ Retake Photo</button>
        </>
      )}
    </div>
  );
}
