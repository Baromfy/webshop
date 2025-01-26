import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AppComponent } from './app/app.component';
import { ProductComponent } from './app/product/product.component';
import { LoginComponent } from './app/login/login.component';
import { RegisterComponent } from './app/register/register.component';
import { UploadNewProductsComponent } from './app/upload-new-products/upload-new-products.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAuth } from '@angular/fire/auth';
import { getAuth } from 'firebase/auth';
import { provideHttpClient } from '@angular/common/http';

const routes = [
  { path: '', component: ProductComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'uploadProducts', component: UploadNewProductsComponent}
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(
      BrowserAnimationsModule,
      MatToolbarModule,
      MatButtonModule
    ),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // Inicializálja a Firebase-t
    provideFirestore(() => getFirestore()), provideAnimationsAsync(),
    provideAuth(() => getAuth()),
    provideHttpClient(),
  ],
});

