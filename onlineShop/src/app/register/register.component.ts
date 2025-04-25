import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCardHeader } from '@angular/material/card';
import { MatCardTitle } from '@angular/material/card';
import { MatLabel } from '@angular/material/form-field';
import { MatError } from '@angular/material/form-field';



@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterModule, MatCard, MatCardContent, MatFormField, MatInput, MatButton, MatIcon, MatCardHeader,
    MatCardTitle, MatLabel , MatError],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})

export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword: string = '';


  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      return;
    }
    this.authService
      .register(this.email, this.password)
      .then(() => alert('Sikeres regisztráció!'))
      .catch((error) => alert(`Hiba: ${error.message}`));
  }
}
