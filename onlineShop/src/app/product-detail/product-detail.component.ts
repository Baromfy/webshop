import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../models/product.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, doc, getDoc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyPipe } from '@angular/common';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, CurrencyPipe, MatSnackBarModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;
  currentUserId: string | null = null;
  isFavorite = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private auth: Auth,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserId = user?.uid || null;
      this.checkIfFavorite();
    });

    // Termék betöltése
    await this.loadProduct();
  }

  async loadProduct() {
    const productId = this.route.snapshot.paramMap.get('id');
    
    if (productId) {
      try {
        const productDocRef = doc(this.firestore, 'products', productId);
        const productSnapshot = await getDoc(productDocRef);
        
        if (productSnapshot.exists()) {
          this.product = { id: productSnapshot.id, ...productSnapshot.data() } as Product;
          this.checkIfFavorite();
        }
      } catch (error) {
        console.error('Error loading product:', error);
        this.snackBar.open('Hiba a termék betöltésekor', 'Bezár', { duration: 3000 });
      }
    }
  }

  async checkIfFavorite() {
    if (!this.currentUserId || !this.product?.id) {
      this.isFavorite = false;
      return;
    }

    const favoriteRef = doc(this.firestore, 'favorites', `${this.currentUserId}_${this.product.id}`);
    const favoriteSnap = await getDoc(favoriteRef);
    this.isFavorite = favoriteSnap.exists();
  }

  async toggleFavorite() {
    if (!this.currentUserId) {
      this.snackBar.open('Be kell jelentkeznie a kedvencek kezeléséhez', 'Bezár', { duration: 3000 });
      return;
    }

    if (!this.product?.id) return;

    try {
      const favoriteId = `${this.currentUserId}_${this.product.id}`;
      const favoriteRef = doc(this.firestore, 'favorites', favoriteId);

      if (this.isFavorite) {
        await deleteDoc(favoriteRef);
        this.isFavorite = false;
        this.snackBar.open('Termék eltávolítva a kedvencekből', 'Bezár', { duration: 2000 });
      } else {
        await setDoc(favoriteRef, {
          userId: this.currentUserId,
          productId: this.product.id,
          createdAt: new Date()
        });
        this.isFavorite = true;
        this.snackBar.open('Termék hozzáadva a kedvencekhez', 'Bezár', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      this.snackBar.open('Hiba a kedvencek frissítésekor', 'Bezár', { duration: 3000 });
    }
  }

  addToCart() {
    console.log('Product added to cart:', this.product);
  }
}