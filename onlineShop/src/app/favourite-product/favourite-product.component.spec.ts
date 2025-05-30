import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavouriteProductComponent } from './favourite-product.component';

describe('FavouriteProductComponent', () => {
  let component: FavouriteProductComponent;
  let fixture: ComponentFixture<FavouriteProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavouriteProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavouriteProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
