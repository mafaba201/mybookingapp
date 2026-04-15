import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface UserType {
  id: number;
  type: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  username = '';
  phone = '';
  countryCode = '+521';
  password = '';
  confirmPassword = '';
  selectedUserType = '';
  
  showPassword = false;
  showConfirmPassword = false;
  
  userTypes: UserType[] = [];
  users: any[] = [];
  visiblePasswords: { [key: number]: boolean } = {};
  errorMessage = '';
  successMessage = '';
  tableErrorMessage = '';
  tableSuccessMessage = '';
  loading = false;
  editingUserId: number | null = null;
  activeActionsUserId: number | null = null;
  actionsMenuOpen = false;
  expandedUserId: number | null = null;
  mobileMenuOpen = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      this.supabaseService.setAuthToken(token);
    }
    await this.loadUserTypes();
    await this.loadUsers();
  }

  async loadUserTypes() {
    this.userTypes = await this.supabaseService.getUserTypes();
  }

  async loadUsers() {
    this.users = await this.supabaseService.getUsers();
  }

  goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }

  goBack() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onKeyPress(event: KeyboardEvent) {
    const char = String.fromCharCode(event.which);
    if (!/^\d$/.test(char)) {
      event.preventDefault();
    }
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleTablePasswordVisibility(userId: number) {
    this.visiblePasswords[userId] = !this.visiblePasswords[userId];
  }

  isPasswordVisible(userId: number): boolean {
    return this.visiblePasswords[userId] || false;
  }

  getUserTypeName(userTypeId: number): string {
    const userType = this.userTypes.find(t => t.id === userTypeId);
    return userType ? userType.type : 'Desconocido';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  validatePassword(): boolean {
    const password = this.password;
    
    if (password.length < 8) {
      this.errorMessage = 'La contrasena debe tener al menos 8 caracteres';
      return false;
    }
    
    const numbers = password.replace(/[^0-9]/g, '').length;
    if (numbers < 2) {
      this.errorMessage = 'La contrasena debe contener al menos 2 numeros';
      return false;
    }
    
    const specialChars = /[#$,%!@]/g;
    if (!specialChars.test(password)) {
      this.errorMessage = 'La contrasena debe contener al menos un caracter especial (#, $, %, !, @)';
      return false;
    }
    
    return true;
  }

  validatePasswordMatch() {
    if (this.confirmPassword && this.password && this.confirmPassword !== this.password) {
      this.errorMessage = 'Las contrasenas no coinciden';
    } else {
      this.errorMessage = '';
    }
  }

  validatePhone(): boolean {
    if (this.editingUserId) {
      if (!this.phone || this.phone.length !== 14) {
        this.errorMessage = 'El telefono debe tener 14 caracteres';
        return false;
      }
    } else {
      const phoneDigits = this.phone.replace(/\D/g, '');
      if (!this.phone || phoneDigits.length !== 10 || !/^\d{10}$/.test(phoneDigits)) {
        this.errorMessage = 'El telefono debe tener 10 digitos';
        return false;
      }
    }
    return true;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.username || !this.selectedUserType) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (!this.validatePhone()) {
      return;
    }

    if (!this.editingUserId) {
      if (!this.password || !this.confirmPassword) {
        this.errorMessage = 'Todos los campos son obligatorios';
        return;
      }

      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Las contrasenas no coinciden';
        return;
      }

      if (!this.validatePassword()) {
        return;
      }
    }

    if (this.editingUserId && this.password) {
      if (!this.validatePassword()) {
        return;
      }
    }

    this.createUser();
  }

  async createUser() {
    this.loading = true;
    const userTypeId = parseInt(this.selectedUserType, 10);
    
    if (isNaN(userTypeId)) {
      this.errorMessage = 'Selecciona un tipo de usuario';
      this.loading = false;
      return;
    }

    let phoneInput = this.phone.trim();
    let phoneToSave = this.editingUserId ? phoneInput : this.countryCode + phoneInput.replace(/\D/g, '').substring(0, 10);

    if (this.editingUserId) {
      const { error } = await this.supabaseService.updateUser(
        this.editingUserId,
        this.username,
        phoneToSave,
        this.password,
        userTypeId
      );

      this.loading = false;

      if (error) {
        this.errorMessage = error;
        this.successMessage = '';
      } else {
        this.successMessage = 'Usuario actualizado exitosamente';
        this.errorMessage = '';
        this.cancelEdit();
        await this.loadUsers();
        this.clearMessages();
      }
    } else {
      const { data, error } = await this.supabaseService.createUser(
        this.username,
        phoneToSave,
        this.password,
        userTypeId
      );

      this.loading = false;

      if (error) {
        this.errorMessage = error;
        return;
      }

      this.successMessage = 'Usuario creado exitosamente';
      this.errorMessage = '';
      this.clearForm();
      await this.loadUsers();
      this.clearMessages();
    }
  }

  clearForm() {
    this.username = '';
    this.phone = '';
    this.countryCode = '+521';
    this.password = '';
    this.confirmPassword = '';
    this.selectedUserType = '';
  }

  clearMessages() {
    setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
      this.tableErrorMessage = '';
      this.tableSuccessMessage = '';
    }, 5000);
  }

  async deleteUser(user: any) {
    if (confirm(`¿Estás seguro de eliminar el usuario "${user.user}"?`)) {
      const result = await this.supabaseService.deleteUser(user.id);
      if (result.error) {
        this.tableErrorMessage = result.error;
        this.tableSuccessMessage = '';
      } else {
        this.tableSuccessMessage = 'Usuario eliminado exitosamente';
        this.tableErrorMessage = '';
        await this.loadUsers();
      }
      this.clearMessages();
    }
  }

  editUser(user: any) {
    this.editingUserId = user.id;
    this.username = user.user;
    this.phone = user.phone || '';
    this.countryCode = '';
    this.password = '';
    this.confirmPassword = '';
    this.selectedUserType = String(user.user_type_id);
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit() {
    this.editingUserId = null;
    this.clearForm();
  }

  onRowClick(userId: number, event: Event) {
    event.stopPropagation();
    if (window.innerWidth <= 768) {
      if (this.expandedUserId === userId) {
        this.expandedUserId = null;
      } else {
        this.expandedUserId = userId;
      }
    }
  }

  onActionClick(event: Event) {
    event.stopPropagation();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.expandedUserId = null;
    this.mobileMenuOpen = false;
  }
}