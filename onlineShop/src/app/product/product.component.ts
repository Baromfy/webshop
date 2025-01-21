import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Product } from '../models/product.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  imports: [CommonModule, MatCardModule],
  styleUrls: ['./product.component.css'],
})
export class ProductComponent implements OnInit {
  products$!: Observable<Product[]>; // Observable az adatok streameléséhez

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    // Hozzáférés a "products" gyűjteményhez
    const productsCollection = collection(this.firestore, 'products');
    
    // Adatok lekérése az Observable segítségével
    this.products$ = collectionData(productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }
}
