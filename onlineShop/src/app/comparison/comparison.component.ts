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
      prompt = 'Which laptop is a better value?';
    }

    const laptop1Specs = this.createLaptopSpecString(this.products[0]);
    const laptop2Specs = this.createLaptopSpecString(this.products[1]);

    const messages = [
      {
        role: "system",
        content: `You are a laptop recommendation assistant. Compare these two laptops based on their specifications and the user's needs. 
        Analyze which one is better for the specific use cases. Your response should be concise and focused on which laptop is recommended and why.
        
        Laptop 1: ${this.products[0].manufacturer} ${this.products[0].name}
        ${laptop1Specs}
        
        Laptop 2: ${this.products[1].manufacturer} ${this.products[1].name}
        ${laptop2Specs}`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    this.chatbotService.sendMessage(messages, 'mistralai/mistral-7b-instruct:free').subscribe({
      next: (response: any) => {
        this.isLoadingAiRecommendation = false;
        
        if (response && response.choices && response.choices[0] && response.choices[0].message) {
          let aiResponse = response.choices[0].message.content;
              
          this.aiRecommendation = aiResponse;
          
          const laptop1Mention = aiResponse.toLowerCase().includes(this.products[0].name.toLowerCase()) || 
                               aiResponse.toLowerCase().includes(this.products[0].manufacturer.toLowerCase() + ' ' + this.products[0].name.toLowerCase());
          
          const laptop2Mention = aiResponse.toLowerCase().includes(this.products[1].name.toLowerCase()) || 
                               aiResponse.toLowerCase().includes(this.products[1].manufacturer.toLowerCase() + ' ' + this.products[1].name.toLowerCase());
          
          if (laptop1Mention && !laptop2Mention) {
            this.recommendedProductIndex = 0;
          } else if (laptop2Mention && !laptop1Mention) {
            this.recommendedProductIndex = 1;
          } else {
            this.recommendedProductIndex = null;
          }
          
          this.recommendationReason = aiResponse;
        } else {
        }
      },
      error: (error) => {
        console.error('AI recommendation error:', error);
      }
    });
  }
  

  private createLaptopSpecString(product: Product): string {
    return `
    - Price: ${product.price} USD
    - Manufacturer: ${product.manufacturer}
    - OS: ${product.os || 'N/A'}
    - Processor: ${product.processorType || 'N/A'} (${product.processorSpeed || 'N/A'} GHz)
    - Cache: ${product.cacheSize || 'N/A'} MB
    - RAM: ${product.ramSize || 'N/A'} GB ${product.ramType || ''}
    - Screen: ${product.screenSize || 'N/A'} inch, ${product.screenResolution || 'N/A'}, ${product.refreshRate || 'N/A'} Hz
    - Storage: ${product.storageCapacity || 'N/A'} GB ${product.storageType || ''}
    - Graphics: ${product.gpuType || 'N/A'} with ${product.gpuMemory || 'N/A'} memory
    - Battery: ${product.batteryCells || 'N/A'} cells
    - Weight: ${product.weight || 'N/A'} kg
    - Ports: ${product.usb32Ports || 'N/A'} USB 3.2, ${product.usbTypeCPorts || 'N/A'} USB-C
    - Product Family: ${product.productFamily || 'N/A'}
    `;
  }
  

  analyzePreferences(): void {
    this.getAiRecommendation();
  }
  
  goBack(): void {
    this.router.navigate(['/']);
  }
}
