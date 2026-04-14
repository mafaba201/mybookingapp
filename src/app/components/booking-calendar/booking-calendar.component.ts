import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface WorkSchedule {
  id?: number;
  day: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-calendar.component.html',
  styleUrl: './booking-calendar.component.scss'
})
export class BookingCalendarComponent implements OnInit {
  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  selectedTime = signal<string | null>(null);
  availableSlots = signal<TimeSlot[]>([]);
  loadingSlots = signal(false);
  
  showForm = signal(false);
  bookingSuccess = signal(false);
  errorMessage = signal('');
  
  users: { id: string; user: string }[] = [];
  selectedUserId: string | null = null;
  loadingUsers = signal(false);
  
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  workSchedules: WorkSchedule[] = [];
  dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadUsers();
    await this.loadWorkSchedules();
    this.generateTimeSlots();
  }

  async loadUsers() {
    this.loadingUsers.set(true);
    const users = await this.supabaseService.getUsersByType(2);
    console.log('=== loadUsers ===');
    console.log('Users loaded:', users);
    console.log('Users length:', users.length);
    this.users = users.map(u => ({ id: u.id, user: u.user }));
    this.loadingUsers.set(false);
  }

  selectUser(event: Event) {
    const select = event.target as HTMLSelectElement;
    console.log('selectUser called, value:', select.value);
    this.selectedUserId = select.value || null;
    console.log('selectedUserId set to:', this.selectedUserId);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.availableSlots.set([]);
  }

  async loadWorkSchedules() {
    const result = await this.supabaseService.getWorkSchedules();
    if (result.data && Array.isArray(result.data)) {
      this.workSchedules = result.data.map((slot: any) => ({
        id: slot.id,
        day: slot.day,
        startTime: slot.start_hour,
        endTime: slot.end_hour
      }));
      console.log('Work schedules loaded:', this.workSchedules);
    }
  }

  getDayName(date: Date): string {
    return this.dayNames[date.getDay()];
  }

  getTodaySchedules(): WorkSchedule[] {
    if (!this.selectedDate()) return [];
    const dayName = this.getDayName(this.selectedDate()!);
    return this.workSchedules.filter(s => s.day === dayName);
  }

  async generateTimeSlots() {
    const slots: TimeSlot[] = [];
    console.log('=== generateTimeSlots START ===');
    console.log('selectedDate:', this.selectedDate());
    console.log('selectedUserId:', this.selectedUserId);
    console.log('workSchedules:', this.workSchedules);
    
    if (!this.selectedDate()) {
      console.log('No selected date, returning empty');
      this.availableSlots.set(slots);
      return;
    }
    
    const dayName = this.getDayName(this.selectedDate()!);
    console.log('Day name:', dayName);
    
    const schedules = this.workSchedules.filter(s => s.day === dayName);
    console.log('schedules for selected day:', schedules);
    
    if (schedules.length === 0) {
      console.log('No schedules for this day - check work_schedule table');
      this.availableSlots.set([]);
      return;
    }
    
    const now = new Date();
    const isToday = this.selectedDate()!.toDateString() === now.toDateString();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const schedule of schedules) {
      const startMinutes = this.timeToMinutes(schedule.startTime);
      const endMinutes = this.timeToMinutes(schedule.endTime);
      
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
    
    if (this.selectedUserId && this.selectedDate()) {
      const dateStr = this.formatDate(this.selectedDate()!);
      const { slots: availabilitySlots, error } = await this.supabaseService.getAvailability(dateStr, this.selectedUserId);
      
      if (!error && availabilitySlots) {
        const bookedTimes = new Set(
          availabilitySlots.filter(s => !s.available).map(s => s.time)
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

  goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/']);
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
  }

  nextMonth() {
    this.currentDate.set(new Date(this.currentDate().getFullYear(), this.currentDate().getMonth() + 1, 1));
  }

  selectDate(day: number) {
    console.log('selectDate called with day:', day);
    if (day === 0) return;
    
    if (!this.selectedUserId) {
      this.errorMessage.set('Selecciona un barbero primero');
      console.log('No selectedUserId');
      return;
    }
    
    console.log('selectedUserId:', this.selectedUserId);
    console.log('selectedUserId type:', typeof this.selectedUserId);
    console.log('workSchedules:', this.workSchedules);
    
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const selected = new Date(year, month, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    if (selected < today) {
      this.errorMessage.set('Solo puedes seleccionar fechas a partir de hoy');
      return;
    }
    
    this.errorMessage.set('');
    this.selectedDate.set(selected);
    this.selectedTime.set(null);
    this.showForm.set(false);
    console.log('Date selected:', selected);
    this.loadAvailability();
  }

  async loadAvailability() {
    console.log('loadAvailability called');
    this.generateTimeSlots();
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  selectTime(time: string) {
    this.selectedTime.set(time);
  }

  proceedToForm() {
    if (this.selectedDate() && this.selectedTime() && this.selectedUserId) {
      const dateStr = this.formatDate(this.selectedDate()!);
      this.router.navigate(['/booking/confirmation'], {
        queryParams: {
          date: dateStr,
          time: this.selectedTime(),
          userId: this.selectedUserId
        }
      });
    }
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  isSelected(day: number): boolean {
    if (!this.selectedDate() || day === 0) return false;
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    return this.selectedDate()!.getDate() === day && 
           this.selectedDate()!.getMonth() === month &&
           this.selectedDate()!.getFullYear() === year;
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
}
