import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ChildService } from '../../../core/services/child.service';
import { RegisterChildResponse } from '../../../core/models/child.model';
import Swal from 'sweetalert2';

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

  childForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    apellido: ['', [Validators.minLength(2)]],
    telefono: ['', [Validators.minLength(7)]]
    // ⚠️ NO incluir email ni password - backend los genera automáticamente
  });

  getFieldError(field: string): string {
    const control = this.childForm.get(field);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) return 'Este campo es requerido';
      if (control.errors?.['minlength']) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
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
    if (!formData.apellido || formData.apellido.trim() === '') delete formData.apellido;
    if (!formData.telefono || formData.telefono.trim() === '') delete formData.telefono;

    this.childService.registerChild(formData).subscribe({
      next: (response: RegisterChildResponse) => {
        this.loading.set(false);
        
        // Mostrar código de vinculación con SweetAlert2
        Swal.fire({
          title: '¡Hijo Registrado! 🎉',
          html: `
            <div class="text-left space-y-4">
              <p class="text-gray-700 mb-4">El hijo <strong>${response.nombre}</strong> ha sido registrado exitosamente.</p>
              <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <p class="text-sm text-yellow-800 font-semibold mb-2">📱 Código de Vinculación:</p>
                <div class="bg-white rounded px-4 py-3 border border-yellow-200">
                  <code class="text-2xl font-bold text-yellow-900 tracking-widest">${response.codigoVinculacion}</code>
                </div>
              </div>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p class="text-xs text-blue-800">
                  <strong>Importante:</strong> Tu hijo usará <strong>SOLO este código</strong> para acceder a la aplicación móvil. No necesita email ni contraseña, solo el código de 6 caracteres.
                </p>
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Copiar Código',
          confirmButtonColor: '#1E5BFF',
          showCancelButton: true,
          cancelButtonText: 'Cerrar'
        }).then((result) => {
          if (result.isConfirmed) {
            navigator.clipboard.writeText(response.codigoVinculacion);
            Swal.fire({
              title: '¡Copiado!',
              text: 'El código ha sido copiado al portapapeles',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
          this.router.navigate(['/children']);
        });
      },
      error: (error) => {
        this.loading.set(false);
        let errorMessage = 'Error al registrar hijo. Intenta de nuevo.';
        
        if (error.status === 409) {
          errorMessage = 'El email ya está registrado. Por favor usa otro email.';
        } else if (error.status === 400 && error.error?.message) {
          if (Array.isArray(error.error.message)) {
            errorMessage = error.error.message.join(', ');
          } else {
            errorMessage = error.error.message;
          }
        }
        
        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1E5BFF'
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/children']);
  }
}
