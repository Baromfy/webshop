import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, doc, deleteDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favourite-product',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIcon, MatCard],
  templateUrl: './favourite-product.component.html',
  styleUrls: ['./favourite-product.component.css']
})
export class FavouriteProductComponent implements OnInit {
  favorites: any[] = [];
  userId: string | null = null;


  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  async ngOnInit() {
    this.userId = this.auth.currentUser?.uid || null;
    if (this.userId) {
      await this.loadFavorites();
    }
  }

  async loadFavorites() {
    try {
      this.favorites = [];
      
      // Get all favorites for the current user
      const favoritesQuery = collection(this.firestore, 'favorites');
      const querySnapshot = await getDocs(favoritesQuery);
  
      for (const favoriteDoc of querySnapshot.docs) {
        const favoriteData = favoriteDoc.data();
        
        // Check if the favorite belongs to current user
        if (favoriteData['userId'] === this.userId) {
          // Get the associated product document
          const productDocRef = doc(this.firestore, 'products', favoriteData['productId']);
          const productDoc = await getDoc(productDocRef);
          
          if (productDoc.exists()) {
            const productData = productDoc.data();
            this.favorites.push({
              id: favoriteDoc.id,
              favorite: {
                id: favoriteDoc.id,
                ...favoriteData
              },
              product: {
                id: favoriteData['productId'],
                ...productData
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async removeFavorite(id: string) {
    await deleteDoc(doc(this.firestore, 'favorites', id));
    this.favorites = this.favorites.filter(fav => fav.id !== id);
  }

  viewProductDetails(productId: string) {
    this.router.navigate(['/detail', productId]);
  }
}
