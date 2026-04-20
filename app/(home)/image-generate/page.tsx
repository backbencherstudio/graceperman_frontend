"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pencil, Pointer } from "lucide-react";
import { useImageGenMutation } from "@/redux/features/ImageGen/ImageGenerate";

type Point = { x: number; y: number };
export default function ImageAnnotator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [optionalImage, setOptionalImage] = useState<File | null>(null);
  const [optionalPreview, setOptionalPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [isPencilActive, setIsPencilActive] = useState(true);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageGen, { isLoading, data, error }] = useImageGenMutation();

  const [showText, setShowText] = useState(false);

  const historyRef = useRef<ImageData[]>([]);
  const stepRef = useRef(-1);
  const startStateRef = useRef<ImageData | null>(null);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    historyRef.current = historyRef.current.slice(0, stepRef.current + 1);
    historyRef.current.push(imageData);

    stepRef.current++;
  };

  const brushColor = "#ff0000";
  const brushSize = 3;
  const drawImage = (url: string) => {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;

      ctxRef.current = ctx;
    };
  };
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    drawImage(url);
  };
  const getPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPencilActive) return;

    setIsDrawing(true);
    setLastPoint(getPoint(e));

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (canvas && ctx) {
      startStateRef.current = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !lastPoint || !isPencilActive) return;

    const newPoint = getPoint(e);
    const ctx = ctxRef.current;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(newPoint.x, newPoint.y);
    ctx.stroke();

    setLastPoint(newPoint);
  };
  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPoint(null);

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    historyRef.current = historyRef.current.slice(0, stepRef.current + 1);
    historyRef.current.push(imageData);

    stepRef.current++;
  };

  //  FIXED undo
  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    if (stepRef.current <= 0) return;

    stepRef.current--;

    const imageData = historyRef.current[stepRef.current];
    ctx.putImageData(imageData, 0, 0);
  };

  //  Ctrl + Z fix
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();

      const file = new File([blob], "annotated.png", {
        type: "image/png",
      });

      formData.append("base_image", file);

      // optional image (SAFE)
      if (optionalImage instanceof File) {
        formData.append("mask_image", optionalImage);
      }

      formData.append("prompt", text || "");

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/edit/area`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        setResultImage(data.image_url);

        console.log("SUCCESS:", data);
      } catch (err) {
        console.log("ERROR:", err);
      } finally {
        setLoading(false);
      }
    }, "image/png");
  };
  const clearCanvas = () => {
    if (imageUrl) drawImage(imageUrl);
  };

  return (
    <div className="
       flex justify-center items-center mx-auto  w-full max-w-5xl bg-white backdrop-blur-md shadow-xl rounded-2xl px-6 border border-white/40">
      <div style={{ padding: 20 }}>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-9">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-0 ">
            <div>
              <div className="flex justify-between">
                <div>
                  <h2>Image Annotator</h2>

                  {/* Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className=" border rounded border-dashed px-1 cursor-pointer"
                  />
                </div>

                {/* Pencil Toggle */}
                <button
                  onClick={() => setIsPencilActive(!isPencilActive)}
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background: isPencilActive ? "green" : "gray",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    borderRadius: "5px",
                  }}
                  className="cursor-pointer">
                  <Pencil size={16} />
                  {isPencilActive}
                </button>
              </div>

              {/* Canvas */}
              <div className=" mt-5 w-[400px]">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    cursor: "url('/image/pencil.png.jpg') 0 32, pointer",
                    width: "100%",
                    height: "300px",
                  }}
                  className="cursor-pointer   transition border-1 border-dashed border-black/60 rounded-xl h-80 flex flex-col items-center justify-center  hover:bg-white/30 "
                />
              </div>
            </div>

            {/* second image */}
            <div className="mt-4 relative  ">
              <h2 className="pb-2">Optional Image</h2>

              <label className="cursor-pointer border-1 border-dashed border-black/60 rounded-xl h-65 w-100 flex flex-col items-center justify-center  hover:bg-white/30 transition">
                <input
                  type="file"
                  className="hidden "
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setOptionalImage(file);
                    setOptionalPreview(URL.createObjectURL(file));
                  }}
                />
                {optionalImage ? (
                  <div className="absolute top-2 left-2 bg-white bg-opacity-75 px-1 text-sm ">
                    {showText}
                  </div>
                ) : (
                  <span className="text-gray-500">
                    Click to upload optional image
                  </span>
                )}

                {/* Preview */}
                {optionalPreview && (
                  <img
                    className=" object-center rounded-xl  w-full h-full"
                    src={optionalPreview}
                    alt="Optional Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
              </label>
            </div>
          </div>

          {/* response image show */}

          <div className="lg:mt-10">
            <h2 className="pb-2">Generated Image</h2>
            <div className="border h-[300px] border-black/60 border-dashed rounded-xl">

              {resultImage && (
                <div className="">


                  <img
                    src={resultImage}
                    alt="result"
                    className=" w-full h-75 rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text Input */}
        <textarea
          className=" cursor-pointer border-1 border-dashed border-black/60 rounded-xl w-[400px] flex flex-col items-center justify-center  hover:bg-white/30 transition"
          placeholder="Enter annotation text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ marginTop: 20, padding: 5 }}
        />

        {/* Buttons */}
        <div style={{ marginTop: 10 }}>
          {/* <button onClick={clearCanvas}>Clear</button> */}
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ marginLeft: 0 }}
            className="bg-gradient-to-r cursor-pointer from-blue-500 via-indigo-500 to-purple-500 text-white py-2 rounded-xl shadow-md hover:scale-[1.02] transition w-[400px]"
          >
            {loading ? "Processing...." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}







// "use client";


// import React, { useEffect, useRef, useState } from "react";
// import { Pencil } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useImageGenMutation } from "@/redux/features/ImageGen/ImageGenerate";


// type Point = { x: number; y: number };
// export default function ImageAnnotator() {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

//   const [mode, setMode] = useState<"pencil" | "circle">("circle");
//   const [startPoint, setStartPoint] = useState<Point | null>(null);
//   const [resultImage, setResultImage] = useState<string | null>(null);

//   const [optionalImage, setOptionalImage] = useState<File | null>(null);
//   const [optionalPreview, setOptionalPreview] = useState<string | null>(null);
//   const [imageUrl, setImageUrl] = useState("");
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [lastPoint, setLastPoint] = useState<Point | null>(null);
//   const [isPencilActive, setIsPencilActive] = useState(true);
//   const [text, setText] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [imageGen, { isLoading, data, error }] = useImageGenMutation();


//   const [showText, setShowText] = useState(false);


//   const historyRef = useRef<ImageData[]>([]);
//   const stepRef = useRef(-1);
//   const startStateRef = useRef<ImageData | null>(null);


//   const saveState = () => {
//     const canvas = canvasRef.current;
//     const ctx = ctxRef.current;
//     if (!canvas || !ctx) return;


//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);


//     historyRef.current = historyRef.current.slice(0, stepRef.current + 1);
//     historyRef.current.push(imageData);


//     stepRef.current++;
//   };


//   const brushColor = "#ff0000";
//   const brushSize = 3;
//   const drawImage = (url: string) => {
//     const img = new Image();
//     img.src = url;


//     img.onload = () => {
//       const canvas = canvasRef.current;
//       if (!canvas) return;


//       canvas.width = img.width;
//       canvas.height = img.height;


//       const ctx = canvas.getContext("2d");
//       if (!ctx) return;


//       ctx.drawImage(img, 0, 0);


//       ctx.lineCap = "round";
//       ctx.lineJoin = "round";
//       ctx.strokeStyle = brushColor;
//       ctx.lineWidth = brushSize;


//       ctxRef.current = ctx;
//     };
//   };
//   const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;


//     const url = URL.createObjectURL(file);
//     setImageUrl(url);
//     drawImage(url);
//   };
//   const getPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current!;
//     const rect = canvas.getBoundingClientRect();


//     const scaleX = canvas.width / rect.width;
//     const scaleY = canvas.height / rect.height;


//     return {
//       x: (e.clientX - rect.left) * scaleX,
//       y: (e.clientY - rect.top) * scaleY,
//     };
//   };


//   const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     const point = getPoint(e);
//     setStartPoint(point);
//     setIsDrawing(true);
//   };


//   const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (!isDrawing || !startPoint || !ctxRef.current) return;


//     const ctx = ctxRef.current;
//     const canvas = canvasRef.current!;
//     const current = getPoint(e);




//     ctx.clearRect(0, 0, canvas.width, canvas.height);




//     const img = new Image();
//     img.src = imageUrl;


//     ctx.drawImage(img, 0, 0, canvas.width, canvas.height);



//     const radiusX = (current.x - startPoint.x) / 2;
//     const radiusY = (current.y - startPoint.y) / 2;


//     const centerX = startPoint.x + radiusX;
//     const centerY = startPoint.y + radiusY;


//     ctx.beginPath();
//     ctx.ellipse(
//       centerX,
//       centerY,
//       Math.abs(radiusX),
//       Math.abs(radiusY),
//       0,
//       0,
//       Math.PI * 2
//     );


//     ctx.strokeStyle = "red";
//     ctx.lineWidth = 2;
//     ctx.stroke();
//   };
//   const handleMouseUp = () => {
//     setIsDrawing(false);
//     setLastPoint(null);


//     const canvas = canvasRef.current;
//     const ctx = ctxRef.current;


//     if (!canvas || !ctx) return;


//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);


//     historyRef.current = historyRef.current.slice(0, stepRef.current + 1);
//     historyRef.current.push(imageData);


//     stepRef.current++;
//   };


//   // ✅ FIXED undo
//   const undo = () => {
//     const canvas = canvasRef.current;
//     const ctx = ctxRef.current;
//     if (!canvas || !ctx) return;


//     if (stepRef.current <= 0) return;


//     stepRef.current--;


//     const imageData = historyRef.current[stepRef.current];
//     ctx.putImageData(imageData, 0, 0);
//   };


//   // ✅ Ctrl + Z fix
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.ctrlKey && e.key === "z") {
//         e.preventDefault();
//         undo();
//       }
//     };


//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, []);


//   const handleSave = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     setLoading(true);

//     canvas.toBlob(async (blob) => {
//       if (!blob) return;

//       const formData = new FormData();

//       const file = new File([blob], "annotated.png", {
//         type: "image/png",
//       });

//       formData.append("base_image", file);

//       // optional image (SAFE)
//       if (optionalImage instanceof File) {
//         formData.append("mask_image", optionalImage);
//       }

//       formData.append("prompt", text || "");

//       try {
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/edit/area`,
//           {
//             method: "POST",
//             body: formData,
//           }
//         );

