import { Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { UploadNewProductsComponent } from './upload-new-products/upload-new-products.component';
import { CartComponent } from './cart/cart.component';
import { FavouriteProductComponent } from './favourite-product/favourite-product.component';
import { PaymentComponent } from './payment/payment.component';
import { ComparisonComponent } from './comparison/comparison.component';

export const routes: Routes = [
  { path: 'detail/:id', component: ProductDetailComponent },
  { path: '', component: ProductComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'uploadProducts', component: UploadNewProductsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'payment', component: PaymentComponent },
  { path: 'favouriteProduct', component: FavouriteProductComponent },
  { path: 'comparison', component: ComparisonComponent },
  { path: '**', redirectTo: '' }
];
