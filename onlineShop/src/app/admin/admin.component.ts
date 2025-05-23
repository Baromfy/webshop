import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminComponent implements OnInit {
  activeTab: 'products' | 'users' = 'products';
  
  products: any[] = [];
  editingProduct: any = null;
  
  users: any[] = [];
  editingUser: any = null;
  newUser = {
    email: '',
    role: 'user'
  };

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadProducts();
    this.loadUsers();
  }

  async loadProducts() {
    try {
      const productsRef = collection(this.firestore, 'products');
      const snapshot = await getDocs(productsRef);
      this.products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Hiba a termékek betöltésekor:', error);
    }
  }

  editProduct(product: any) {
    this.editingProduct = { ...product };
  }

  async saveProduct() {
    if (!this.editingProduct) return;
    
    try {
      const productRef = doc(this.firestore, 'products', this.editingProduct.id);
      await updateDoc(productRef, {
        price: Number(this.editingProduct.price)
      });
      
      await this.loadProducts();
      this.editingProduct = null;
      alert('Termék ára sikeresen frissítve!');
    } catch (error) {
      console.error('Hiba a termék mentésekor:', error);
      alert('Hiba történt a mentés során!');
    }
  }

  async deleteProduct(productId: string) {
    if (!confirm('Biztosan törölni szeretnéd ezt a terméket?')) return;
    
    try {
      await deleteDoc(doc(this.firestore, 'products', productId));
      await this.loadProducts();
      alert('Termék sikeresen törölve!');
    } catch (error) {
      console.error('Hiba a termék törlésekor:', error);
      alert('Hiba történt a törlés során!');
    }
  }

  cancelEditProduct() {
    this.editingProduct = null;
  }

  async loadUsers() {
    try {
      const usersRef = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersRef);
      this.users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Hiba a felhasználók betöltésekor:', error);
    }
  }

  editUser(user: any) {
    this.editingUser = { ...user };
  }

  async saveUser() {
    if (!this.editingUser) return;
    
    try {
      const userRef = doc(this.firestore, 'users', this.editingUser.id);
      await updateDoc(userRef, {
        email: this.editingUser.email
      });
      
      await this.loadUsers();
      this.editingUser = null;
      alert('Felhasználó email címe sikeresen frissítve!');
    } catch (error) {
      console.error('Hiba a felhasználó mentésekor:', error);
      alert('Hiba történt a mentés során!');
    }
  }

  async deleteUser(userId: string) {
    if (!confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) return;
    
    try {
      await deleteDoc(doc(this.firestore, 'users', userId));
      await this.loadUsers();
      alert('Felhasználó sikeresen törölve!');
    } catch (error) {
      console.error('Hiba a felhasználó törlésekor:', error);
      alert('Hiba történt a törlés során!');
    }
  }

  async addUser() {
    if (!this.newUser.email) {
      alert('Kérjük, töltsd ki az email címet!');
      return;
    }

    try {
      const usersRef = collection(this.firestore, 'users');
      await addDoc(usersRef, {
        email: this.newUser.email,
        role: this.newUser.role,
        createdAt: new Date()
      });
      
      this.newUser = {
        email: '',
        role: 'user'
      };
      
      await this.loadUsers();
      alert('Felhasználó sikeresen hozzáadva!');
    } catch (error) {
      console.error('Hiba a felhasználó hozzáadásakor:', error);
      alert('Hiba történt a hozzáadás során!');
    }
  }

  cancelEditUser() {
    this.editingUser = null;
  }

  setActiveTab(tab: 'products' | 'users') {
    this.activeTab = tab;
  }
}
