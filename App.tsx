import React, { useState, useEffect } from 'react';
import { UserRole, Slide } from './types';
import { SlideViewer } from './components/SlideViewer';
import { AdminPanel } from './components/AdminPanel';
import { initDB, loadSlidesFromStorage, saveSlidesToStorage } from './services/storage';
import { Settings, Lock, Gift, Loader2, AlertTriangle } from 'lucide-react';

const DEFAULT_SLIDE: Slide = {
    id: 'default-1',
    imageData: 'https://picsum.photos/1920/1080',
    title: 'יום הולדת 24 לדניאל!',
    description: 'ברוכים הבאים לחגיגה. תכף מתחילים...'
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.UNSELECTED);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Authentication State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    const init = async () => {
        try {
            await initDB();
            const storedSlides = await loadSlidesFromStorage();
            
            if (storedSlides && storedSlides.length > 0) {
                setSlides(storedSlides);
                setCurrentSlideIndex(0); // Ensure we start at the beginning
            } else {
                // Fallback/Migration from localStorage
                const localSlides = localStorage.getItem('daniel_bday_slides');
                if (localSlides) {
                    try {
                        const parsed = JSON.parse(localSlides);
                        setSlides(parsed);
                        setCurrentSlideIndex(0);
                        // Migrate to DB
                        await saveSlidesToStorage(parsed);
                        // Clean up local storage
                        localStorage.removeItem('daniel_bday_slides');
                    } catch (e) {
                        setSlides([DEFAULT_SLIDE]);
                        setCurrentSlideIndex(0);
                    }
                } else {
                    setSlides([DEFAULT_SLIDE]);
                    setCurrentSlideIndex(0);
                }
            }
        } catch (e) {
            console.error("Storage init error", e);
            setSlides([DEFAULT_SLIDE]);
            setCurrentSlideIndex(0);
        } finally {
            setIsLoading(false);
        }
    };
    init();
  }, []);

  // Save to IndexedDB on change
  useEffect(() => {
    if (slides.length > 0) {
      saveSlidesToStorage(slides).catch(err => console.error("Failed to save slides to DB", err));
    }
  }, [slides]);

  const handleNext = () => {
    setCurrentSlideIndex(prev => Math.min(prev + 1, slides.length - 1));
  };

  const handlePrevious = () => {
    setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
  };

  const handleAdminAuth = (e: React.FormEvent) => {
      e.preventDefault();
      // Simple weak password for demo purposes - "24" for age 24
      if (passcode === '24' || passcode === 'admin') {
          setRole(UserRole.ADMIN);
          setIsAuthModalOpen(false);
          setShowAdminPanel(true);
          setAuthError(false);
      } else {
          setAuthError(true);
      }
  };

  if (isLoading) {
      return (
          <div className="h-screen w-full bg-black flex items-center justify-center text-white">
              <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
      );
  }

  // Role Selection Screen
  if (role === UserRole.UNSELECTED) {
      return (
          <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
              {/* Background Accents */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[100px]"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[100px]"></div>
              </div>

              <div className="z-10 max-w-md w-full space-y-8 text-center">
                  <div className="space-y-2">
                      <Gift size={64} className="mx-auto text-blue-400 mb-4" />
                      <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400" style={{fontFamily: 'Heebo'}}>
                          יום הולדת שמח!
                      </h1>
                      <p className="text-gray-400 text-lg">ברוכים הבאים למצגת יום ההולדת של דניאל</p>
                  </div>

                  <div className="grid gap-4 mt-8">
                      <button 
                          onClick={() => setRole(UserRole.GUEST)}
                          className="group relative px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all flex items-center justify-center gap-3 overflow-hidden"
                      >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                          <span className="text-xl font-bold relative z-10">אני אורח/ת</span>
                      </button>
                      
                      <button 
                          onClick={() => setIsAuthModalOpen(true)}
                          className="px-6 py-3 bg-transparent hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-sm flex items-center justify-center gap-2"
                      >
                          <Lock size={16} />
                          <span>ניהול מצגת</span>
                      </button>
                  </div>
              </div>

              {/* Admin Auth Modal */}
              {isAuthModalOpen && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl">
                          <h3 className="text-xl font-bold mb-4 text-center">כניסת מנהל</h3>
                          <form onSubmit={handleAdminAuth} className="space-y-4">
                              <div className="space-y-2">
                                  <input 
                                      type="password" 
                                      value={passcode}
                                      onChange={(e) => setPasscode(e.target.value)}
                                      placeholder="קוד גישה (רמז: הגיל)"
                                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                                      autoFocus
                                  />
                                  {authError && <p className="text-red-400 text-xs text-center flex items-center justify-center gap-1"><AlertTriangle size={12}/> סיסמה שגויה</p>}
                              </div>
                              <div className="flex gap-2">
                                  <button type="button" onClick={() => setIsAuthModalOpen(false)} className="flex-1 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">ביטול</button>
                                  <button type="submit" className="flex-1 py-2 bg-blue-600 rounded-lg text-sm font-bold hover:bg-blue-500">כנס</button>
                              </div>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* Main Slide Viewer */}
      {slides.length > 0 && (
          <SlideViewer 
            slide={slides[currentSlideIndex]}
            hasPrevious={currentSlideIndex > 0}
            hasNext={currentSlideIndex < slides.length - 1}
            onNext={handleNext}
            onPrevious={handlePrevious}
            role={role}
          />
      )}

      {/* Admin Controls Toggle */}
      {role === UserRole.ADMIN && (
          <button
            onClick={() => setShowAdminPanel(true)}
            className={`absolute top-4 right-4 z-40 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-white transition-all ${showAdminPanel ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="פתח עורך"
          >
              <Settings size={24} />
          </button>
      )}

      {/* Admin Panel Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-50 transition-transform duration-500 ${showAdminPanel ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="pointer-events-auto h-full">
            {showAdminPanel && (
                <AdminPanel 
                    slides={slides}
                    currentSlideIndex={currentSlideIndex}
                    setSlides={setSlides}
                    setCurrentSlideIndex={setCurrentSlideIndex}
                    closePanel={() => setShowAdminPanel(false)}
                />
            )}
          </div>
      </div>

    </div>
  );
};

export default App;