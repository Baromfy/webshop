import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../models/product.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterModule, MatButtonModule, CurrencyPipe],
  standalone: true,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;

  constructor(private route: ActivatedRoute, private firestore: Firestore) {}

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const productId = params.get('id');
      console.log('Product ID from route:', productId);
      
      if (productId) {
        try {
          const productDocRef = doc(this.firestore, 'products', productId);
          const productSnapshot = await getDoc(productDocRef);
          
          if (productSnapshot.exists()) {
            this.product = { id: productSnapshot.id, ...productSnapshot.data() } as Product;
            console.log('Product loaded:', this.product);
          } else {
            console.error('No such product with ID:', productId);
          }
        } catch (error) {
          console.error('Error loading product:', error);
        }
      } else {
        console.error('No product ID in route params');
      }
    });
}
}
