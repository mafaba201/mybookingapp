import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface TimeSlot {
  id?: number;
  day: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-work-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-schedule.component.html',
  styleUrl: './work-schedule.component.scss'
})
export class WorkScheduleComponent implements OnInit {
  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  selectedDay = '';
  startTime = '';
  endTime = '';
  
  timeSlots: TimeSlot[] = [];
  
  errorMessage = '';
  successMessage = '';
  loading = false;
  userInfo: { userId?: number; username?: string; userTypeId?: number } | null = null;
  mobileMenuOpen = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      this.supabaseService.setAuthToken(token);
    }
    this.userInfo = this.supabaseService.getUserInfo();
    this.loadWorkSchedules();
  }

  async loadWorkSchedules() {
    this.loading = true;
    const result = await this.supabaseService.getWorkSchedules();
    this.loading = false;
    
    if (result.error) {
      this.errorMessage = result.error;
      return;
    }
    
    if (result.data && Array.isArray(result.data)) {
      this.timeSlots = result.data.map((slot: any) => ({
        id: slot.id,
        day: slot.day,
        startTime: slot.start_hour,
        endTime: slot.end_hour
      }));
    }
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  validateTimeOverlap(day: string, startTime: string, endTime: string): string {
    if (!startTime || !endTime) {
      return 'Debes completar ambas horas';
    }
    
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    if (start >= end) {
      return 'La hora de inicio debe ser menor que la hora fin';
    }

    const newStart = start;
    const newEnd = end;

    for (const slot of this.timeSlots) {
      if (slot.day !== day) continue;
      
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);
      
      if ((newStart >= slotStart && newStart < slotEnd) || 
          (newEnd > slotStart && newEnd <= slotEnd) ||
          (newStart <= slotStart && newEnd >= slotEnd)) {
        return `El horario se sobrepone con ${day} (${slot.startTime} - ${slot.endTime})`;
      }
    }

    return '';
  }

  async addTimeSlot() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedDay) {
      this.errorMessage = 'Selecciona un día';
      return;
    }

    if (!this.startTime || !this.endTime) {
      this.errorMessage = 'El horario no es válido';
      return;
    }

    const overlapError = this.validateTimeOverlap(this.selectedDay, this.startTime, this.endTime);
    if (overlapError) {
      this.errorMessage = overlapError;
      return;
    }

    const alreadyExists = this.timeSlots.some(
      s => s.day === this.selectedDay && s.startTime === this.startTime && s.endTime === this.endTime
    );

    if (alreadyExists) {
      this.errorMessage = 'Este horario ya existe';
      return;
    }

    this.loading = true;
    const result = await this.supabaseService.createWorkSchedule(
      this.selectedDay,
      this.startTime,
      this.endTime
    );
    this.loading = false;

    if (result.error) {
      this.errorMessage = result.error;
      return;
    }

    this.timeSlots.push({
      id: result.data?.id,
      day: this.selectedDay,
      startTime: this.startTime,
      endTime: this.endTime
    });

    this.selectedDay = '';
    this.startTime = '';
    this.endTime = '';
    this.successMessage = 'Horario agregado correctamente';
    
    setTimeout(() => this.successMessage = '', 3000);
  }

  async removeTimeSlot(index: number) {
    const slot = this.timeSlots[index];
    
    if (slot.id) {
      this.loading = true;
      const result = await this.supabaseService.deleteWorkSchedule(slot.id);
      this.loading = false;
      
      if (result.error) {
        this.errorMessage = result.error;
        return;
      }
    }
    
    this.timeSlots.splice(index, 1);
  }

  async saveSchedule() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.timeSlots.length === 0) {
      this.errorMessage = 'Debes agregar al menos un horario de trabajo';
      return;
    }

    this.loading = true;

    const results = await Promise.all(
      this.timeSlots.map(slot => 
        this.supabaseService.createWorkSchedule(slot.day, slot.startTime, slot.endTime)
      )
    );

    this.loading = false;

    const hasError = results.some(r => r.error);
    if (hasError) {
      this.errorMessage = results.find(r => r.error)?.error || 'Error al guardar horarios';
      this.successMessage = '';
    } else {
      this.successMessage = 'Horario guardado exitosamente';
      this.errorMessage = '';
      this.timeSlots = [];
    }
  }

  goHome() {
    this.router.navigate(['/panel-control']);
  }

  goBack() {
    this.router.navigate(['/panel-control']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.mobileMenuOpen = false;
  }
}