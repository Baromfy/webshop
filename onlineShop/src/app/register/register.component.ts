import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';


@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterModule, MatCard, MatCardContent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})

export class RegisterComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService
      .register(this.email, this.password)
      .then(() => alert('Sikeres regisztráció!'))
      .catch((error) => alert(`Hiba: ${error.message}`));
  }
}
