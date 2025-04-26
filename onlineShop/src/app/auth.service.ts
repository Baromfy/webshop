import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, UserCredential, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedIn = new BehaviorSubject<boolean>(false);
  loggedIn$ = this.loggedIn.asObservable();

  private isAdminSubject = new BehaviorSubject<boolean | null>(null);
  isAdmin$ = this.isAdminSubject.asObservable();
  currentUserId: string | null = null;
  currentUser$ = this.loggedIn.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      this.loggedIn.next(!!user);
      if (user) {
        this.currentUserId = user.uid;
        this.loadAdminStatus(user.uid);
      } else {
        this.currentUserId = null;
        this.isAdminSubject.next(null);
      }
    });
   }

   getId() {
    const user = this.auth.currentUser;
    if (user) {
      this.currentUserId = user.uid;
      return user.uid;
    } else {
      return null;
    }
  }

   private async loadAdminStatus(uid: string) {
    const userDoc = doc(this.firestore, `users/${uid}`);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
      this.isAdminSubject.next(userSnap.data()['isAdmin'] === true);
    } else {
      this.isAdminSubject.next(false);
    }
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  async register(email: string, password: string): Promise<void> {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(this.auth, email, password);

    const uid = userCredential.user?.uid;

    if (uid) {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userDocRef, {
        email: email,
        isAdmin: false,
      });
    }
  }

  async isAdmin(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (user) {
      const userDoc = doc(this.firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        return userSnap.data()['isAdmin'] === true;
      }
    }
    return false;
  }



}
