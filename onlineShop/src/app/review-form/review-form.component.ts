import { Component, Input, Output, EventEmitter } from '@angular/core';
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
export class ReviewFormComponent {
  @Input() productId!: string;
  @Output() reviewAdded = new EventEmitter<void>();

  reviewForm = new FormGroup({
    rating: new FormControl(5, [Validators.required, Validators.min(1), Validators.max(5)]),
    comment: new FormControl('', [Validators.required, Validators.minLength(10)])
  });

  constructor(
    private reviewService: ReviewService,
    private auth: Auth,
    private snackBar: MatSnackBar
  ) {}

  onSubmit() {
    if (this.reviewForm.valid && this.auth.currentUser) {
      const userName = this.auth.currentUser.displayName || 'Anonim';
      this.reviewService.addReview(
        this.productId,
        this.reviewForm.value.rating!,
        this.reviewForm.value.comment!,
        userName
      ).then(() => {
        this.snackBar.open('Értékelésedet közzétettük!', 'OK', { duration: 3000 });
        this.reviewForm.reset({ rating: 5, comment: '' });
        this.reviewAdded.emit();
      }).catch(err => {
        this.snackBar.open('Hiba történt az értékelés küldésekor', 'Bezár', { duration: 3000 });
        console.error('Error adding review:', err);
      });
    }
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
  }
}
