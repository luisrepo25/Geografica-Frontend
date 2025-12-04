import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputComponent,
    ButtonComponent,
    CardComponent
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      tipo: ['padre', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  get nombre() {
    return this.registerForm.get('nombre');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get tipo() {
    return this.registerForm.get('tipo');
  }

  get acceptTerms() {
    return this.registerForm.get('acceptTerms');
  }

  getNombreError(): string {
    if (this.nombre?.hasError('required') && this.nombre?.touched) {
      return 'El nombre es requerido';
    }
    if (this.nombre?.hasError('minlength') && this.nombre?.touched) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    return '';
  }

  getEmailError(): string {
    if (this.email?.hasError('required') && this.email?.touched) {
      return 'El email es requerido';
    }
    if (this.email?.hasError('email') && this.email?.touched) {
      return 'Ingresa un email válido';
    }
    return '';
  }

  getPasswordError(): string {
    if (this.password?.hasError('required') && this.password?.touched) {
      return 'La contraseña es requerida';
    }
    if (this.password?.hasError('minlength') && this.password?.touched) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  getConfirmPasswordError(): string {
    if (this.confirmPassword?.hasError('required') && this.confirmPassword?.touched) {
      return 'Confirma tu contraseña';
    }
    if (this.confirmPassword?.hasError('passwordMismatch') && this.confirmPassword?.touched) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { confirmPassword, acceptTerms, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: () => {
        // Después de registrar, hacer login automáticamente
        this.authService.login({
          email: registerData.email,
          password: registerData.password
        }).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.loading = false;
            // Si falla el login automático, redirigir a login
            this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 409) {
          this.errorMessage = 'Este email ya está registrado';
        } else {
          this.errorMessage = 'Ocurrió un error. Intenta nuevamente.';
        }
      }
    });
  }
}
