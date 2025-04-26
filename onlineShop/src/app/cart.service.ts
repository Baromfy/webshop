import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of, throwError, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { CartItem } from './models/cart.model';
import { Firestore, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}


  addToCart(productId: string): Observable<any> {
    const quantity = 1;
    const userId = this.authService.getId();
    
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    
    const cartRef = collection(this.firestore, 'cart');
    const q = query(cartRef, 
      where('userId', '==', userId),
      where('productId', '==', productId)
    );
    
    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) {
          return from(addDoc(cartRef, {
            productId,
            quantity,
            userId
          }));
        } else {
          const docRef = doc(this.firestore, 'cart', snapshot.docs[0].id);
          const data = snapshot.docs[0].data() as CartItem;
          return from(updateDoc(docRef, {
            quantity: data.quantity + quantity
          }));
        }
      })
    );
  }


  getCartItems(): Observable<any[]> {
    const userId = this.authService.getId();
    
    if (!userId) {
      return of([]);
    }
    
    const q = query(
      collection(this.firestore, 'cart'),
      where('userId', '==', userId)
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as CartItem
        }))
      )
    );
  }


  removeFromCart(itemId: string): Observable<any> {
    const userId = this.authService.getId();
    
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    
    return from(deleteDoc(doc(this.firestore, 'cart', itemId)));
  }


  updateQuantity(itemId: string, newQuantity: number): Observable<any> {
    const userId = this.authService.getId();
    
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    
    return from(updateDoc(doc(this.firestore, 'cart', itemId), {
      quantity: newQuantity
    }));
  }
}