import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReviewService } from '../review.service';
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent implements OnInit {
  @Input() productId!: string;
  @Output() reviewAdded = new EventEmitter<void>();
  isUserLoggedIn = false;

  reviewForm = new FormGroup({
    comment: new FormControl('', [Validators.required, Validators.minLength(10)])
  });

  constructor(
    private reviewService: ReviewService,
    private auth: Auth,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Check if the user is logged in
    this.auth.onAuthStateChanged(user => {
      this.isUserLoggedIn = !!user;
    });
  }

  onSubmit() {
    if (this.reviewForm.valid && this.auth.currentUser) {
      this.reviewService.addReview(
        this.productId,
        this.reviewForm.value.comment!
      ).then(() => {
        this.snackBar.open('Véleményedet közzétettük!', 'OK', { duration: 3000 });
        this.reviewForm.reset({ comment: '' });
        this.reviewAdded.emit();
      }).catch(err => {
        this.snackBar.open('Hiba történt a vélemény küldésekor', 'Bezár', { duration: 3000 });
        console.error('Error adding review:', err);
      });
    }
  }
}
