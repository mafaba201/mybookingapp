import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-confirmation.component.html',
  styleUrl: './booking-confirmation.component.scss'
})
export class BookingConfirmationComponent implements OnInit {
  selectedDate = '';
  selectedTime = '';
  selectedUserId: string | null = null;
  barberName = '';
  barberPhone = '';
  
  name = '';
  email = '';
  phoneCode = '+521';
  phone = '';
  comment = '';
  errorMessage = signal('');
  loading = signal(false);
  
  availableServices: any[] = [];
  selectedServices: number[] = [];

  onServiceChange(serviceId: number, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedServices.push(serviceId);
    } else {
      this.selectedServices = this.selectedServices.filter(id => id !== serviceId);
    }
  }
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {}

ngOnInit() {
    this.route.queryParams.subscribe(async (params: any) => {
      this.selectedDate = params['date'] || '';
      this.selectedTime = params['time'] || '';
      this.selectedUserId = params['userId'] || null;
      
      if (this.selectedUserId) {
        await this.loadBarberInfo();
        await this.loadServices();
      }
    });
  }

  async loadServices() {
    const result = await this.supabaseService.getServices();
    if (result.data) {
      this.availableServices = result.data;
    }
  }

  async loadBarberInfo() {
    if (!this.selectedUserId) return;
    const userId = this.selectedUserId as string;
    const result = await this.supabaseService.getUserById(userId);
    if (result) {
      this.barberName = result.user || '';
      this.barberPhone = result.phone || '';
    }
  }

  get formattedDate(): string {
    if (!this.selectedDate) return '';
    const parts = this.selectedDate.split('/');
    if (parts.length !== 3) return this.selectedDate;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10) + 2000;
    
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  get formattedTime(): string {
    return this.selectedTime;
  }

  goBack() {
    this.router.navigate(['/booking']);
  }

  goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
  }

  async confirmBooking() {
    if (!this.name || !this.email) {
      this.errorMessage.set('Por favor, complete todos los campos');
      return;
    }

    if (!this.phone || this.phone.length !== 10 || !/^\d{10}$/.test(this.phone)) {
      this.errorMessage.set('Por favor, ingrese un teléfono válido de 10 dígitos');
      return;
    }

    if (!this.selectedDate || !this.selectedTime) {
      this.errorMessage.set('Por favor, seleccione fecha y hora');
      return;
    }

    try {
      this.loading.set(true);
      this.errorMessage.set('');
      
const endTime = this.calculateEndTime(this.selectedTime);
      
      if (!this.selectedUserId) {
        this.errorMessage.set('Error: no se selectedUserId');
        return;
      }

      const fullPhone = this.phoneCode + this.phone;
  
      console.log('Sending booking request:', {
        name: this.name,
        email: this.email,
        phone: fullPhone,
        date: this.selectedDate,
        startTime: this.selectedTime,
        endTime,
        comment: this.comment,
        userId: this.selectedUserId,
        services: this.selectedServices
      });

      const { data, error } = await this.supabaseService.createBooking(
        this.name,
        this.email,
        this.selectedDate,
        this.selectedTime,
        endTime,
        this.comment,
        this.selectedUserId,
        fullPhone,
        this.selectedServices
      );

      if (error) {
        throw new Error(error);
      }

      this.router.navigate(['/booking/finished'], {
        queryParams: { userId: this.selectedUserId, date: this.selectedDate, time: this.selectedTime }
      });
      
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al crear la reserva');
    } finally {
      this.loading.set(false);
    }
  }

  calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + 30;
    let endHours = hours;
    
    if (endMinutes >= 60) {
      endHours += 1;
    }
    
    return `${endHours.toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
  }
}