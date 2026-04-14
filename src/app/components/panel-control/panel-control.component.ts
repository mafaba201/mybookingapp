import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-panel-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-control.component.html',
  styleUrl: './panel-control.component.scss'
})
export class PanelControlComponent implements OnInit {
  userInfo: { userId?: number; username?: string; userTypeId?: number } | null = null;
  usersCount = 0;
  clientsCount = 0;
  bookingsCount = 0;
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
    this.userInfo = this.supabaseService.getUserInfo();
    await this.loadUsersCount();
    await this.loadClientsCount();
    await this.loadBookingsCount();
  }

  async loadUsersCount() {
    const users = await this.supabaseService.getUsers();
    this.usersCount = users.length;
  }

  async loadClientsCount() {
    const clients = await this.supabaseService.getClients();
    this.clientsCount = clients.length;
  }

  async loadBookingsCount() {
    const today = this.getTodayDateStr();
    const bookings = await this.supabaseService.getAllBookingsByDate(today);
    this.bookingsCount = bookings.length;
  }

  getTodayDateStr(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    return day + '/' + month + '/' + year;
  }

  goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }

  goToUsers() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control/users']);
  }

  goToWorkSchedule() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control/work-schedule']);
  }

  goToServices() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control/services']);
  }

  goToClients() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control/clients']);
  }

  goToBookingSearch() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control/booking-search']);
  }

  logout() {
    this.supabaseService.logout();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.mobileMenuOpen = false;
  }
}