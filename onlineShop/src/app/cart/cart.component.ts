import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../cart.service';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Firestore, collection, query, where, getDocs, DocumentData } from '@angular/fire/firestore';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIcon, 
    MatCard,
    MatProgressSpinnerModule,
    CurrencyPipe
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: (CartItem & Product & { id: string })[] = [];
  userId: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getId();
    if (this.userId) {
      this.loadCartItems();
    }
    
    this.authService.currentUser$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.userId = this.authService.getId();
        this.loadCartItems();
      } else {
        this.userId = null;
        this.cartItems = [];
      }
    });
  }
  
  public loadCartItems(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    this.errorMessage = null;
    
    this.cartService.getCartItems().subscribe({
      next: async (cartItems: (CartItem & { id: string })[]) => {
        if (!cartItems || cartItems.length === 0) {
          this.cartItems = [];
          this.isLoading = false;
          return;
        }
        

        const productIds = cartItems.map(item => item.productId);
        
        const productsCollection = collection(this.firestore, 'products');
        const allProductsSnapshot = await getDocs(query(productsCollection));

        const productData = new Map<string, DocumentData>();
        

        for (const productId of productIds) {
          const productQuery = query(productsCollection, where('id', '==', productId));
          const productDocs = await getDocs(productQuery);
          
          if (!productDocs.empty) {
            productData.set(productId, productDocs.docs[0].data());
          } else {
            const matchingProducts = allProductsSnapshot.docs.filter(
              doc => doc.id === productId || doc.data()['id'] === productId
            );
            
            if (matchingProducts.length > 0) {
              productData.set(productId, matchingProducts[0].data());
            }
          }
        }
        
        this.cartItems = cartItems.map(cartItem => {
          const product = productData.get(cartItem.productId) || {};
          
          return {
            ...cartItem,
            name: product['name'] || 'Unknown Product',
            price: product['price'] || 0,
            manufacturer: product['manufacturer'] || 'Unknown',
            processorType: product['processorType'] || 'Unknown',
            ramSize: product['ramSize'] || 0,
            storageCapacity: product['storageCapacity'] || 0,
            storageType: product['storageType'] || 'Unknown',
            imageUrl: product['imageUrl'] || 'assets/laptop.jpg',
            ...product
          } as (CartItem & Product & { id: string });
        });
        
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Hiba történt a kosár betöltése során.';
        this.isLoading = false;
      }
    });
  }

  removeItem(itemId: string): void {
    this.cartService.removeFromCart(itemId).subscribe({
      next: () => {
        this.loadCartItems();
      },
      error: () => {
        this.errorMessage = 'Hiba történt a termék eltávolítása során.';
      }
    });
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(itemId);
      return;
    }

    this.cartService.updateQuantity(itemId, quantity).subscribe({
      next: () => {
        this.loadCartItems();
      },
      error: () => {
        this.errorMessage = 'Hiba történt a mennyiség frissítése során.';
      }
    });
  }

  getTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}
