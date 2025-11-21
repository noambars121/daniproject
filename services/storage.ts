import { Slide } from '../types';

const DB_NAME = 'BirthdayDB';
const STORE_NAME = 'slides';
const DB_VERSION = 1;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveSlidesToStorage = async (slides: Slide[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing to ensure sync
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
          if (slides.length === 0) {
              resolve();
              return;
          }
          
          let processed = 0;
          let errorOccurred = false;

          slides.forEach((slide, index) => {
            // Save with order to persist the array sequence
            const slideToSave = { ...slide, order: index };
            const putRequest = store.put(slideToSave);
            
            putRequest.onsuccess = () => {
                processed++;
                if (processed === slides.length) {
                    resolve();
                }
            };
            putRequest.onerror = (e) => {
                console.error("Error saving slide", slide.id, e);
                if (!errorOccurred) {
                    errorOccurred = true;
                    reject(putRequest.error);
                }
            };
          });
      };
      
      transaction.onerror = () => reject(transaction.error);
    };
  });
};

export const loadSlidesFromStorage = async (): Promise<Slide[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const slides = getAllRequest.result as Slide[];
        
        // Sort slides based on order field, with fallback for legacy data
        slides.sort((a, b) => {
            // Primary sort: Explicit order field
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }

            // Fallback: Fix specifically for "default" vs timestamp IDs
            // "default" should come first (index 0), timestamps (new slides) should come after.
            const isDefaultA = String(a.id).startsWith('default');
            const isDefaultB = String(b.id).startsWith('default');
            
            if (isDefaultA && !isDefaultB) return -1;
            if (!isDefaultA && isDefaultB) return 1;

            // Secondary Fallback: ID comparison
            return String(a.id).localeCompare(String(b.id));
        });

        resolve(slides);
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
};