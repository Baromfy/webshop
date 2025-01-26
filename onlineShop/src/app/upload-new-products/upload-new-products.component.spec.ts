import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadNewProductsComponent } from './upload-new-products.component';

describe('UploadNewProductsComponent', () => {
  let component: UploadNewProductsComponent;
  let fixture: ComponentFixture<UploadNewProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadNewProductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadNewProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
