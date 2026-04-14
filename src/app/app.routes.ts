import { Routes } from '@angular/router';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { HomePageComponent } from './components/home-page/home-page.component';
import { BookingCalendarComponent } from './components/booking-calendar/booking-calendar.component';
import { BookingConfirmationComponent } from './components/booking-confirmation/booking-confirmation.component';
import { BookingFinishedComponent } from './components/booking-finished/booking-finished.component';
import { PanelControlComponent } from './components/panel-control/panel-control.component';
import { UsersComponent } from './components/users/users.component';
import { WorkScheduleComponent } from './components/work-schedule/work-schedule.component';
import { ServicesComponent } from './components/services/services.component';
import { ClientsComponent } from './components/clients/clients.component';
import { BookingSearchComponent } from './components/booking-search/booking-search.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'panel-control', component: PanelControlComponent, canActivate: [authGuard] },
  { path: 'panel-control/users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'panel-control/work-schedule', component: WorkScheduleComponent, canActivate: [authGuard] },
  { path: 'panel-control/services', component: ServicesComponent, canActivate: [authGuard] },
  { path: 'panel-control/clients', component: ClientsComponent, canActivate: [authGuard] },
  { path: 'panel-control/booking-search', component: BookingSearchComponent, canActivate: [authGuard] },
  { path: 'booking', component: BookingCalendarComponent },
  { path: 'booking/confirmation', component: BookingConfirmationComponent },
  { path: 'booking/finished', component: BookingFinishedComponent }
];
