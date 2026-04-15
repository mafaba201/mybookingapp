import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm = '';
  loading = false;
  errorMessage = '';
  mobileMenuOpen = false;
  expandedClientId: number | null = null;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      this.supabaseService.setAuthToken(token);
    }
    await this.loadClients();
  }

  async loadClients() {
    this.loading = true;
    this.clients = await this.supabaseService.getClients();
    this.filteredClients = this.clients;
    this.loading = false;
  }

  filterClients(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = term;
    
    if (!term) {
      this.filteredClients = this.clients;
    } else {
      this.filteredClients = this.clients.filter(client => 
        client.name.toLowerCase().includes(term) || 
        client.email.toLowerCase().includes(term) ||
        client.phone.toLowerCase().includes(term)
      );
    }
  }

  goBack() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/panel-control']);
  }

  openMessage(phone: string) {
    const whatsappUrl = `https://wa.me/${phone.replace('+', '')}`;
    window.open(whatsappUrl, '_blank');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  onRowClick(clientId: number) {
    if (window.innerWidth <= 768) {
      if (this.expandedClientId === clientId) {
        this.expandedClientId = null;
      } else {
        this.expandedClientId = clientId;
      }
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.mobileMenuOpen = false;
  }
}