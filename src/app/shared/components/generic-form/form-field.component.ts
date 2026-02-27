import { Component, ChangeDetectionStrategy, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField } from '../../models/form.models';

@Component({
    selector: 'app-form-field',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="form-group" [class.flex-row-checkbox]="config().type === 'checkbox'">
      @if (config().type !== 'checkbox') {
        <label class="form-label">
          {{ config().label }} @if(config().required) { * }
        </label>
      }

      @switch (config().type) {
        @case ('textarea') {
          <textarea 
            class="form-control" 
            [(ngModel)]="value"
            [name]="config().key"
            [required]="!!config().required"
            [disabled]="!!config().disabled"
            [placeholder]="config().placeholder || ''"
            [rows]="config().rows || 3"
          ></textarea>
        }
        
        @case ('select') {
          <select 
            class="form-control"
            [(ngModel)]="value"
            [name]="config().key"
            [required]="!!config().required"
            [disabled]="!!config().disabled"
          >
            @if(config().placeholder) {
              <option value="">{{ config().placeholder }}</option>
            }
            @for (opt of config().options; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        }

        @case ('checkbox') {
          <label class="flex" style="align-items:center;gap:0.5rem;cursor:pointer;padding-bottom:10px">
            <input 
              type="checkbox"
              [(ngModel)]="value"
              [name]="config().key"
              [required]="!!config().required"
              [disabled]="!!config().disabled"
              style="width:1.2rem;height:1.2rem;accent-color:var(--primary)"
            />
            <span class="font-medium">{{ config().label }}</span>
          </label>
        }

        @case ('color') {
          <div class="flex" style="align-items:center;gap:0.5rem">
            <input 
              type="color" 
              [(ngModel)]="value"
              [name]="config().key"
              [required]="!!config().required"
              [disabled]="!!config().disabled"
              style="width:50px;height:38px;padding:0;border:1px solid var(--border-color);border-radius:4px;cursor:pointer"
            />
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="value" 
              [name]="config().key + '_text'" 
              placeholder="#HEXCODE" 
              style="flex:1"
              [disabled]="!!config().disabled"
            />
          </div>
        }

        @default {
          <input 
            class="form-control" 
            [type]="config().type"
            [(ngModel)]="value"
            [name]="config().key"
            [required]="!!config().required"
            [disabled]="!!config().disabled"
            [placeholder]="config().placeholder || ''"
            [min]="config().min"
            [max]="config().max"
            [step]="config().step"
          />
        }
      }
    </div>
  `,
    styles: [`
    .flex-row-checkbox {
      display: flex;
      align-items: flex-end;
      height: 100%; /* Important if placed in a grid to align bottom */
    }
  `]
})
export class FormFieldComponent {
    config = input.required<FormField>();
    value = model<any>();
}
