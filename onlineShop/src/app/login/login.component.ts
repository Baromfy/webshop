import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterModule, MatCard, MatCardContent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService
      .login(this.email, this.password)
      .then(() => this.router.navigate(['/']))
      .catch((error) => alert(`Hiba: ${error.message}`));
  }
}
