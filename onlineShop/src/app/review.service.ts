import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  async addReview(productId: string, comment: string) {
    if (!this.auth.currentUser) {
      throw new Error('Nincs bejelentkezett felhasználó');
    }
    
    const review = {
      productId,
      userId: this.auth.currentUser.uid,
      userEmail: this.auth.currentUser.email,
      comment,
      createdAt: new Date()
    };
    
    const reviewsCollection = collection(this.firestore, 'reviews');
    return await addDoc(reviewsCollection, review);
  }

  getReviewsForProduct(productId: string): Observable<any[]> {
    const reviewsCollection = collection(this.firestore, 'reviews');
    const q = query(
      reviewsCollection,
      where('productId', '==', productId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  getUserReviews(userId: string): Observable<any[]> {
    const reviewsCollection = collection(this.firestore, 'reviews');
    const q = query(
      reviewsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  async updateReview(reviewId: string, comment: string) {
    const reviewDoc = doc(this.firestore, `reviews/${reviewId}`);
    return await updateDoc(reviewDoc, {
      comment,
      updatedAt: new Date()
    });
  }

  async deleteReview(reviewId: string) {
    const reviewDoc = doc(this.firestore, `reviews/${reviewId}`);
    return await deleteDoc(reviewDoc);
  }
}
