"use client";
import Image from "next/image";
import React, { useState } from "react";

export default function LogoDesign() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [optionalPreview, setOptionalPreview] = useState<string | null>(null);
  const [optionalImage, setOptionalImage] = useState<File | null>(null);

  const handleSave = async () => {
    if (!text && !optionalImage) {
      alert("Please provide text or image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("prompt", text);

      if (optionalImage) {
        formData.append("reference_image", optionalImage);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logo/generate`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      setResultImage(data.image_url);

      console.log(data);

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" flex items-center justify-center p-6">

      <div className="w-full max-w-4xl  bg-white backdrop-blur-md shadow-xl rounded-2xl p-6 ">

        <div className="flex flex-col gap-5">

          {/* Input */}


          {/* Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <label className="cursor-pointer outline outline-dashed border-black/60 rounded-xl h-90  flex flex-col items-center justify-center bg-white/60 hover:bg-white transition">

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
                  Click to upload logo
                </span>
              )}

              {optionalPreview && (
                <Image
                  className="object-center w-full h-full rounded-xl"
                  src={optionalPreview}
                  height={100}
                  width={100}
                  alt="Preview"
                />
              )}
            </label>
            <div className="border h-[360px] border-dashed rounded-xl  flex items-center justify-center">
              {loading && <p>Generating...</p>}

              {!loading && resultImage && (
                <img
                  src={resultImage}
                  alt="Generated"
                  className="w-full h-full object-center rounded-xl"
                />
              )}

              {!loading && !resultImage && (
                <p className="text-gray-400">No image generated yet</p>
              )}
            </div>
          </div>
          <textarea
            className="w-[417px] px-4 py-2 rounded-xl outline outline-dashed border-black/60 bg-white/80"
            placeholder="Enter annotation text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-2 w-[417px] rounded-xl shadow-md hover:scale-[1.02] transition"
          >
            {loading ? "Processing...." : "Generate"}
          </button>

        </div>
      </div>
    </div>
  );
}