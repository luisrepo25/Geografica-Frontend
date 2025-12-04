import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ChildService } from '../../../core/services/child.service';
import { RegisterChildResponse } from '../../../core/models/child.model';

@Component({
  selector: 'app-registrar-hijo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, InputComponent],
  templateUrl: './registrar-hijo.component.html'
})
export class RegistrarHijoComponent {
  private fb = inject(FormBuilder);
  private childService = inject(ChildService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  showCodeModal = signal(false);
  vinculationCode = signal('');
  codeCopied = signal(false);

  childForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    latitud: ['', [Validators.min(-90), Validators.max(90)]],
    longitud: ['', [Validators.min(-180), Validators.max(180)]]
  });

  getFieldError(field: string): string {
    const control = this.childForm.get(field);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) return 'Este campo es requerido';
      if (control.errors?.['email']) return 'Email inválido';
      if (control.errors?.['minlength']) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
      if (control.errors?.['min']) return `Valor mínimo: ${control.errors?.['min'].min}`;
      if (control.errors?.['max']) return `Valor máximo: ${control.errors?.['max'].max}`;
    }
    return '';
  }

  onSubmit(): void {
    if (this.childForm.invalid) {
      Object.keys(this.childForm.controls).forEach(key => {
        this.childForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const formData = { ...this.childForm.value };
    
    // Convertir valores vacíos a undefined
    if (!formData.apellido) delete formData.apellido;
    if (!formData.telefono) delete formData.telefono;
    if (!formData.latitud || formData.latitud === '') delete formData.latitud;
    if (!formData.longitud || formData.longitud === '') delete formData.longitud;
    
    // Convertir a números si existen
    if (formData.latitud) formData.latitud = parseFloat(formData.latitud);
    if (formData.longitud) formData.longitud = parseFloat(formData.longitud);

    this.childService.registerChild(formData).subscribe({
      next: (response: RegisterChildResponse) => {
        this.loading.set(false);
        this.vinculationCode.set(response.codigoVinculacion);
        this.showCodeModal.set(true);
      },
      error: (error) => {
        this.loading.set(false);
        if (error.status === 409) {
          this.errorMessage.set('El email ya está registrado');
        } else if (error.error?.message) {
          if (Array.isArray(error.error.message)) {
            this.errorMessage.set(error.error.message.join(', '));
          } else {
            this.errorMessage.set(error.error.message);
          }
        } else {
          this.errorMessage.set('Error al registrar hijo. Intenta de nuevo.');
        }
      }
    });
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.vinculationCode());
    this.codeCopied.set(true);
    setTimeout(() => this.codeCopied.set(false), 2000);
  }

  closeModal(): void {
    this.showCodeModal.set(false);
    this.router.navigate(['/children']);
  }

  goBack(): void {
    this.router.navigate(['/children']);
  }
}
