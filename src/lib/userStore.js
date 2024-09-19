import { create } from "zustand";
import { db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { update } from "firebase/database";

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  fetchUserInfo: async (uid) => {
    try {
      const docref = doc(db, "users", uid);
      const docSnap = await getDoc(docref);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.log(err);
      set({ currentUser: null, isLoading: false });
    }
  },

  resetUser() {
    set({ currentUser: null, isLoading: false });
  },

  setOnline: async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        online: true,
      });
    } catch (err) {
      console.log(err);
    }
  },

  setOffline: async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        online: false,
      });
    } catch (err) {
      console.log(err);
    }
  },
}));
