import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = '/api';
  
  constructor(private http: HttpClient) {}

  /**
   * Process a payment with Square using their Payments API
   * 
   * @param sourceId - The payment token from Square.js
   * @param amount - Amount to charge in the smallest currency unit (e.g., cents for USD)
   * @param currency - Currency code (e.g., 'USD', 'HUF')
   * @param orderInfo - Additional order information (customer details, items, etc.)
   * @returns Observable with payment result
   */
  processPayment(
    sourceId: string, 
    amount: number, 
    currency: string = 'HUF',
    orderInfo: any
  ): Observable<PaymentResult> {

    const backendUrl = '/api/payments';
    
    const locationId = environment.square?.locationId || 'LOCATION_ID_NOT_FOUND';
    
    return this.http.post<PaymentResult>(backendUrl, {
      sourceId,
      amount,
      currency,
      locationId,
      orderInfo
    });
  }


  createDirectPayment(sourceId: string, amount: number, currency: string = 'USD'): Observable<any> {
    console.log('Creating payment through backend server');
    
    const squareConfig = environment.square;
    
    if (!squareConfig) {
      console.error('Square configuration is missing in environment configuration');
      return of({ 
        success: false, 
        message: 'Square configuration is incomplete' 
      });
    }
    

    const idempotencyKey = this.generateIdempotencyKey();
    console.log('Using idempotency key:', idempotencyKey);
    
    const body = {
      sourceId: sourceId,
      amount: amount,
      currency: currency,
      idempotencyKey: idempotencyKey
    };
    
    console.log('Request body:', JSON.stringify(body));
    console.log('Sending request to backend:', `${this.apiUrl}/payments`);

    return this.http.post(`${this.apiUrl}/payments`, body)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Payment processing error:', error);
          return of({
            success: false,
            message: 'Error processing payment',
            errors: error.error?.errors || [{
              detail: 'Could not connect to payment server. Please try again later.'
            }]
          });
        })
      );
  }
  

  private generateIdempotencyKey(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 15);
  }
}
