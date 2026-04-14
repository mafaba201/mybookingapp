import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, BookingCalendarComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  showBooking = false;
  isAuthenticated = false;
  mobileMenuOpen = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.supabaseService.isAuthenticated();
  }

  openBooking() {
    this.showBooking = true;
  }

  goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }

  goToBooking() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/booking']);
  }

  goToLogin() {
    this.mobileMenuOpen = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (this.isAuthenticated) {
      this.router.navigate(['/panel-control']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.supabaseService.logout();
    this.isAuthenticated = false;
    this.router.navigate(['/']);
  }

  scrollTo(sectionId: string) {
    this.showBooking = false;
    this.mobileMenuOpen = false;
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.mobileMenuOpen = false;
  }
}