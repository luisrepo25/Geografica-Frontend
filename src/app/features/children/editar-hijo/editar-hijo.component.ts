import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import { ChildService } from '../../../core/services/child.service';
import { Child, UpdateChildRequest } from '../../../core/models/child.model';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-editar-hijo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './editar-hijo.component.html'
})
export class EditarHijoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private childService = inject(ChildService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  child!: Child;
  loading = false;
  loadingChild = true;
  childId!: number;

  ngOnInit() {
    this.childId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Child ID desde ruta:', this.childId);
    
    if (!this.childId || isNaN(this.childId)) {
      Swal.fire({
        title: 'Error',
        text: 'ID de hijo inválido',
        icon: 'error',
        confirmButtonColor: '#1E5BFF'
      }).then(() => {
        this.router.navigate(['/children']);
      });
      return;
    }
    
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.minLength(2)]],
      telefono: ['', [Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]]
    });

    this.loadChild();
  }

  private loadChild() {
    console.log('Iniciando carga de hijo...');
    this.loadingChild = true;
    
    this.childService.getChildren().subscribe({
      next: (children) => {
        console.log('Hijos recibidos:', children);
        console.log('Buscando hijo con ID:', this.childId);
        const child = children.find(c => c.id === this.childId);
        console.log('Hijo encontrado:', child);
        
        if (!child) {
          this.loadingChild = false;
          this.cdr.detectChanges();
          Swal.fire({
            title: 'Error',
            text: 'Hijo no encontrado',
            icon: 'error',
            confirmButtonColor: '#1E5BFF'
          }).then(() => {
            this.router.navigate(['/children']);
          });
          return;
        }

        this.child = child;
        
        // Llenar formulario con datos actuales
        this.form.patchValue({
          nombre: child.nombre,
          apellido: child.apellido || '',
          telefono: child.telefono || '',
          email: child.email
        });

        // Deshabilitar email si está vinculado
        if (child.vinculado) {
          this.form.get('email')?.disable();
        }

        console.log('Hijo cargado exitosamente');
        this.loadingChild = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar hijo:', err);
        this.loadingChild = false;
        this.cdr.detectChanges();
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar datos del hijo',
          icon: 'error',
          confirmButtonColor: '#1E5BFF'
        }).then(() => {
          this.router.navigate(['/children']);
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    // Solo enviar campos que han cambiado y no están vacíos
    const formValue = this.form.value;
    const updateData: UpdateChildRequest = {};

    if (formValue.nombre && formValue.nombre !== this.child.nombre) {
      updateData.nombre = formValue.nombre;
    }

    if (formValue.apellido !== this.child.apellido) {
      updateData.apellido = formValue.apellido || undefined;
    }

    if (formValue.telefono !== this.child.telefono) {
      updateData.telefono = formValue.telefono || undefined;
    }

    if (!this.child.vinculado && formValue.email !== this.child.email) {
      updateData.email = formValue.email;
    }

    if (formValue.password) {
      updateData.password = formValue.password;
    }

    // Si no hay cambios
    if (Object.keys(updateData).length === 0) {
      Swal.fire({
        title: 'Sin cambios',
        text: 'No se detectaron cambios para guardar',
        icon: 'info',
        confirmButtonColor: '#1E5BFF'
      });
      this.loading = false;
      return;
    }

    this.childService.updateChild(this.childId, updateData).subscribe({
      next: () => {
        this.loading = false;
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Datos del hijo actualizados correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#1E5BFF'
        }).then(() => {
          this.router.navigate(['/children']);
        });
      },
      error: (err: any) => {
        this.loading = false;
        
        let errorMessage = 'Error al actualizar los datos';
        
        if (err.status === 409) {
          if (err.error?.message?.includes('vinculado')) {
            errorMessage = 'No se puede cambiar el email de un hijo ya vinculado';
          } else if (err.error?.message?.includes('email')) {
            errorMessage = 'El email ya está registrado';
          }
        } else if (err.status === 400 && Array.isArray(err.error?.message)) {
          errorMessage = err.error.message.join('\n');
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#1E5BFF'
        });
      }
    });
  }

  cancel() {
    this.router.navigate(['/children']);
  }
}
