"use client";

import { CORE_PATH, SERVICE_NAME } from "@/constants";
import { Kalam, Arimo } from "next/font/google";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { createFFmpeg } from "@ffmpeg/ffmpeg";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const arimo = Arimo({ subsets: ["latin"], weight: ["400", "700"] });

const SUPPORTED_MIME_TYPES = ["audio/", "video/", "image/"] as const;

const SUPPORTED_EXTENSIONS: ReadonlyMap<string, readonly string[]> = new Map([
  ["audio", ["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a", "opus"]],
  ["video", ["mp4", "webm", "ogg", "mov", "wmv", "flv", "avi", "mkv", "mp3"]],
  ["image", ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]],
]);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [extension, setExtension] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const downloadRef = useRef<HTMLAnchorElement>(null);

  const onChangeFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log(files);
    if (files && files[0]) {
      if (
        !SUPPORTED_MIME_TYPES.some((mimeType) =>
          files[0].type.startsWith(mimeType),
        )
      ) {
        toast.error("Unsupported file type");
        e.preventDefault();
        return;
      }
      setFile(files[0]);
      setMimeType(files[0].type.split("/")[0]);
    }
  }, []);

  const onChangeExtension = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setExtension(e.target.value);
    },
    [],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!file) {
        toast.error("Please select a file");
        return;
      }
      if (
        !mimeType ||
        !SUPPORTED_MIME_TYPES.some((mimeType) => file.type.startsWith(mimeType))
      ) {
        toast.error("Unsupported file type");
        return;
      }
      const ogExtension = file.name.split(".").at(-1);
      if (ogExtension === extension) {
        toast.error("Cannot convert to same file type");
        return;
      }

      setProcessing(true);

      const binaryData = new Uint8Array(await file.arrayBuffer());

      const distName = `${file.name
        .split(".")
        .slice(0, -1)
        .join(".")}-converted.${extension}`;

      const ffmpeg = createFFmpeg({ corePath: CORE_PATH, log: true });
      try {
        await ffmpeg.load();
      } catch (e) {
        if (e instanceof RangeError && e.message.includes("Memory")) {
          toast.error("Memory error. Maybe your device memory is full?");
          return;
        } else {
          throw e;
        }
      }
      ffmpeg.FS("writeFile", file.name, binaryData);
      await ffmpeg.run("-i", file.name, "-vcodec", "copy", distName);
      const videoUint8Array = ffmpeg.FS("readFile", distName);
      try {
        ffmpeg.exit();
      } catch (error) {
        console.warn("ffmpeg exit error");
        console.error(error);
      }

      const blob = new Blob([videoUint8Array.buffer], {
        type: `${mimeType}/${extension}`,
      });
      const url = URL.createObjectURL(blob);
      if (!downloadRef.current) throw new Error("downloadRef is null");
      downloadRef.current.href = url;
      downloadRef.current.download = distName;
      downloadRef.current.click();
    },
    [file, mimeType, extension],
  );

  return (
    <>
      <div className="hero min-h-72 bg-sky-300 dark:bg-sky-700">
        <div className={`hero-content text-center ${kalam.className}`}>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold pt-4">{SERVICE_NAME}</h1>
            <p className={`py-6 text-2xl ${arimo.className}`}>
              Convert media files for free. Data is not stored on the server as
              it is converted on the client side!
            </p>
          </div>
        </div>
      </div>

      <form
        className="flex flex-col justify-center items-center mt-12"
        onSubmit={onSubmit}
      >
        <input
          type="file"
          className="file-input file-input-bordered file-input-primary w-full max-w-xs"
          onChange={onChangeFile}
        />
        {file && (
          <div className="flex flex-col items-center mt-8 gap-8">
            <p className="text-3xl">Convert</p>
            <div className="flex items-center gap-4">
              <span className="font-bold uppercase text-6xl">
                {file.name.split(".").at(-1)}
              </span>
              <span className="px-2 text-2xl">to</span>
              <select
                className="select select-accent select-lg w-full max-w-[12rem] text-3xl"
                onChange={onChangeExtension}
                value={extension ?? "none"}
                disabled={processing}
              >
                <option disabled value="none">
                  Choose
                </option>
                {SUPPORTED_EXTENSIONS.get(mimeType!)?.map((extension, i) => (
                  <option value={extension} key={i}>
                    {extension.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-secondary"
              type="submit"
              disabled={processing}
            >
              <span
                className={`loading loading-spinner ${
                  processing ? "" : "hidden"
                }`}
              ></span>
              Convert
            </button>
          </div>
        )}
      </form>
      <a className="hidden" ref={downloadRef}></a>
    </>
  );
}
