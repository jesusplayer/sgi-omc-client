import { Component, ChangeDetectionStrategy, input, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormSection } from '../../models/form.models';
import { FormFieldComponent } from './form-field.component';

@Component({
    selector: 'app-generic-form',
    standalone: true,
    imports: [FormsModule, FormFieldComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
    </div>

    <form (ngSubmit)="onSave()" #form="ngForm" class="card" [style.max-width]="maxWidth()">
      
      <!-- Projection de contenu avant le formulaire dynamique (ex: un résumé ou un alert) -->
      <ng-content select="[form-header]"></ng-content>

      @for (section of schema(); track section.title || $index) {
        
        @if (section.title) {
          <h3 [style.margin]="$first ? '0 0 1rem' : '1.5rem 0 0.75rem'">{{ section.title }}</h3>
        }

        <div [class]="section.gridColumns ? 'grid grid-' + section.gridColumns : ''" [style.gap]="section.gridColumns ? '1rem' : '0'" [style.margin-bottom]="'1.5rem'">
          @for (field of section.fields; track field.key) {
             <app-form-field
               [config]="field"
               [(value)]="formData()[field.key]"
             ></app-form-field>
          }
        </div>
      }

      <!-- Projection de contenu après le formulaire dynamique (ex: un tableau secondaire) -->
      <ng-content select="[form-footer]"></ng-content>

      <div class="flex gap-2" [class.justify-between]="alignActions() === 'between'" [style.margin-top]="'2rem'">
        @if (alignActions() === 'between') {
           <button type="button" class="btn btn-secondary" (click)="onCancel()" [disabled]="saving()">← Retour</button>
           <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving() || disableSave()">
             {{ saving() ? '⏳...' : saveLabel() }}
           </button>
        } @else {
           <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving() || disableSave()">
             {{ saving() ? '⏳...' : saveLabel() }}
           </button>
           <button type="button" class="btn btn-outline" (click)="onCancel()" [disabled]="saving()">Annuler</button>
        }
      </div>
    </form>
  `
})
export class GenericFormComponent {
    title = input.required<string>();
    subtitle = input<string>('');

    schema = input.required<FormSection[]>();
    formData = model.required<any>(); // Le binding Two-Way de l'objet de données complèt

    saving = input<boolean>(false);
    disableSave = input<boolean>(false);
    saveLabel = input<string>('💾 Enregistrer');
    alignActions = input<'default' | 'between'>('default'); // 'between' place le bouton retour à gauche, save à droite.
    maxWidth = input<string>('auto'); // Ex: '600px' pour un petit formulaire, 'auto' pour prendre toute la place

    save = output<void>();
    cancel = output<void>();

    onSave() {
        this.save.emit();
    }

    onCancel() {
        this.cancel.emit();
    }
}
