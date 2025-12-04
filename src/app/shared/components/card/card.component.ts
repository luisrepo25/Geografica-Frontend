import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses" class="bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl">
      <div *ngIf="header" class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">{{ header }}</h3>
        <p *ngIf="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
      </div>
      <div [class]="contentClasses">
        <ng-content></ng-content>
      </div>
      <div *ngIf="hasFooter" class="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
})
export class CardComponent {
  @Input() header = '';
  @Input() subtitle = '';
  @Input() padding = true;
  @Input() hasFooter = false;
  @Input() customClasses = '';

  get cardClasses(): string {
    return this.customClasses;
  }

  get contentClasses(): string {
    return this.padding ? 'p-6' : '';
  }
}
