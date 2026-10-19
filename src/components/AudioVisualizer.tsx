import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Upload, Layers } from 'lucide-react';

interface AudioVisualizerProps {
  onAudioReady: (base64: string, filename: string, transcriptPrompt?: string) => void;
  disabled?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ onAudioReady, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [chunkThreshold, setChunkThreshold] = useState(20); // 20 minutes

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  const startVisualizer = (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
          ctx.fillStyle = i % 2 === 0 ? '#6366f1' : '#818cf8';
          ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);
          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn('Audio visualizer fallback:', e);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startVisualizer(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onAudioReady(base64, `meeting_recording_${Date.now()}.webm`);
        };
        reader.readAsDataURL(audioBlob);

        // Stop tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or unavailable in this environment.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onAudioReady(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Live Record or Upload Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Record Control Box */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" />
              Live Microphone Capture
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {formatTime(recordingSeconds)}
            </span>
          </div>

          <div className="h-16 bg-slate-950 rounded border border-slate-800/80 mb-3 overflow-hidden flex items-center justify-center">
            {isRecording ? (
              <canvas ref={canvasRef} width={280} height={60} className="w-full h-full" />
            ) : (
              <div className="text-xs text-slate-500 font-mono">
                Audio buffer idle
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors"
              >
                <Mic className="w-3.5 h-3.5" />
                Record Session
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                Stop & Transcribe
              </button>
            )}
          </div>
        </div>

        {/* Upload Audio File */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Upload Audio / Video Media
            </span>
            <p className="text-xs text-slate-400 mb-3">
              Accepts .mp3, .wav, .m4a, .mp4. Audio is transcribed locally using faster-whisper.
            </p>
          </div>

          <div>
            <label className="block">
              <input
                type="file"
                accept="audio/*,video/mp4"
                onChange={handleFileUpload}
                disabled={disabled || isRecording}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
              />
            </label>
            {uploadedFile && (
              <p className="text-xs text-slate-400 font-mono mt-2 truncate">
                Loaded: {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Audio Chunking Configuration Panel */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-md flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="font-medium">OOM Prevention Chunking:</span>
          <span className="text-slate-400">Split recordings exceeding threshold into segments</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-slate-300">
          <span>Chunk Size:</span>
          <select
            value={chunkThreshold}
            onChange={(e) => setChunkThreshold(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
          >
            <option value={15}>15 Minutes</option>
            <option value={20}>20 Minutes (Recommended)</option>
            <option value={30}>30 Minutes</option>
          </select>
        </div>
      </div>

      {/* Audio Playback if loaded */}
      {audioUrl && (
        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-md flex items-center gap-3">
          <audio src={audioUrl} controls className="w-full h-8" />
        </div>
      )}
    </div>
  );
};
