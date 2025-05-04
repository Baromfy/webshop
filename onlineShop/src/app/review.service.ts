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

  async addReview(productId: string, rating: number, comment: string, userEmail: string) {
    const review = {
      productId,
      userId: this.auth.currentUser?.uid,
      userEmail,
      rating,
      comment,
      createdAt: new Date()
    };
    
    const reviewsCollection = collection(this.firestore, 'reviews');
    return await addDoc(reviewsCollection, review);
  }

  getReviewsForProduct(productId: string): Observable<any[]> {
    const reviewsCollection = collection(this.firestore, 'reviews');
    // Remove the orderBy clause to avoid requiring a composite index
    // While this is not ideal, it will work until a proper index is created in Firebase
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

  async updateReview(reviewId: string, rating: number, comment: string) {
    const reviewDoc = doc(this.firestore, `reviews/${reviewId}`);
    return await updateDoc(reviewDoc, {
      rating,
      comment,
      updatedAt: new Date()
    });
  }

  async deleteReview(reviewId: string) {
    const reviewDoc = doc(this.firestore, `reviews/${reviewId}`);
    return await deleteDoc(reviewDoc);
  }
}
