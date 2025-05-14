import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PaymentService, PaymentResult } from '../payment.service';
import { CartService } from '../cart.service';
import { finalize } from 'rxjs/operators';
import { Firestore, collection, addDoc, doc, getDoc } from '@angular/fire/firestore';

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
  
  apiInteraction = {
    sent: false,
    request: null as any,
    response: null as any,
    visible: false
  };

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
      console.log('Cart total calculated:', this.totalAmount);
    }).catch(error => {
      console.error('Error calculating cart total:', error);
    });
  }

  async initializeSquare() {
    try {
      if (typeof Square === 'undefined') {
        console.log('Square SDK not found, attempting to load it');
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
      console.error('Square initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.showStatus('A fizetési rendszer betöltése sikertelen. Kérjük, próbálja újra később. ' + errorMessage, false);
    }
  }

  loadSquareSdk() {
    if (document.querySelector('script[src="https://sandbox.web.squarecdn.com/v1/square.js"]')) {
      console.log('Square SDK script already exists, waiting for it to load');
      
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
      console.error('Failed to load Square SDK');
      this.showStatus('A fizetési rendszer betöltése sikertelen. Kérjük, próbálja újra később.', false);
    };
    document.body.appendChild(script);
  }

  async onSubmit() {
    if (this.processing) return;

    this.processing = true;
    this.statusMessage = '';
    this.resetApiInteraction();

    try {
      if (!this.paymentData.fullName || !this.paymentData.email || !this.paymentData.termsAccepted) {
        throw new Error('Kérjük, töltse ki az összes kötelező mezőt!');
      }

      if (!environment.square) {
        throw new Error('Square configuration is missing in environment settings');
      }
      
      const idempotencyKey = this.generateIdempotencyKey();
      
      const exampleRequest = {
        endpoint: 'https://connect.squareupsandbox.com/v2/payments',
        method: 'POST',
        headers: {
          'Square-Version': '2023-06-08',
          'Authorization': `Bearer ${environment.square.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          source_id: 'EXAMPLE_TOKEN',
          idempotency_key: idempotencyKey,
          amount_money: {
            amount: this.totalAmount,
            currency: 'USD'
          },
          location_id: environment.square.locationId
        }
      };
      
      this.apiInteraction.sent = true;
      this.apiInteraction.request = exampleRequest;
      this.apiInteraction.visible = true;
      
      console.log('Would send this request to Square:', exampleRequest);
      
      const tokenResult = await this.card.tokenize();
      
      if (tokenResult.status === 'OK') {
        console.log('Payment token generated:', tokenResult.token);
        
        console.log('Payment token generated, calling backend service');
        
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
            console.log('Payment response from backend:', responseData);
                        
            if (responseData.success && responseData.payment) {
              const paymentResponse = {
                ok: true,
                status: 200,
                statusText: 'OK'
              };
              
              console.log('Successful payment:', responseData.payment);
              

              this.handlePaymentSuccess(responseData, paymentResponse);
            } else {
              const paymentResponse = {
                ok: false,
                status: responseData.errors ? 400 : 500,
                statusText: 'Error'
              };
              
              console.error('Payment failed:', responseData);
              
              this.handlePaymentError(responseData, paymentResponse);
            }
          },
          error: (error) => {
            console.error('Error calling payment service:', error);
            

            const paymentResponse = {
              ok: false,
              status: 500,
              statusText: 'Error'
            };
            
            this.handleConnectionError(error, paymentResponse);
          }
        });
        
      } else {
        this.processing = false;
        this.apiInteraction.response = {
          status: 400,
          statusText: 'Bad Request',
          body: { errors: tokenResult.errors },
          timestamp: new Date().toISOString()
        };
        throw new Error(tokenResult.errors?.[0]?.message || 'Hibás kártyaadatok');
      }
    } catch (error: any) {
      this.processing = false;
      console.error('Payment error:', error);
      
      if (!this.apiInteraction.response) {
        this.apiInteraction.response = {
          status: 500,
          statusText: 'Error',
          body: { error: error.message || 'Unknown error' },
          timestamp: new Date().toISOString()
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'A fizetés sikertelen. Kérjük, ellenőrizze az adatokat.';
      this.showStatus(errorMessage, false);
    } finally {
      this.processing = false;
    }
  }


  private generateIdempotencyKey(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 15);
  }


  private recordOrder(transactionId: string, orderInfo: any): void {
    try {

      const ordersRef = collection(this.firestore, 'orders');
      
      const orderData = {
        transactionId,
        items: orderInfo.items,
        totalAmount: orderInfo.totalAmount,
        customerInfo: orderInfo.customer,
        status: 'completed',
        createdAt: new Date()
      };
      

      addDoc(ordersRef, orderData)
        .then(() => console.log('Order recorded successfully'))
        .catch((err: Error) => console.error('Failed to record order:', err));
    } catch (error) {
      console.error('Error recording order:', error);
    }
  }


  handlePaymentSuccess(responseData: any, paymentResponse: any) {
    console.log('Handling successful payment response:', responseData);
    

    this.apiInteraction.response = {
      status: paymentResponse.status,
      statusText: paymentResponse.statusText,
      body: responseData,
      timestamp: new Date().toISOString()
    };

    const isSimulated = responseData.simulated === true;
    
    this.handleSuccessfulPayment({
      success: true,
      message: isSimulated 
        ? 'Fizetés sikeres! (Szimulált fizetés)' 
        : 'Fizetés sikeres!',
      transactionId: responseData.payment?.id || 'unknown'
    });
    

    if (isSimulated) {
      console.log('A fizetés szimulált volt - nincs API hívás a Square dashboardon');
    } else {
      console.log('A fizetés valós Square API hívással történt - ellenőrizd a Square dashboardot');
    }
  }
  handlePaymentError(responseData: any, paymentResponse: any) {
    this.apiInteraction.response = {
      status: paymentResponse.status,
      statusText: paymentResponse.statusText,
      body: responseData,
      timestamp: new Date().toISOString()
    };
    
    this.handleFailedPayment({
      success: false,
      message: responseData.message || 'A fizetés sikertelen.',
      error: responseData.errors ? responseData.errors[0] : { detail: 'Unknown error' }
    });
  }
  
  handleConnectionError(error: any, paymentResponse: any) {
    this.apiInteraction.response = {
      status: paymentResponse.status,
      statusText: paymentResponse.statusText,
      body: { error: 'Nem sikerült kapcsolódni a fizetési szerverhez.' },
      timestamp: new Date().toISOString()
    };
    
    this.handleFailedPayment({
      success: false,
      message: 'Kapcsolódási hiba a fizetési szerverhez.',
      error: { detail: 'Nem sikerült kapcsolódni a fizetési szerverhez. Kérjük, ellenőrizze internet kapcsolatát és próbálja újra később.' }
    });
  }

  handleSuccessfulPayment(result: PaymentResult) {
    this.showStatus(`Fizetés sikeres! Köszönjük a vásárlást. Tranzakció azonosító: ${result.transactionId}`, true);
    
    setTimeout(() => {
      console.log('Payment completed successfully');
    }, 3000);
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


  resetApiInteraction() {
    this.apiInteraction = {
      sent: false,
      request: null,
      response: null,
      visible: false
    };
  }

  logApiRequest(sourceId: string, amount: number, currency: string, orderInfo: any) {
    this.apiInteraction.sent = true;
    
    const locationId = environment.square?.locationId || 'LOCATION_ID_NOT_FOUND';
    
    this.apiInteraction.request = {
      endpoint: 'https://connect.squareupsandbox.com/v2/payments',
      timestamp: new Date().toISOString(),
      method: 'POST',
      body: {
        source_id: sourceId,
        amount_money: {
          amount: amount,
          currency: currency
        },
        location_id: locationId,
        idempotency_key: orderInfo.idempotencyKey
      }
    };
    
    console.log('🔄 Sending Square API request:', this.apiInteraction.request);
  }

  logApiResponse(response: any) {
    this.apiInteraction.response = {
      timestamp: new Date().toISOString(),
      status: response.status || (response.errors ? 400 : 200),
      body: response
    };
    
    console.log(`${response.errors ? '❌' : '✅'} Received Square API response:`, this.apiInteraction.response);
  }

  toggleApiDetails() {
    this.apiInteraction.visible = !this.apiInteraction.visible;
  }
  
  getHeadersList(headers: any): {name: string, value: string}[] {
    if (!headers) return [];
    

    return Object.entries(headers).map(([name, value]) => {
      const valueString = String(value);
      
      return {
        name,
        value: name.toLowerCase() === 'authorization' 
          ? `Bearer ${valueString.substring(7, 12)}...` 
          : valueString
      };
    });
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
