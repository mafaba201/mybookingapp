import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-booking-finished',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-finished.component.html',
  styleUrl: './booking-finished.component.scss'
})
export class BookingFinishedComponent implements OnInit {
  selectedUserId: string | null = null;
  selectedDate = '';
  selectedTime = '';
  barberPhone = '';
  barberName = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      this.supabaseService.setAuthToken(token);
    }

    this.route.queryParams.subscribe(async (params: any) => {
      this.selectedUserId = params['userId'] || null;
      this.selectedDate = params['date'] || '';
      this.selectedTime = params['time'] || '';

      if (this.selectedUserId) {
        await this.loadBarberInfo();
      }
    });
  }

  async loadBarberInfo() {
    if (!this.selectedUserId) return;
    const userId = this.selectedUserId as string;
    const result = await this.supabaseService.getUserById(userId);
    if (result) {
      this.barberPhone = result.phone || '';
      this.barberName = result.user || '';
    }
  }

  openWhatsApp() {
    if (!this.barberPhone) return;

    const phone = this.barberPhone.replace(/\D/g, '');
    const message = `Hola ${this.barberName}, tengo una reserva el ${this.selectedDate} a las ${this.selectedTime}. Quiero confirmar mi cita.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }
}