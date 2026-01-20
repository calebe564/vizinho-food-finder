import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setIsModalOpen(false);
  };

  // For single image, show compact view
  if (images.length === 1) {
    return (
      <div className={cn("", className)}>
        <button 
          className="relative w-full aspect-[3/1] max-h-[180px] rounded-xl overflow-hidden bg-secondary cursor-pointer group"
          onClick={() => setIsModalOpen(true)}
        >
          <img
            src={images[0]}
            alt="Imagem do estabelecimento"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* Fullscreen Modal for single image */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent 
            className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0"
            onKeyDown={handleKeyDown}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              <img
                src={images[0]}
                alt="Imagem do estabelecimento"
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* COMPACT THUMBNAIL GALLERY - Not a large slide */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {images.slice(0, 5).map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedIndex(index);
              setIsModalOpen(true);
            }}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
              "border-transparent hover:border-primary/50 hover:ring-2 hover:ring-primary/20"
            )}
          >
            <img
              src={image}
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
        
        {/* Show "+N" if more than 5 images */}
        {images.length > 5 && (
          <button
            onClick={() => {
              setSelectedIndex(5);
              setIsModalOpen(true);
            }}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <span className="text-lg font-bold text-muted-foreground">
              +{images.length - 5}
            </span>
          </button>
        )}
      </div>

      {/* Fullscreen Modal with navigation */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* Main image */}
            <img
              src={images[selectedIndex]}
              alt={`Imagem ${selectedIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>

            {/* Thumbnails at bottom */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto p-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all",
                    selectedIndex === index
                      ? "border-white ring-2 ring-white/50"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={image}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
