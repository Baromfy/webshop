import { Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { CartComponent } from './cart/cart.component';
import { FavouriteProductComponent } from './favourite-product/favourite-product.component';
import { PaymentComponent } from './payment/payment.component';
import { ComparisonComponent } from './comparison/comparison.component';
import { AdminComponent } from './admin/admin.component';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';

export const routes: Routes = [
  { path: 'detail/:id', component: ProductDetailComponent },
  { path: '', component: ProductComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'payment', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'favouriteProduct', component: FavouriteProductComponent, canActivate: [AuthGuard] },
  { path: 'comparison', component: ComparisonComponent },
  { path: '**', redirectTo: '' }
];
