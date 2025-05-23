import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PaymentService, PaymentResult } from '../payment.service';
import { CartService } from '../cart.service';
import { finalize } from 'rxjs/operators';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

declare var Square: any;

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
})
export class PaymentComponent implements OnInit {
  paymentData = {
    fullName: '',
    email: '',
    cardholderName: '',
    termsAccepted: false
  };

  processing = false;
  paymentSuccess = false;
  statusMessage = '';
  payments: any;
  card: any;
  totalAmount = 0;
  cartItems: any[] = [];

  constructor(
    private paymentService: PaymentService,
    private cartService: CartService,
    private router: Router,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    this.loadCartData();
    this.initializeSquare();
  }

  loadCartData() {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.calculateTotal();
    });
  }
  
  calculateTotal() {
    this.totalAmount = 0;
    
    if (!this.cartItems || this.cartItems.length === 0) {
      return;
    }
    
    const productPromises = this.cartItems.map(item => {
      const productRef = doc(this.firestore, 'products', item.productId);
      return getDoc(productRef).then(docSnap => {
        if (docSnap.exists()) {
          const product = docSnap.data() as any;
          this.totalAmount += (product['price'] || 0) * item.quantity;
          
          return { ...item, product };
        }
        return item;
      });
    });
    
    Promise.all(productPromises).then(enrichedItems => {
      this.cartItems = enrichedItems;
    }).catch(error => {
      console.error('Error calculating cart total:', error);
    });
  }

  async initializeSquare() {
    try {
      if (typeof Square === 'undefined') {
        this.loadSquareSdk();
        return;
      }

      if (!environment.square) {
        throw new Error('Square configuration is missing in environment settings');
      }

      this.payments = Square.payments(
        environment.square.applicationId,
        environment.square.locationId
      );

      this.card = await this.payments.card();
      await this.card.attach('#card-container');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.showStatus('A fizetési rendszer betöltése sikertelen. Kérjük, próbálja újra később. ' + errorMessage, false);
    }
  }

  loadSquareSdk() {
    if (document.querySelector('script[src="https://sandbox.web.squarecdn.com/v1/square.js"]')) {
      const checkInterval = setInterval(() => {
        if (typeof Square !== 'undefined') {
          clearInterval(checkInterval);
          this.initializeSquare();
        }
      }, 500);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof Square === 'undefined') {
          this.showStatus('A fizetési rendszer betöltése túl sokáig tartott. Kérjük, frissítse az oldalt.', false);
        }
      }, 10000);
      
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
    script.onload = () => this.initializeSquare();
    script.onerror = () => {
      this.showStatus('A fizetési rendszer betöltése sikertelen. Kérjük, próbálja újra később.', false);
    };
    document.body.appendChild(script);
  }

  async onSubmit() {
    if (this.processing) return;

    this.processing = true;
    this.statusMessage = '';

    try {
      if (!this.paymentData.fullName || !this.paymentData.email || !this.paymentData.termsAccepted) {
        throw new Error('Kérjük, töltse ki az összes kötelező mezőt!');
      }

      if (!environment.square) {
        throw new Error('Square configuration is missing in environment settings');
      }
      
      const tokenResult = await this.card.tokenize();
      
      if (tokenResult.status === 'OK') {
        this.paymentService.createDirectPayment(
          tokenResult.token,
          this.totalAmount,
          'USD'
        )
        .pipe(
          finalize(() => this.processing = false)
        )
        .subscribe({
          next: (responseData) => {
            if (responseData.success && responseData.payment) {
              this.handleSuccessfulPayment({
                success: true,
                message: 'Fizetés sikeres!',
                transactionId: responseData.payment?.id || 'unknown'
              });
            } else {
              this.handleFailedPayment({
                success: false,
                message: responseData.message || 'A fizetés sikertelen.',
                error: responseData.errors ? responseData.errors[0] : { detail: 'Unknown error' }
              });
            }
          },
          error: () => {
            this.handleFailedPayment({
              success: false,
              message: 'Kapcsolódási hiba a fizetési szerverhez.',
              error: { detail: 'Nem sikerült kapcsolódni a fizetési szerverhez.' }
            });
          }
        });
        
      } else {
        this.processing = false;
        throw new Error(tokenResult.errors?.[0]?.message || 'Hibás kártyaadatok');
      }
    } catch (error: any) {
      this.processing = false;
      const errorMessage = error instanceof Error ? error.message : 'A fizetés sikertelen. Kérjük, ellenőrizze az adatokat.';
      this.showStatus(errorMessage, false);
    }
  }

  handleSuccessfulPayment(result: PaymentResult) {
    this.showStatus(`Fizetés sikeres! Köszönjük a vásárlást. Tranzakció azonosító: ${result.transactionId}`, true);
  }

  handleFailedPayment(result: PaymentResult) {
    let errorMessage = 'A fizetés sikertelen. ';
    
    if (result.error) {
      if (result.error.code) {
        errorMessage += `Hiba kód: ${result.error.code}. `;
      }
      if (result.error.detail) {
        errorMessage += result.error.detail;
      }
    } else {
      errorMessage += result.message || 'Kérjük, ellenőrizze az adatokat és próbálja újra.';
    }
    
    this.showStatus(errorMessage, false);
  }

  showStatus(message: string, isSuccess: boolean) {
    this.statusMessage = message;
    this.paymentSuccess = isSuccess;
    
    if (isSuccess) {
      this.paymentData = {
        fullName: '',
        email: '',
        cardholderName: '',
        termsAccepted: false
      };
    }
  }
}
