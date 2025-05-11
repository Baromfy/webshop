import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Product } from '../models/product.model';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CartService } from '../cart.service';
import { ComparisonService } from '../comparison.service';
import { ChatbotComponent } from "../chatbot/chatbot.component";
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';


@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    RouterModule,
    MatIconModule,
    MatFormFieldModule,
    MatListModule,
    MatSelectModule,
    MatInputModule,
    ReactiveFormsModule,
    ChatbotComponent,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule
  ]
})
export class ProductComponent implements OnInit {
  products$: Observable<Product[]> = of([]);
  filteredProducts$: Observable<Product[]> = of([]);
  
  filterForm: FormGroup;
  
  private priceRangeSubject = new BehaviorSubject<{min: number | null, max: number | null}>({min: null, max: null});
  private manufacturerFilterSubject = new BehaviorSubject<string[]>([]);
  private processorFilterSubject = new BehaviorSubject<string[]>([]);
  private ramSizeFilterSubject = new BehaviorSubject<number[]>([]);
  private storageFilterSubject = new BehaviorSubject<number[]>([]);
  private osFilterSubject = new BehaviorSubject<string[]>([]);
  private screenSizeFilterSubject = new BehaviorSubject<number[]>([]);
  private searchFilterSubject = new BehaviorSubject<string>('');


  manufacturers: string[] = [];
  processors: string[] = [];
  ramSizes: number[] = [];
  storageSizes: number[] = [];
  osList: string[] = [];
  screenSizes: number[] = [];

  constructor(
    private firestore: Firestore,
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService,
    private comparisonService: ComparisonService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      search: [''], 
      priceMin: [null],
      priceMax: [null],
      manufacturers: [[]],
      processors: [[]],
      ramSizes: [[]],
      storageSizes: [[]],
      osList: [[]],
      screenSizes: [[]]
    });
  }

  viewProductDetails(productId: string) {
    this.router.navigate(['/detail', productId]);
  }

  ngOnInit(): void {
    const productsCollection = collection(this.firestore, 'products');
    this.products$ = collectionData(productsCollection, { idField: 'id' }) as Observable<Product[]>;

    this.filteredProducts$ = this.products$;
    
    this.setupFilterListeners();
    this.setupFilteredProducts();

    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchFilterSubject.next(value.toLowerCase());
    });
    
    

    this.products$.subscribe(products => {
      this.initFilterOptions(products);
    });
  }

  private initFilterOptions(products: Product[]): void {
    this.manufacturers = Array.from(new Set(products.map(p => p.manufacturer)));
    this.processors = Array.from(new Set(products.map(p => p.processorType)));
    this.ramSizes = Array.from(new Set(products.map(p => p.ramSize))).sort((a, b) => a - b);
    this.storageSizes = Array.from(new Set(products.map(p => p.storageCapacity))).sort((a, b) => a - b);
    this.osList = Array.from(new Set(products.map(p => p.os)));
    this.screenSizes = Array.from(new Set(products.map(p => p.screenSize))).sort((a, b) => a - b);
  }

  private setupFilterListeners(): void {
    this.filterForm.get('priceMin')?.valueChanges.subscribe(value => {
      this.priceRangeSubject.next({
        min: value,
        max: this.priceRangeSubject.value.max
      });
    });

    this.filterForm.get('priceMax')?.valueChanges.subscribe(value => {
      this.priceRangeSubject.next({
        min: this.priceRangeSubject.value.min,
        max: value
      });
    });

    this.filterForm.get('manufacturers')?.valueChanges.subscribe(value => {
      this.manufacturerFilterSubject.next(value);
    });

    this.filterForm.get('processors')?.valueChanges.subscribe(value => {
      this.processorFilterSubject.next(value);
    });

    this.filterForm.get('ramSizes')?.valueChanges.subscribe(value => {
      this.ramSizeFilterSubject.next(value);
    });

    this.filterForm.get('storageSizes')?.valueChanges.subscribe(value => {
      this.storageFilterSubject.next(value);
    });

    this.filterForm.get('osList')?.valueChanges.subscribe(value => {
      this.osFilterSubject.next(value);
    });

    this.filterForm.get('screenSizes')?.valueChanges.subscribe(value => {
      this.screenSizeFilterSubject.next(value);
    });
  }

  private setupFilteredProducts(): void {
    this.filteredProducts$ = combineLatest([
      this.products$,
      this.priceRangeSubject,
      this.manufacturerFilterSubject,
      this.processorFilterSubject,
      this.ramSizeFilterSubject,
      this.storageFilterSubject,
      this.osFilterSubject,
      this.screenSizeFilterSubject,
      this.searchFilterSubject
    ]).pipe(
      map(([products, priceRange, manufacturers, processors, ramSizes, storageSizes, osList, screenSizes, searchTerm]) => {
        return products.filter(product => {
          const priceMatch = 
            (priceRange.min === null || product.price >= priceRange.min) &&
            (priceRange.max === null || product.price <= priceRange.max);

          const manufacturerMatch = 
            manufacturers.length === 0 || 
            manufacturers.includes(product.manufacturer);
          
          const processorMatch = 
            processors.length === 0 || 
            processors.includes(product.processorType);
          
          const ramMatch = 
            ramSizes.length === 0 || 
            ramSizes.includes(product.ramSize);
          
          const storageMatch = 
            storageSizes.length === 0 || 
            storageSizes.includes(product.storageCapacity);
          
          const osMatch = 
            osList.length === 0 || 
            osList.includes(product.os);
          
          const screenSizeMatch = 
            screenSizes.length === 0 || 
            screenSizes.includes(product.screenSize);

            const searchMatch = 
            searchTerm === '' ||
            product.name.toLowerCase().includes(searchTerm) ||
            product.manufacturer.toLowerCase().includes(searchTerm) ||
            product.processorType.toLowerCase().includes(searchTerm) ||
            product.os.toLowerCase().includes(searchTerm);
          
          return priceMatch && manufacturerMatch && processorMatch && 
                 ramMatch && storageMatch && osMatch && screenSizeMatch && searchMatch;
        });
      })
    );
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      priceMin: null,
      priceMax: null,
      manufacturers: [],
      processors: [],
      ramSizes: [],
      storageSizes: [],
      osList: [],
      screenSizes: []
    });
  }

  addToComparison(productId: string, event: Event): void {
    event.stopPropagation();
    this.comparisonService.addToComparison(productId);
    this.snackBar.open('Termék hozzáadva az összehasonlításhoz', 'Bezár', {
      duration: 3000,
    });
  }

  removeFromComparison(productId: string, event: Event): void {
    event.stopPropagation();
    this.comparisonService.removeFromComparison(productId);
    this.snackBar.open('Termék eltávolítva az összehasonlításból', 'Bezár', {
      duration: 3000,
    });
  }

  isInComparison(productId: string): boolean {
    return this.comparisonService.isInComparison(productId);
  }

  getSelectedProducts(): Observable<string[]> {
    return this.comparisonService.getSelectedProducts();
  }

  goToComparison(): void {
    this.comparisonService.goToComparison();
  }

  addToCart(productId: string) {
    this.cartService.addToCart(productId).subscribe({
      next: () => {
        this.snackBar.open('A termék sikeresen hozzáadva a kosárhoz!', 'Bezár', {
          duration: 3000,
        });
      },
      error: (error: Error) => {
        console.error('Hiba a kosárhoz adás közben:', error);
        this.snackBar.open('Hiba történt a kosárhoz adás során. Kérjük, jelentkezzen be, vagy próbálja újra később!', 'Bezár', {
          duration: 3000,
        });
      }
    });
  }
}