//         const data = await res.json();
//         setResultImage(data.image_url);

//         console.log("SUCCESS:", data);
//       } catch (err) {
//         console.log("ERROR:", err);
//       } finally {
//         setLoading(false);
//       }
//     }, "image/png");
//   };

//   const clearCanvas = () => {
//     if (imageUrl) drawImage(imageUrl);
//   };


//   return (
//     <div className="
//        flex justify-center items-center mx-auto  w-full max-w-5xl bg-white backdrop-blur-md shadow-xl rounded-2xl px-6 border border-white/40">
//       <div style={{ padding: 20 }}>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-9">
//           <div className="grid grid-cols-1 lg:grid-cols-1 gap-0 ">
//             <div>
//               <div className="flex justify-between">
//                 <div>
//                   <h2>Image Annotator</h2>

//                   {/* Upload */}
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleUpload}
//                     className=" border rounded border-dashed px-1 cursor-pointer"
//                   />
//                 </div>

//                 {/* Pencil Toggle */}
//                 <button
//                   onClick={() => setIsPencilActive(!isPencilActive)}
//                   style={{
//                     marginTop: 10,
//                     padding: "8px 12px",
//                     background: isPencilActive ? "green" : "gray",
//                     color: "#fff",
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "5px",
//                     borderRadius: "5px",
//                   }}
//                   className="cursor-pointer">
//                   <Pencil size={16} />
//                   {isPencilActive}
//                 </button>
//               </div>

