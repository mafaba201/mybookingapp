import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email = '';
  password = '';
  keepSession = false;
  errorMessage = '';
  loading = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async login() {
    this.errorMessage = '';
    
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa email y contrasena';
      return;
    }

    this.loading = true;

    const result = await this.supabaseService.loginUser(this.email, this.password, this.keepSession);

    this.loading = false;

    if (result.error) {
      this.errorMessage = result.error;
      return;
    }

    await this.supabaseService.setAuthToken(result.data.token);
    
    const userInfo = this.supabaseService.getUserInfo();
    console.log('Usuario logueado:', userInfo);
    
    this.router.navigate(['/panel-control']);
  }

  goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }
}
