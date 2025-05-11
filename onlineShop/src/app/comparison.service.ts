import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private selectedProductIds: string[] = [];
  private selectedProductsSubject = new BehaviorSubject<string[]>([]);

  constructor(private router: Router) {}


  getSelectedProducts(): Observable<string[]> {
    return this.selectedProductsSubject.asObservable();
  }


  addToComparison(productId: string): void {

    if (this.selectedProductIds.length >= 2 && !this.selectedProductIds.includes(productId)) {
      alert('Egyszerre csak 2 termék hasonlítható össze. Kérjük, távolítson el egy terméket a kiválasztottak közül.');
      return;
    }


    if (this.selectedProductIds.includes(productId)) {
      this.removeFromComparison(productId);
      return;
    }


    this.selectedProductIds.push(productId);
    this.selectedProductsSubject.next([...this.selectedProductIds]);
  }

  removeFromComparison(productId: string): void {
    this.selectedProductIds = this.selectedProductIds.filter(id => id !== productId);
    this.selectedProductsSubject.next([...this.selectedProductIds]);
  }


  clearComparison(): void {
    this.selectedProductIds = [];
    this.selectedProductsSubject.next([]);
  }


  isInComparison(productId: string): boolean {
    return this.selectedProductIds.includes(productId);
  }


  goToComparison(): void {
    if (this.selectedProductIds.length !== 2) {
      alert('Pontosan 2 terméket kell kiválasztania az összehasonlításhoz.');
      return;
    }

    this.router.navigate(['/comparison'], {
      queryParams: { ids: this.selectedProductIds.join(',') }
    });
  }
}
