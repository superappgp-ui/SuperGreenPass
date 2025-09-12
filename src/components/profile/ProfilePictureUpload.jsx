import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { UploadFile } from "@/api/integrations";
import { Upload, Loader2 } from "lucide-react";

export default function ProfilePictureUpload({ currentPicture, onUpdate }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Invalid image type. Please use jpg, png, or webp.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('Image size cannot exceed 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      onUpdate(file_url);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex items-center gap-4">
      <img 
        src={currentPicture || `https://api.dicebear.com/7.x/initials/svg?seed=${'User'}`} 
        alt="Profile" 
        className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
      />
      <div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/png, image/jpeg, image/webp"
          disabled={isUploading}
        />
        <Button variant="outline" size="sm" onClick={handleClick} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Change Photo
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP up to 2MB</p>
      </div>
    </div>
  );
};