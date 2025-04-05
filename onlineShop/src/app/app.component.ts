import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductComponent } from "./product/product.component";
import { NavbarComponent } from "./navbar/navbar.component";
import { LoginComponent } from "./login/login.component";
import { RouterModule } from '@angular/router';
import { ProductDetailComponent } from "./product-detail/product-detail.component";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ProductComponent, LoginComponent, RouterModule, ProductDetailComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'onlineShop';
}
