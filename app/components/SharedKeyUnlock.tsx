"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "../lib/i18n";
import { SHARED_KEY_COPY } from "../lib/shared-key-copy";
import { decodeSharedKeyQr, mnemonicToSharedKey } from "../lib/shared-key";

type Props = {
  locale: Locale;
  onKey: (sharedKey: string) => Promise<void> | void;
  externalError?: string;
  compact?: boolean;
};

async function decodePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const { default: jsQR } = await import("jsqr");
  return (
    jsQR(data, width, height, { inversionAttempts: "attemptBoth" })?.data || ""
  );
}

type LocalImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function openLocalImage(file: File): Promise<LocalImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.decoding = "async";
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("image"));
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {
        image.src = "";
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (cause) {
    image.src = "";
    URL.revokeObjectURL(objectUrl);
    throw cause;
  }
}

export function SharedKeyUnlock({
  locale,
  onKey,
  externalError = "",
  compact = false,
}: Props) {
  const copy = SHARED_KEY_COPY[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const titleId = useId();
  const wordsId = useId();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  function releaseCamera() {
    if (animationRef.current !== null)
      cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function stopCamera() {
    releaseCamera();
    setCameraOpen(false);
  }

  useEffect(() => {
    const stopWhenHidden = () => {
      if (!document.hidden) return;
      releaseCamera();
      setCameraOpen(false);
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      releaseCamera();
    };
  }, []);

  async function acceptPayload(payload: string) {
    setWorking(true);
    setError("");
    try {
      const key = await decodeSharedKeyQr(payload);
      stopCamera();
      await onKey(key);
    } catch {
      setError(copy.invalid);
    } finally {
      setWorking(false);
    }
  }

  async function startCamera() {
    stopCamera();
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setCameraOpen(true);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const scan = async () => {
        if (!streamRef.current || !videoRef.current || !context) return;
        const source = videoRef.current;
        if (
          source.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          source.videoWidth > 0
        ) {
          const scale = Math.min(1, 960 / source.videoWidth);
          canvas.width = Math.max(1, Math.round(source.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(source.videoHeight * scale));
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          const frame = context.getImageData(0, 0, canvas.width, canvas.height);
          let payload = "";
          try {
            payload = await decodePixels(
              frame.data,
              frame.width,
              frame.height,
            );
          } finally {
            frame.data.fill(0);
          }
          if (payload) {
            await acceptPayload(payload);
            return;
          }
        }
        animationRef.current = requestAnimationFrame(() => {
          void scan();
        });
      };
      animationRef.current = requestAnimationFrame(() => {
        void scan();
      });
    } catch {
      stopCamera();
      setError(copy.camera);
    }
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setWorking(true);
    setError("");
    let localImage: LocalImage | null = null;
    try {
      localImage = await openLocalImage(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1600 / localImage.width);
      canvas.width = Math.max(1, Math.round(localImage.width * scale));
      canvas.height = Math.max(1, Math.round(localImage.height * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("canvas");
      context.drawImage(localImage.source, 0, 0, canvas.width, canvas.height);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      let payload = "";
      try {
        payload = await decodePixels(image.data, image.width, image.height);
      } finally {
        image.data.fill(0);
      }
      if (!payload) throw new Error("qr");
      await acceptPayload(payload);
    } catch {
      setError(copy.invalid);
    } finally {
      localImage?.release();
      setWorking(false);
    }
  }

  async function unlockWords() {
    setWorking(true);
    setError("");
    try {
      const key = mnemonicToSharedKey(mnemonic);
      await onKey(key);
    } catch {
      setError(copy.invalid);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section
      className={`shared-key-unlock ${compact ? "compact" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="shared-key-unlock-head">
        <span>◇</span>
        <div>
          <h1 id={titleId}>{copy.unlockTitle}</h1>
          <p>{copy.unlockBody}</p>
        </div>
      </div>
      <p className="shared-key-channel-warning">
        <b>!</b>
        {copy.differentChannel}
      </p>
      <div className="shared-key-scan-actions">
        <button type="button" onClick={cameraOpen ? stopCamera : startCamera}>
          {cameraOpen ? copy.stop : copy.scan}
        </button>
        <label>
          {copy.upload}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => void readFile(event.target.files?.[0])}
          />
        </label>
      </div>
      <video
        ref={videoRef}
        className={cameraOpen ? "shared-key-video active" : "shared-key-video"}
        muted
        playsInline
        aria-label={copy.scan}
      />
      <div className="shared-key-words">
        <label htmlFor={wordsId}>{copy.words}</label>
        <textarea
          id={wordsId}
          value={mnemonic}
          onChange={(event) => setMnemonic(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          rows={compact ? 3 : 4}
        />
        <button
          type="button"
          disabled={working || mnemonic.trim().split(/\s+/).length !== 24}
          onClick={() => void unlockWords()}
        >
          {working ? copy.working : copy.unlock}
        </button>
      </div>
      {(error || externalError) && (
        <p className="form-error" role="alert">
          {externalError || error}
        </p>
      )}
    </section>
  );
}
