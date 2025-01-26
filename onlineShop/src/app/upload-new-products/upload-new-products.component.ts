import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-upload-new-products',
  standalone: true,
  imports: [MatFormFieldModule, CommonModule, FormsModule, MatInputModule],
  templateUrl: './upload-new-products.component.html',
  styleUrls: ['./upload-new-products.component.css'],
})
export class UploadNewProductsComponent {
  productName: string = '';
  productPrice: number = 0;
  productId: string = '';
  productCategory: string = '';

  constructor(private firestore: Firestore) {}

  async addProduct() {
    if (this.productName && this.productPrice > 0) {
      const product = {
        name: this.productName,
        price: this.productPrice,
        id: this.productId,
        category: this.productCategory,
      };

      try {
        const productsCollection = collection(this.firestore, 'products');
        await addDoc(productsCollection, product);

        console.log('Termék sikeresen hozzáadva!');
        this.productName = '';
        this.productPrice = 0;
        this.productId = '';
        this.productCategory = '';
      } catch (error) {
        console.error('Hiba történt a termék mentésekor: ', error);
      }
    }
  }
}
