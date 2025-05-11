import { Component, OnInit } from '@angular/core';
import { Product } from '../models/product.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatbotService } from '../chatbot.service';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './comparison.component.html',
  styleUrl: './comparison.component.css'
})
export class ComparisonComponent implements OnInit {
  products: Product[] = [];
  errorMessage: string = '';
  userPreferencesForm: FormGroup;
  showRecommendation: boolean = false;
  recommendedProductIndex: number | null = null;
  recommendationReason: string = '';
  isLoadingAiRecommendation = false;
  aiRecommendation = '';
  
  usageScenarios = [
    { id: 'gaming', label: 'Játékra', englishLabel: 'gaming' },
    { id: 'officeWork', label: 'Irodai munkára', englishLabel: 'office work' },
    { id: 'programming', label: 'Programozásra', englishLabel: 'programming' },
    { id: 'videoEditing', label: 'Videószerkesztésre', englishLabel: 'video editing' },
    { id: 'photoEditing', label: 'Fotószerkesztésre', englishLabel: 'photo editing' },
    { id: 'browsing', label: 'Webes böngészésre', englishLabel: 'web browsing' },
    { id: 'streaming', label: 'Videó streamingre', englishLabel: 'video streaming' },
    { id: 'studentUse', label: 'Tanulásra', englishLabel: 'student use' },
    { id: '3dModeling', label: '3D modellezésre', englishLabel: '3D modeling' },
    { id: 'portability', label: 'Hordozhatóságra van szükségem', englishLabel: 'portability' }
  ];
  
  attributeLabels: { [key: string]: string } = {
    name: 'Név',
    price: 'Ár',
    manufacturer: 'Gyártó',
    os: 'Operációs rendszer',
    processorType: 'Processzor típusa',
    processorSpeed: 'Processzor sebesség (GHz)',
    cacheSize: 'Cache mérete (MB)',
    ramSize: 'RAM mérete (GB)',
    ramType: 'RAM típusa',
    screenSize: 'Kijelző mérete (inch)',
    screenResolution: 'Kijelző felbontása',
    refreshRate: 'Frissítési ráta (Hz)',
    storageCapacity: 'Tároló kapacitása (GB)',
    storageType: 'Tároló típusa',
    gpuType: 'GPU típusa',
    gpuMemory: 'GPU memória',
    batteryCells: 'Akkumulátor cellák száma',
    weight: 'Súly (kg)',
    usb32Ports: 'USB 3.2 portok száma',
    usbTypeCPorts: 'USB-C portok száma',
    productFamily: 'Termékcsalád'
  };
  
  attributesToDisplay: string[] = [
    'name', 'price', 'manufacturer', 'os', 
    'processorType', 'processorSpeed', 'cacheSize', 
    'ramSize', 'ramType', 
    'screenSize', 'screenResolution', 'refreshRate', 
    'storageCapacity', 'storageType', 
    'gpuType', 'gpuMemory', 
    'batteryCells', 'weight', 
    'usb32Ports', 'usbTypeCPorts', 
    'productFamily'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private fb: FormBuilder,
    private chatbotService: ChatbotService
  ) {
    this.userPreferencesForm = this.fb.group({});
    
    for (let scenario of this.usageScenarios) {
      this.userPreferencesForm.addControl(scenario.id, this.fb.control(false));
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const productIds = params['ids'];
      
      if (productIds) {
        const ids = productIds.split(',');
        
        if (ids.length !== 2) {
          this.errorMessage = 'Pontosan 2 termék összehasonlítása lehetséges.';
          return;
        }
        
        for (let id of ids) {
          const productRef = doc(this.firestore, 'products', id);
          
          getDoc(productRef).then(docSnap => {
            if (docSnap.exists()) {
              const product = { id: docSnap.id, ...docSnap.data() } as Product;
              this.products.push(product);
            } else {
              console.error('No such product exists with ID:', id);
              this.errorMessage = 'Egy vagy több kiválasztott termék nem található.';
            }
          }).catch(error => {
            console.error('Error fetching product:', error);
            this.errorMessage = 'Hiba történt a termékek betöltése közben.';
          });
        }
      } else {
        this.errorMessage = 'Nincs kiválasztva összehasonlítandó termék.';
      }
    });
  }

  getProductAttribute(product: Product, attr: string): any {
    return (product as any)[attr];
  }

  formatValue(key: string, value: any): string {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    
    if (key === 'price') {
      return `${value.toLocaleString()} Ft`;
    }
    
    return value.toString();
  }

  getAiRecommendation(): void {
    if (this.products.length !== 2) {
      return;
    }

    this.isLoadingAiRecommendation = true;
    this.showRecommendation = true;

    let selectedPreferences = [];
    
    for (let scenario of this.usageScenarios) {
      if (this.userPreferencesForm.get(scenario.id)?.value === true) {
        selectedPreferences.push(scenario.englishLabel);
      }
    }

    let prompt;
    if (selectedPreferences.length > 0) {
      prompt = `Which laptop is more suitable for these uses between the two: ${selectedPreferences.join(', ')}?`;
    } else {
      prompt = 'Which is a better value?';
    }

    const message = {
      role: 'user',
      content: prompt
    };

    this.chatbotService.sendMessage([message], 'mistralai/mistral-7b-instruct:free').subscribe({
      next: (response: any) => {
        this.isLoadingAiRecommendation = false;
        
        if (response && response.choices && response.choices[0] && response.choices[0].message) {
          this.aiRecommendation = response.choices[0].message.content;
          
          const product1 = this.products[0];
          const product2 = this.products[1];
          
          const product1Mentions = this.countProductMentions(this.aiRecommendation, product1);
          const product2Mentions = this.countProductMentions(this.aiRecommendation, product2);
          
          if (product1Mentions > product2Mentions) {
            this.recommendedProductIndex = 0;
          } else if (product2Mentions > product1Mentions) {
            this.recommendedProductIndex = 1;
          } else {
            this.recommendedProductIndex = null;
          }
          
          this.recommendationReason = this.aiRecommendation;
        } else {
          this.handleAiError();
        }
      },
      error: (error) => {
        console.error('Error getting AI recommendation:', error);
        this.handleAiError();
      }
    });
  }
  
  countProductMentions(text: string, product: Product): number {
    const nameRegex = new RegExp(product.name, 'gi');
    const manufacturerRegex = new RegExp(product.manufacturer, 'gi');
    
    const nameMatches = (text.match(nameRegex) || []).length;
    const manufacturerMatches = (text.match(manufacturerRegex) || []).length;
    
    return nameMatches + manufacturerMatches;
  }
  
  private handleAiError(): void {
    this.isLoadingAiRecommendation = false;
    this.aiRecommendation = 'Unfortunately, I cannot generate a recommendation at this time. Please try again later.';
    this.recommendedProductIndex = null;
    this.recommendationReason = 'Error occurred while generating the recommendation.';
  }

  analyzePreferences(): void {
    this.getAiRecommendation();
  }
  
  goBack(): void {
    this.router.navigate(['/']);
  }
}
