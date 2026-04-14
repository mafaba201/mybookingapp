import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface Service {
  id?: number;
  name: string;
  price: number;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  
  serviceName = '';
  servicePrice: number | null = null;
  
  editingServiceId: number | null = null;
  expandedServiceId: number | null = null;
  
  errorMessage = '';
  successMessage = '';
  loading = false;
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
    await this.loadServices();
  }

  async loadServices() {
    this.loading = true;
    const result = await this.supabaseService.getServices();
    this.loading = false;
    
    if (result.data && Array.isArray(result.data)) {
      this.services = result.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price
      }));
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.serviceName || !this.servicePrice) {
      this.errorMessage = 'Nombre y precio son obligatorios';
      return;
    }

    if (this.servicePrice <= 0) {
      this.errorMessage = 'El precio debe ser mayor a 0';
      return;
    }

    this.saveService();
  }

  async saveService() {
    this.loading = true;

    if (this.editingServiceId) {
      const { error } = await this.supabaseService.updateService(
        this.editingServiceId,
        this.serviceName,
        this.servicePrice!
      );
      this.loading = false;

      if (error) {
        this.errorMessage = error;
      } else {
        this.successMessage = 'Servicio actualizado exitosamente';
        this.cancelEdit();
        await this.loadServices();
      }
    } else {
      const { data, error } = await this.supabaseService.createService(
        this.serviceName,
        this.servicePrice!
      );
      this.loading = false;

      if (error) {
        this.errorMessage = error;
        return;
      }

      this.successMessage = 'Servicio creado exitosamente';
      this.clearForm();
      await this.loadServices();
    }
  }

  editService(service: Service) {
    this.editingServiceId = service.id!;
    this.serviceName = service.name;
    this.servicePrice = service.price;
  }

  async deleteService(service: Service) {
    if (!service.id) return;
    
    if (!confirm(`Eliminar el servicio "${service.name}"?`)) {
      return;
    }

    this.loading = true;
    const { error } = await this.supabaseService.deleteService(service.id);
    this.loading = false;

    if (error) {
      this.errorMessage = error;
    } else {
      this.successMessage = 'Servicio eliminado exitosamente';
      await this.loadServices();
    }
  }

  cancelEdit() {
    this.editingServiceId = null;
    this.clearForm();
  }

  clearForm() {
    this.serviceName = '';
    this.servicePrice = null;
  }

  goBack() {
    this.router.navigate(['/panel-control']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  onRowClick(serviceId: number | undefined, event: Event) {
    event.stopPropagation();
    if (serviceId) {
      this.expandedServiceId = this.expandedServiceId === serviceId ? null : serviceId;
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.mobileMenuOpen = false;
  }
}