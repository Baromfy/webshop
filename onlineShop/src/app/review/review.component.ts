import { Component, Input } from '@angular/core';
import { ReviewService } from '../review.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, DatePipe],
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewListComponent {
  @Input() productId!: string;
  reviews: any[] = [];
  loading = true;

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.loading = true;
    this.reviewService.getReviewsForProduct(this.productId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.loading = false;
      }
    });
  }
}
