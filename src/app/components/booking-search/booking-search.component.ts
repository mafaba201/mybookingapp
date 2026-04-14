import { Component, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface User {
  id: number;
  user: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface WorkSchedule {
  id?: number;
  day: string;
  startHour: string;
  endHour: string;
}

@Component({
  selector: 'app-booking-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-search.component.html',
  styleUrl: './booking-search.component.scss'
})
export class BookingSearchComponent implements OnInit {
  users: { id: string; user: string }[] = [];
  selectedUserId: string | null = null;
  loading = false;
  mobileMenuOpen = false;
  
  currentDate = signal(new Date());
  selectedDateValue = signal<Date | null>(null);
  availableSlots = signal<TimeSlot[]>([]);
  loadingSlots = signal(false);
  errorMessage = signal('');
  
  bookings = signal<any[]>([]);
  loadingBookings = signal(false);
  
  expandedBookingId: number | null = null;
  
  showModal = signal(false);
  selectedBookingServices: string[] = [];
  loadingServices = signal(false);
  
  workSchedules: WorkSchedule[] = [];
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      this.supabaseService.setAuthToken(token);
    }
    await this.loadUsers();
    await this.loadWorkSchedules();
  }

  async loadUsers() {
    this.loading = true;
    const users = await this.supabaseService.getUsersByType(2);
    this.users = users.map(u => ({ id: String(u.id), user: u.user }));
    this.loading = false;
  }

  async loadWorkSchedules() {
    const result = await this.supabaseService.getWorkSchedules();
    if (result.data && Array.isArray(result.data)) {
      this.workSchedules = result.data.map((slot: any) => ({
        id: slot.id,
        day: slot.day,
        startHour: slot.start_hour,
        endHour: slot.end_hour
      }));
    }
  }

  selectUser(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedUserId = select.value || null;
    this.selectedDateValue.set(null);
    this.availableSlots.set([]);
    this.errorMessage.set('');
  }

  getDayName(date: Date): string {
    return this.dayNames[date.getDay()];
  }

  getTodaySchedules(): WorkSchedule[] {
    if (!this.selectedDateValue()) return [];
    const dayName = this.getDayName(this.selectedDateValue()!);
    return this.workSchedules.filter(s => s.day === dayName);
  }

  async generateTimeSlots() {
    const slots: TimeSlot[] = [];
    
    if (!this.selectedDateValue()) {
      this.availableSlots.set(slots);
      return;
    }
    
    const dayName = this.getDayName(this.selectedDateValue()!);
    const schedules = this.workSchedules.filter(s => s.day === dayName);
    
    if (schedules.length === 0) {
      this.availableSlots.set([]);
      return;
    }
    
    const now = new Date();
    const isToday = this.selectedDateValue()!.toDateString() === now.toDateString();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const schedule of schedules) {
      const startMinutes = this.timeToMinutes(schedule.startHour);
      const endMinutes = this.timeToMinutes(schedule.endHour);
      
      let current = startMinutes;
      while (current < endMinutes) {
        if (!isToday || current > currentMinutes) {
          const hours = Math.floor(current / 60);
          const minutes = current % 60;
          const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          slots.push({ time: timeStr, available: true });
        }
        current += 30;
      }
    }
    
    if (this.selectedUserId && this.selectedDateValue()) {
      const dateStr = this.formatDate(this.selectedDateValue()!);
      const { slots: availabilitySlots, error } = await this.supabaseService.getAvailability(dateStr, this.selectedUserId);
      
      if (!error && availabilitySlots) {
        const bookedTimes = new Set(
          availabilitySlots.filter((s: TimeSlot) => !s.available).map((s: TimeSlot) => s.time)
        );
        
        slots.forEach(slot => {
          if (bookedTimes.has(slot.time)) {
            slot.available = false;
          }
        });
      }
    }
    
    slots.sort((a, b) => this.timeToMinutes(a.time) - this.timeToMinutes(b.time));
    this.availableSlots.set(slots);
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  selectDate(day: number) {
    if (day === 0) return;
    
    if (!this.selectedUserId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(this.currentDate().getFullYear(), this.currentDate().getMonth(), day);
      selected.setHours(0, 0, 0, 0);
      
      if (selected < today) {
        this.errorMessage.set('Solo puedes seleccionar fechas a partir de hoy');
        return;
      }
      
      this.errorMessage.set('');
      this.selectedDateValue.set(selected);
      this.bookings.set([]);
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(this.currentDate().getFullYear(), this.currentDate().getMonth(), day);
    selected.setHours(0, 0, 0, 0);
    
    if (selected < today) {
      this.errorMessage.set('Solo puedes seleccionar fechas a partir de hoy');
      return;
    }
    
    this.errorMessage.set('');
    this.selectedDateValue.set(selected);
    this.loadAvailability();
    this.loadBookings();
  }

  async loadBookings() {
    if (!this.selectedDateValue() || !this.selectedUserId) return;
    
    this.loadingBookings.set(true);
    const dateStr = this.formatDate(this.selectedDateValue()!);
    const bookings = await this.supabaseService.getBookingsWithClient(dateStr, this.selectedUserId);
    this.bookings.set(bookings);
    this.loadingBookings.set(false);
  }

  async loadAvailability() {
    this.loadingSlots.set(true);
    await this.generateTimeSlots();
    this.loadingSlots.set(false);
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  goBack() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control']);
  }

  get daysInMonth(): number[] {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: firstDay + daysInMonth }, (_, i) => 
      i < firstDay ? 0 : i - firstDay + 1
    );
  }

  get monthYear(): string {
    return this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  previousMonth() {
    this.currentDate.set(new Date(this.currentDate().getFullYear(), this.currentDate().getMonth() - 1, 1));
    this.selectedDateValue.set(null);
    this.availableSlots.set([]);
  }

  nextMonth() {
    this.currentDate.set(new Date(this.currentDate().getFullYear(), this.currentDate().getMonth() + 1, 1));
    this.selectedDateValue.set(null);
    this.availableSlots.set([]);
  }

  isSelected(day: number): boolean {
    if (!this.selectedDateValue() || day === 0) return false;
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    return this.selectedDateValue()!.getDate() === day && 
           this.selectedDateValue()!.getMonth() === month &&
           this.selectedDateValue()!.getFullYear() === year;
  }

  isToday(day: number): boolean {
    if (day === 0) return false;
    const today = new Date();
    return day === today.getDate() && 
           this.currentDate().getMonth() === today.getMonth() &&
           this.currentDate().getFullYear() === today.getFullYear();
  }

  isPast(day: number): boolean {
    if (day === 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(this.currentDate().getFullYear(), this.currentDate().getMonth(), day);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  openWhatsApp(phone: string | undefined) {
    if (!phone) return;
    const whatsappUrl = `https://wa.me/${phone.replace('+', '')}`;
    window.open(whatsappUrl, '_blank');
  }

  async cancelBooking(booking: any) {
    if (booking.canceled) return;
    
    console.log('Booking date:', booking.date, 'start_time:', booking.start_time);
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const dateParts = booking.date.split('/');
    const timeParts = booking.start_time.split(':');
    
    let bookingYear = parseInt(dateParts[2]);
    if (bookingYear < 100) bookingYear += 2000;
    
    const bookingDate = new Date(bookingYear, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
    const bookingHours = parseInt(timeParts[0]);
    const bookingMinutes = parseInt(timeParts[1]);
    
    const bookingDateTime = new Date(bookingYear, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), bookingHours, bookingMinutes);
    
    console.log('Now:', now, 'Booking datetime:', bookingDateTime);
    
    if (bookingDateTime < now) {
      alert('No puedes cancelar citas de fechas u horas pasadas');
      return;
    }
    
    if (confirm(`¿Cancelar la cita de ${booking.client?.name} a las ${booking.start_time}?`)) {
      const result = await this.supabaseService.cancelBooking(booking.id);
      if (result.success) {
        booking.canceled = true;
        this.bookings.set([...this.bookings()]);
      } else {
        alert('Error al cancelar la cita');
      }
    }
  }

  async viewBooking(booking: any) {
    this.loadingServices.set(true);
    this.showModal.set(true);
    this.selectedBookingServices = await this.supabaseService.getBookingServices(booking.id);
    this.loadingServices.set(false);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedBookingServices = [];
  }

  toggleBookingActions(bookingId: number) {
    if (window.innerWidth <= 768) {
      if (this.expandedBookingId === bookingId) {
        this.expandedBookingId = null;
      } else {
        this.expandedBookingId = bookingId;
      }
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.mobileMenuOpen = false;
  }
}