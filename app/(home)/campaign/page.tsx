"use client";
import React, { useState } from "react";

export default function Campain() {
  const [text, setText] = useState("");
  const [countValue, setCountValue] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionalPreview, setOptionalPreview] = useState<string | null>(null);
  const [optionalImage, setOptionalImage] = useState<File | null>(null);
  const [count, setCount] = useState<number | "">(0);

  const handleSave = async () => {
    if (!text) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("prompt", text);
      formData.append("count", String(count));

      if (optionalImage) {
        formData.append("brand_image", optionalImage);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/campaign/generate`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const blob = await res.blob();

      const disposition = res.headers.get("Content-Disposition");

      let filename = "campaign.zip";

      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }


      // const url = URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = filename;

      // document.body.appendChild(a);
      // a.click();
      // a.remove();

      // URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      // alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/40">

        <div className="flex flex-col gap-5">

          {/* Upload */}
          <label className="cursor-pointer outline outline-dashed border-black/60 rounded-xl h-80 flex flex-col items-center justify-center bg-white/60 hover:bg-white transition">

            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setOptionalImage(file);
                setOptionalPreview(URL.createObjectURL(file));
              }}
            />

            {!optionalPreview && (
              <span className="text-gray-500 text-sm">
                Click to upload Image
              </span>
            )}

            {optionalPreview && (
              <img
                className="object-center w-full h-full rounded-xl"
                src={optionalPreview}
                alt="Preview"
              />
            )}
          </label>

          {/* Count + Text */}
          <div className="flex flex-col gap-3">

            <label className="text-sm font-medium text-gray-600">
              Image Count
            </label>

            <input
              type="number"
              value={count}
              min={1}
              max={30}
              onFocus={(e) => {
                if (e.target.value === "0") setCount("");
              }}
              onChange={(e) => {
                const value = e.target.value;

                if (value === "") {
                  setCount("");
                  return;
                }

                let num = Number(value);

                if (num < 1) num = 1;
                if (num > 30) num = 30;

                setCount(num);
              }}
              onBlur={() => {
                if (count === "") setCount(0);
              }}
              className="w-full px-4 py-2 rounded-xl outline outline-dashed border-black/60  bg-white/80"
            />

            <input
              className="w-full px-4 py-2 rounded-xl outline outline-dashed border-black/60  bg-white/80"
              type="text"
              placeholder="Enter annotation text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-2 rounded-xl shadow-md hover:scale-[1.02] transition"
          >
            {loading ? "Processing...." : "Generate"}
          </button>

        </div>
      </div>
    </div>
  );
}