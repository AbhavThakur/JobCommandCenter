import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

/**
 * A custom hook to synchronize state with Firestore.
 * This mirrors the exact implementation footprint of our `useLocalStorage` hook
 * so that we can do a seamless 1:1 replacement in our components.
 */
export default function useFirestore(collectionKey, docKey, initialValue) {
  // We use combination of collection/doc. 
  // If we just want flat key-value pairs like our localStorage, we can use 
  // collection = 'growthTracker', docKey = our existing localstorage key.
  
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase isn't initialized or user isn't logged in, fallback to initial state
    if (!db || !auth.currentUser) {
       
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    const docRef = doc(db, `users/${userId}/${collectionKey}`, docKey);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        // We nest the value under a 'data' field to support arrays and primitives natively
        setStoredValue(snapshot.data().data);
      } else {
        // Initialize doc if it doesn't exist yet
        setDoc(docRef, { data: initialValue }, { merge: true });
        setStoredValue(initialValue);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionKey, docKey]); // Added deps but assumed relatively stable

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Immediately update local state for fast UI response
      setStoredValue(valueToStore);
      
      // Sync to Firebase in background
      if (db && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const docRef = doc(db, `users/${userId}/${collectionKey}`, docKey);
        await setDoc(docRef, { data: valueToStore }, { merge: true });
      }
    } catch (error) {
      console.error("Error writing to Firestore:", error);
    }
  };

  return [storedValue, setValue, loading];
}
