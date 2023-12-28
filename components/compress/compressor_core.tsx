"use client";

import { useEffect, useRef, useState } from "react";

import InvalidImageType from "../error/InvalidImgType";
import Button from "../buttons&links/Button";
import Image from "next/image";
import { FaLock, FaLockOpen } from "react-icons/fa";
import { dataConverter } from "@/utils/common";

interface CompressorCoreProps {
  file: File;
  removeSelf: () => void;
  inputImageSrc: string
  setOutputImageSrc: (name: string, src: string) => void;
}

function CompressorCore({ file, removeSelf, inputImageSrc, setOutputImageSrc}: CompressorCoreProps) {
  const [W, setW] = useState<number>(0);
  const [H, setH] = useState<number>(0);
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [isError, setError] = useState({
    error: false,
    title: "",
    description: "",
  });
  const inputRef = useRef<HTMLImageElement>(null);
  const [outputImageSrc, setOutputImageSrcForSelf] = useState<string>("");
  const [outputImgLoad, setOutputImgLoad] = useState<number>(0);
  const [outputFileName, setOutputFileName] = useState<string>("");
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(false);
  const [aspectRatioW, setAspectRatioW] = useState<number>(1);
  const [aspectRatioH, setAspectRatioH] = useState<number>(1);

  const round = (num: number, r: number = 0): number => {
    const pow = Math.pow(10, r);
    return Math.floor(num * pow) / pow;
  };

  const isSupportedFileType = (file: File | null): boolean => {
    if (!file) return false;
    const supportedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
    return supportedFileTypes.includes(file.type);
  }

  useEffect(() => {
    if (aspectRatioLocked || !W || !H) return;
    if (W > H) {
      setAspectRatioW(W / H);
      setAspectRatioH(1);
    } else {
      setAspectRatioW(1);
      setAspectRatioH(H / W);
    }
  }, [W, H, aspectRatioLocked]);

  useEffect(() => {
    const fileName = file.name;
    const periodAt = fileName.lastIndexOf('.');
    const name = fileName.slice(0, periodAt);
    const extension = fileName.slice(periodAt);
    const newOutputFileName = `compressy_${name}_${W}x${H}${extension}`;
    setOutputFileName(newOutputFileName);

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (ctx && inputRef.current && canvas.width > 0 && canvas.height > 0) {
      ctx.drawImage(inputRef.current, 0, 0, canvas.width, canvas.height);
      ctx.canvas.toBlob((blob) => {
        if(!blob) return;
        const url = URL.createObjectURL(blob)
        setOutputImgLoad(blob.size);
        setOutputImageSrc(newOutputFileName, url);
        setOutputImageSrcForSelf(url);
      }, `image/${newOutputFileName.split('.').pop()}`, 100);
    }
  }, [W, H, file.name, inputRef, setOutputImageSrc, setOutputImageSrcForSelf]);

  useEffect(() => {
    if(!isSupportedFileType(file)){
      const description = "We only support JPG, JPEG, and PNG files. Please upload a valid image.";
      setError({ error: true, title: "Invalid Image Type", description });
      return;
    }

    if (!inputRef.current) return;

    inputRef.current.src = inputImageSrc;

    inputRef.current.onload = (event: Event) => {
      const target = event.target as HTMLImageElement;
      const imgHeight = target.naturalHeight;
      const imgWidth = target.naturalWidth;
      setImgSize({ width: imgWidth, height: imgHeight });
      setH(Math.round(imgHeight / 3));
      setW(Math.round(imgWidth / 3));
    };
    setError((prev) => ({ ...prev, error: false }));
  }, [inputRef, file, inputImageSrc]);

  const onWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newWidth = parseInt(e.target.value, 10);
    if (aspectRatioLocked) {
      const newHeight = Math.min(imgSize.height, Math.max(1, Math.round(newWidth * aspectRatioH / aspectRatioW)));
      newWidth = Math.round(newHeight * aspectRatioW / aspectRatioH);
      setH(newHeight);
    }
    setW(newWidth);
  }

  const onHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHeight = parseInt(e.target.value, 10);
    if (aspectRatioLocked) {
      const newWidth = Math.min(imgSize.width, Math.max(1, Math.round(newHeight * aspectRatioW / aspectRatioH)));
      newHeight = Math.round(newWidth * aspectRatioH / aspectRatioW);
      setW(newWidth);
    }
    setH(newHeight);
  }

  const resetControls = () => {
    setAspectRatioLocked(false);
    setH(Math.round(imgSize.height / 3));
    setW(Math.round(imgSize.width / 3));
  }

  const maximizeSize = () => {
    if (!aspectRatioLocked || !W || !H) {
      setH(imgSize.height);
      setW(imgSize.width);
    } else {
      let newHeight = imgSize.height;
      let newWidth = imgSize.width;
      if (W > H) {
        newHeight = Math.round(newWidth * aspectRatioH / aspectRatioW);
      } else if (H > W) {
        newWidth = Math.round(newHeight * aspectRatioW / aspectRatioH);
      }
      setW(newWidth);
      setH(newHeight);
    }
  }

  if (isError.error) {
    return (
      <InvalidImageType
        title={isError.title}
        description={isError.description}
      />
    );
  }

  return (
    <div className="container mx-auto space-y-4">
      <section className="p-4 py-12 max-w-screen-lg w-full mx-auto flex flex-col items-center justify-center gap-8 rounded-lg bg-gray-200 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">{file.name}</h1>
        <div className="w-full space-y-4">
          <div className="flex gap-8 justify-center items-center w-full">
            <label htmlFor="width" className="inline-block font-bold w-16">
              Width
            </label>
            <input
              id="width"
              type="range"
              min="1"
              max={imgSize.width}
              step="1"
              value={W}
              onChange={onWidthChange}
              className="max-w-sm w-full"
            />
            <span className="pl-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 font-bold">
              {W}
              <strong className="ml-3 rounded-r-lg p-2 px-2 bg-white dark:bg-black">
                PX
              </strong>
            </span>
          </div>
          <div className="flex gap-8 justify-center items-center w-full">
            <label htmlFor="height" className="inline-block font-bold w-16">
              Height
            </label>
            <input
              id="height"
              type="range"
              min="1"
              max={imgSize.height}
              step="1"
              value={H}
              onChange={onHeightChange}
              className="max-w-sm w-full"
            />
            <span className="pl-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 font-bold">
              {H}
              <strong className="ml-3 rounded-r-lg p-2 px-2 bg-white dark:bg-black">
                PX
              </strong>
            </span>
          </div>
        </div>
        <div className="btn-group flex gap-4">
          <Button
            className="!bg-red-500"
            onClick={removeSelf}
          >
            Delete
          </Button>
          <Button
            className="!bg-red-500"
            onClick={maximizeSize}
          >
            Max
          </Button>
          <Button
            onClick={resetControls}
          >
            Reset
          </Button>
          <div className="max-w-[150px] flex no-wrap rounded-lg bg-gray-100 dark:bg-gray-900 font-bold">
            <label className="cursor-pointer bg-white dark:bg-black rounded-l-lg p-2 px-4 ">
              <input type="checkbox" name="Lock Aspect Ratio" className="sr-only" checked={aspectRatioLocked} onChange={() => setAspectRatioLocked(!aspectRatioLocked)} />
              {aspectRatioLocked ? <FaLock className="h-5 w-5" style={{ marginRight: "2px" }} /> : <FaLockOpen className="h-5 w-5" style={{ marginLeft: "2px" }} />}
            </label>
            <span className="my-auto pl-3">{round(aspectRatioW, 2)}</span> 
            <span className="my-auto px-3">:</span> 
            <span className="my-auto pr-3">{round(aspectRatioH, 2)}</span> 
          </div>
        </div>
      </section>

      <section className="sm:flex h-fit max-w-screen-lg mx-auto overflow-hidden rounded-lg bg-blue-200">
        <figure className="w-full h-full aspect-square relative">
          <Image
            src={inputImageSrc}
            alt="Original image"
            ref={inputRef}
            width={500}
            height={500}
            quality={100}
            className="h-full w-full object-cover"
          />
          <figcaption className="absolute top-0 left-0 p-4 text-white text-shadow bg-opacity-75 bg-black">
            Original
            <strong> {dataConverter(file.size, 1024)}</strong>
          </figcaption>
        </figure>
        <figure className="w-full h-full aspect-square relative">
          <Image
            src={outputImageSrc || "/loading.png"}
            alt="Compressed image"
            id="img-output"
            width={500}
            height={500}
            quality={100}
            className="h-full w-full object-cover"
          />
          <figcaption className="absolute top-0 left-0 p-4 text-white text-shadow bg-opacity-75 bg-black">
            Compressed
            <strong> {dataConverter(outputImgLoad, 1360)}</strong>
          </figcaption>
        </figure>
      </section>

      {outputImageSrc && (
        <section className="max-w-screen-lg mx-auto p-0 space-y-4">
          <a
            href={outputImageSrc || "#"}
            download={outputFileName}
            className="bg-blue-500 rounded-lg py-3 text-xl text-center text-white font-bold p-2 duration-75 !border-transparent block"
          >
            Download
          </a>
        </section>
      )}
    </div>
  );
}

export default CompressorCore;
