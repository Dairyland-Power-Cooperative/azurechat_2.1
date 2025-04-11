import { Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { FC, useRef, useState, ChangeEvent } from "react";
import { Button } from "../../button";
import { InputImageStore, useInputImage } from "./input-image-store";
import { normalizeImageForApi } from "@/features/common/util";

export const ImageInput: FC = () => {
  const { base64Image, previewImage } = useInputImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    fileInputRef.current?.click();
  };

  const resetFileInput = () => {
    InputImageStore.Reset();
  };

  // Handle file selection with normalization
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsProcessing(true);
    
    try {
      // Read the file as base64
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (typeof event.target?.result === 'string') {
          const originalBase64 = event.target.result;
          
          try {
            // Normalize the image
            console.debug("Original image size:", originalBase64.length);
            const normalizedBase64 = await normalizeImageForApi(originalBase64);
            console.debug("Normalized image size:", normalizedBase64.length);
            
            // Update the store with normalized image
            InputImageStore.UpdateBase64Image(normalizedBase64);
            
            // Generate preview (InputImageStore may already handle this)
            // If not, we may need to set the preview image here as well
          } catch (error) {
            console.error("Error normalizing image:", error);
            // Fallback to original if normalization fails
            InputImageStore.UpdateBase64Image(originalBase64);
          }
        }
        setIsProcessing(false);
      };
      
      reader.onerror = () => {
        console.error("Error reading file");
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-2">
      {previewImage && (
        <div className="relative overflow-hidden rounded-md w-[35px] h-[35px]">
          <Image src={previewImage} alt="Preview" fill={true} />
          <button
            className="absolute right-1 top-1 bg-background/20 rounded-full p-[2px]"
            onClick={resetFileInput}
            aria-label="Remove image from chat input"
          >
            <X size={12} className="stroke-background" />
          </button>
        </div>
      )}
      {isProcessing && (
        <div className="flex items-center text-xs text-muted-foreground">
          Processing image...
        </div>
      )}
      <input
        type="hidden"
        name="image-base64"
        value={base64Image}
        onChange={(e) => InputImageStore.UpdateBase64Image(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        name="image"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}  // Use our custom handler instead
      />
      <Button
        size="icon"
        variant={"ghost"}
        type="button"
        onClick={handleButtonClick}
        aria-label="Add an image to the chat input"
        disabled={isProcessing}
      >
        <ImageIcon size={16} />
      </Button>
    </div>
  );
};