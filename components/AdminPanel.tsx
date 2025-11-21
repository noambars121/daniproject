import React, { useState, useRef } from 'react';
import { Slide } from '../types';
import { generateSlideContent } from '../services/geminiService';
import { Upload, Wand2, Trash2, Plus, Loader2, Image as ImageIcon, Edit2, GripVertical } from 'lucide-react';

interface AdminPanelProps {
  slides: Slide[];
  currentSlideIndex: number;
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
  setCurrentSlideIndex: (index: number) => void;
  closePanel: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  slides,
  currentSlideIndex,
  setSlides,
  setCurrentSlideIndex,
  closePanel
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);

  const currentSlide = slides[currentSlideIndex];

  const handleAddSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const fileList = Array.from(files) as File[];
    
    // Reset input so the same files can be selected again if needed
    e.target.value = '';

    setIsGenerating(true);
    
    try {
        // 1. Create placeholders for all images immediately
        const newSlidesData = await Promise.all(fileList.map(async (file) => {
            return new Promise<{id: string, imageData: string}>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        // Use prefix to ensure new slides sort after "default" if order is missing
                        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        imageData: reader.result as string
                    });
                };
                reader.readAsDataURL(file);
            });
        }));

        const newSlides: Slide[] = newSlidesData.map(data => ({
            ...data,
            title: 'טוען תיאור...',
            description: 'Gemini מנתח את התמונה...'
        }));

        // Append new slides
        setSlides(prev => [...prev, ...newSlides]);
        
        // NOTE: We specifically DO NOT update currentSlideIndex here, 
        // so the user stays on their current view as requested.

        // 2. Process AI content in background for each slide
        // We don't await this for the UI update, but we update state as they finish
        newSlides.forEach(async (slide) => {
            try {
                const content = await generateSlideContent(slide.imageData);
                setSlides(prev => prev.map(s => 
                    s.id === slide.id ? { ...s, ...content } : s
                ));
            } catch (error) {
                setSlides(prev => prev.map(s => 
                    s.id === slide.id ? { ...s, title: 'תמונה חדשה', description: 'ניתן לערוך ידנית' } : s
                ));
            }
        });

    } catch (error) {
        console.error("Error adding slides:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSlide) return;

    // Reset input
    e.target.value = '';

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        const updatedSlides = [...slides];
        updatedSlides[currentSlideIndex] = {
            ...updatedSlides[currentSlideIndex],
            imageData: base64
        };
        setSlides(updatedSlides);
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (field: 'title' | 'description', value: string) => {
      if (!currentSlide) return;
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = {
          ...updatedSlides[currentSlideIndex],
          [field]: value
      };
      setSlides(updatedSlides);
  };

  const handleRegenerateCurrent = async () => {
      if (!currentSlide) return;
      setIsGenerating(true);
      try {
          const content = await generateSlideContent(currentSlide.imageData);
          const updatedSlides = [...slides];
          updatedSlides[currentSlideIndex] = { ...currentSlide, ...content };
          setSlides(updatedSlides);
      } catch (error) {
          console.error("Failed to regenerate", error);
      } finally {
          setIsGenerating(false);
      }
  };

  const deleteSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentSlideIndex >= newSlides.length) {
        setCurrentSlideIndex(Math.max(0, newSlides.length - 1));
    }
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Allow moving
    e.dataTransfer.effectAllowed = "move";
    // Optional: Set a transparent image or styling if needed, 
    // but default browser behavior is usually fine.
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSlides = [...slides];
    const [movedItem] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, movedItem);

    // Logic to keep the selection on the same slide, even if it moved
    const currentSlideId = slides[currentSlideIndex].id;
    
    setSlides(newSlides);
    
    // Find where the previously selected slide ended up
    const newCurrentIndex = newSlides.findIndex(s => s.id === currentSlideId);
    if (newCurrentIndex !== -1) {
        setCurrentSlideIndex(newCurrentIndex);
    }

    setDraggedIndex(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col border-l border-gray-200 overflow-hidden transition-transform duration-300 font-sans">
      
      <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">עורך המצגת</h2>
          <button onClick={closePanel} className="text-white/80 hover:text-white bg-white/10 px-3 py-1 rounded-full text-sm">סגור</button>
        </div>
        <p className="text-xs text-blue-100 opacity-90">
          בחר שקופית לעריכה או גרור לשינוי סדר
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Current Slide Editor */}
        {currentSlide && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden ring-1 ring-black/5">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Edit2 size={16} className="text-blue-600" />
                        עריכת שקופית נוכחית
                    </h3>
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{currentSlideIndex + 1}</span>
                </div>
                
                <div className="p-4 space-y-4">
                    {/* Image Actions */}
                    <div className="flex gap-4">
                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative group">
                            <img src={currentSlide.imageData} className="w-full h-full object-cover" alt="Current" />
                        </div>
                        <div className="flex-1 flex flex-col gap-2 justify-center">
                            <input 
                                type="file" 
                                ref={replaceImageInputRef} 
                                onChange={handleReplaceImage} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            <button 
                                onClick={() => replaceImageInputRef.current?.click()}
                                className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2 transition-all"
                            >
                                <ImageIcon size={14} />
                                החלף תמונה
                            </button>
                            <button 
                                onClick={handleRegenerateCurrent}
                                disabled={isGenerating}
                                className="w-full py-2 px-3 bg-purple-50 border border-purple-200 rounded-lg text-xs font-bold text-purple-700 hover:bg-purple-100 flex items-center justify-center gap-2 transition-all"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                {isGenerating ? 'חושב...' : 'שכתב טקסט (AI)'}
                            </button>
                        </div>
                    </div>

                    {/* Text Inputs */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">כותרת</label>
                            <input 
                                type="text" 
                                value={currentSlide.title}
                                onChange={(e) => handleTextChange('title', e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm font-bold transition-all"
                                placeholder="הכנס כותרת..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">תיאור</label>
                            <textarea 
                                rows={3}
                                value={currentSlide.description}
                                onChange={(e) => handleTextChange('description', e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 text-sm resize-none leading-relaxed transition-all"
                                placeholder="הכנס תיאור..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Add New Slide Button */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 rounded-xl p-4 flex flex-row items-center justify-center gap-3 cursor-pointer transition-all group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAddSlide} 
            accept="image/*"
            multiple 
            className="hidden" 
          />
          <div className="bg-blue-100 p-2 rounded-full group-hover:scale-110 transition-transform">
            <Plus className="text-blue-600" size={20} />
          </div>
          <div className="text-right">
            <span className="block font-bold text-blue-900 text-sm">הוסף שקופיות</span>
            <span className="block text-xs text-blue-500">ניתן לבחור מספר תמונות יחד</span>
          </div>
        </div>

        {/* Slides List */}
        <div className="space-y-2">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-3">כל השקופיות ({slides.length})</h3>
            {slides.map((slide, idx) => (
                <div 
                    key={slide.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`relative flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                        currentSlideIndex === idx 
                        ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-500 shadow-sm' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    } ${draggedIndex === idx ? 'opacity-50 scale-95 border-dashed border-gray-400' : ''}`}
                >
                    {/* Drag Handle */}
                    <div className="cursor-move text-gray-400 hover:text-gray-600 p-1">
                        <GripVertical size={16} />
                    </div>

                    <div className="relative w-12 h-12 shrink-0">
                        <img src={slide.imageData} alt="" className="w-full h-full object-cover rounded border border-gray-200" />
                        <div className="absolute inset-0 rounded ring-1 ring-inset ring-black/10"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${currentSlideIndex === idx ? 'font-bold text-blue-900' : 'font-medium text-gray-700'}`}>
                            {slide.title || "ללא כותרת"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{slide.description || "..."}</p>
                    </div>
                    <button 
                        onClick={(e) => deleteSlide(e, idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="מחק שקופית"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
      </div>
      
      <div className="p-4 border-t bg-gray-50 shrink-0">
          <button 
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98]"
            onClick={closePanel}
          >
              חזור להצגה
          </button>
      </div>
    </div>
  );
};