import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Product } from '../models/product.model';
import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
  imports: [CommonModule, MatCardModule, MatButtonModule, RouterModule],
})
export class ProductComponent implements OnInit {
  products$!: Observable<Product[]>;

  constructor(private firestore: Firestore, private router: Router) {}


viewProductDetails(productId: string) {
  this.router.navigate(['/detail', productId]);
}

  ngOnInit(): void {
    const productsCollection = collection(this.firestore, 'products');
    this.products$ = collectionData(productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }
}