//               {/* Canvas */}
//               <div className=" mt-5 w-[400px]">
//                 <canvas
//                   ref={canvasRef}
//                   onMouseDown={handleMouseDown}
//                   onMouseMove={handleMouseMove}
//                   onMouseUp={handleMouseUp}
//                   onMouseLeave={handleMouseUp}
//                   style={{
//                     cursor: "url('/image/pencil.png.jpg') 0 32, pointer",
//                     width: "100%",
//                     height: "300px",
//                   }}
//                   className="cursor-pointer   transition border-1 border-dashed border-black/60 rounded-xl h-80 flex flex-col items-center justify-center  hover:bg-white/30 "
//                 />
//               </div>
//             </div>

//             {/* second image */}
//             <div className="mt-4 relative  ">
//               <h2 className="pb-2">Optional Image</h2>

//               <label className="cursor-pointer border-1 border-dashed border-black/60 rounded-xl h-65 w-100 flex flex-col items-center justify-center  hover:bg-white/30 transition">
//                 <input
//                   type="file"
//                   className="hidden "
//                   accept="image/*"
//                   onChange={(e) => {
//                     const file = e.target.files?.[0];
//                     if (!file) return;

//                     setOptionalImage(file);
//                     setOptionalPreview(URL.createObjectURL(file));
//                   }}
//                 />
//                 {optionalImage ? (
//                   <div className="absolute top-2 left-2 bg-white bg-opacity-75 px-1 text-sm ">
//                     {showText}
//                   </div>
//                 ) : (
//                   <span className="text-gray-500">
//                     Click to upload optional image
//                   </span>
//                 )}

