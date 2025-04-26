import { Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { UploadNewProductsComponent } from './upload-new-products/upload-new-products.component';
import { CartComponent } from './cart/cart.component';

export const routes: Routes = [
  { path: 'detail/:id', component: ProductDetailComponent },
  { path: '', component: ProductComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'uploadProducts', component: UploadNewProductsComponent },
  { path: 'cart', component: CartComponent },
  { path: '**', redirectTo: '' }
];