//                 {/* Preview */}
//                 {optionalPreview && (
//                   <img
//                     className=" object-center rounded-xl  w-full h-full"
//                     src={optionalPreview}
//                     alt="Optional Preview"
//                     style={{
//                       width: "100%",
//                       height: "100%",
//                     }}
//                   />
//                 )}
//               </label>
//             </div>
//           </div>

//           {/* response image show */}

//           <div className="lg:mt-10">
//             <h2 className="pb-2">Generated Image</h2>
//             <div className="border h-[300px] border-black/60 border-dashed rounded-xl">

//               {resultImage && (
//                 <div className="">


//                   <img
//                     src={resultImage}
//                     alt="result"
//                     className=" w-full h-75 rounded-xl"
//                   />
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Text Input */}
//         <textarea
//           className=" cursor-pointer border-1 border-dashed border-black/60 rounded-xl w-[400px] flex flex-col items-center justify-center  hover:bg-white/30 transition"
//           placeholder="Enter annotation text..."
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           style={{ marginTop: 20, padding: 5 }}
//         />

//         {/* Buttons */}
//         <div style={{ marginTop: 10 }}>
//           {/* <button onClick={clearCanvas}>Clear</button> */}
//           <button
//             onClick={handleSave}
//             disabled={loading}
//             style={{ marginLeft: 0 }}
//             className="bg-gradient-to-r cursor-pointer from-blue-500 via-indigo-500 to-purple-500 text-white py-2 rounded-xl shadow-md hover:scale-[1.02] transition w-[400px]"
//           >
//             {loading ? "Processing...." : "Generate"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
